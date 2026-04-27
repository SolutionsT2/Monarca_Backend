/**
 * File: requests.status.service.ts
 * Description: Service for request status transitions (approve, deny, cancel, finished reservations, SOI, vouchers, complete) and notifications.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsService } from './requests.service';
import { ApproveRequestDTO } from './dto/approve-request.dto';
import { TravelAgenciesChecks } from 'src/travel-agencies/travel-agencies.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { PolicyEngineService } from 'src/policy-engine/policy-engine.service';
import { Department } from 'src/departments/entity/department.entity';
interface VoucherPolicyPreviewInput {
  id_request?: string;
  class: string;
  amount: number;
  currency?: string;
  date?: string;
  has_xml?: boolean;
  has_pdf?: boolean;
}
// STATUSES (order after creation):
// Pending Review → (approver) → Pending Accounting Approval (SOI) → Pending Reservations (travel agent) → In Progress → …
// ['Pending Review', 'Changes Needed', 'Denied', 'Cancelled', 'Pending Accounting Approval', 'Pending Reservations', 'In Progress', 'Pending Vouchers Approval', 'Pending Refund Approval', 'Completed']

@Injectable()
export class RequestsStatusService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(Voucher)
    private readonly vouchersRepo: Repository<Voucher>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    private readonly requestsService: RequestsService,
    private readonly notificationsService: NotificationsService,
    private readonly travelAgenciesChecks: TravelAgenciesChecks,
    private readonly policyEngineService: PolicyEngineService,
  ) {}

  private buildPreviewVoucherContext(
    id_request: string,
    vouchers: VoucherPolicyPreviewInput[],
  ) {
    return vouchers.map((voucher, index) => ({
      id: `preview-${index + 1}`,
      id_request,
      class: voucher.class || '',
      amount: Number(voucher.amount || 0),
      currency: voucher.currency || 'MXN',
      file_url_pdf: voucher.has_pdf ? 'preview://pdf' : null,
      file_url_xml: voucher.has_xml ? 'preview://xml' : null,
      date: voucher.date ? new Date(voucher.date) : new Date(''),
    }));
  }

  async previewVoucherPolicy(
    req: RequestInterface,
    id_request: string,
    vouchers: VoucherPolicyPreviewInput[],
  ) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['requests_destinations', 'user', 'user.department'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_user !== id_user)
      throw new UnauthorizedException('Unable to validate vouchers for request.');

    if (request.status !== 'In Progress')
      throw new ConflictException(
        'Unable to validate vouchers because of the requests current status.',
      );

    const normalizedVouchers = Array.isArray(vouchers)
      ? vouchers
          .filter((voucher) => {
            const hasData =
              Boolean(voucher.class) ||
              Boolean(voucher.date) ||
              Number(voucher.amount) > 0 ||
              Boolean(voucher.has_pdf) ||
              Boolean(voucher.has_xml);
            return hasData;
          })
          .map((voucher) => ({
            ...voucher,
            id_request,
          }))
      : [];

    const hasAdvance = Number(request.advance_money || 0) > 0;
    const destinations = request.requests_destinations || [];

    const tripStartDate = destinations.length
      ? new Date(
          Math.min(
            ...destinations.map((destination) =>
              new Date(destination.departure_date).getTime(),
            ),
          ),
        )
      : null;

    const tripEndDate = destinations.length
      ? new Date(
          Math.max(
            ...destinations.map((destination) =>
              new Date(destination.arrival_date).getTime(),
            ),
          ),
        )
      : null;

    if (hasAdvance && normalizedVouchers.length === 0) {
      return {
        policy_summary: {
          total_rules: 1,
          passed: 0,
          failed: 1,
          blocking_violations: 1,
          can_submit: false,
          violations: [
            {
              policy_id: 'ADVANCE_REQUIRES_VOUCHERS',
              policy_code: 'ADVANCE_REQUIRES_VOUCHERS',
              passed: false,
              message:
                'Advance exists on request, but no vouchers were uploaded for reimbursement.',
              severity: 'BLOCKING',
              consequence: 'POLICY_VIOLATION',
              can_override: false,
            },
          ],
        },
      };
    }

    if (!request.id_company) {
      const fallbackCompanyId =
        request.user?.department?.id_company ||
        (request.user?.idDepartment
          ? (
              await this.departmentRepo.findOne({
                where: { id: request.user.idDepartment },
                select: ['id', 'id_company'],
              })
            )?.id_company
          : undefined);

      if (!fallbackCompanyId) {
        throw new ConflictException(
          'Unable to evaluate reimbursement policies because request company context is missing.',
        );
      }

      request.id_company = fallbackCompanyId;
      await this.requestsRepo.update(request.id, {
        id_company: fallbackCompanyId,
      });
    }

      const summary = await this.policyEngineService.evaluateRequestSubmission(
      {
        id: request.id,
        id_company: request.id_company,
        advance_money: request.advance_money,
        createdAt: request.createdAt,
        trip_start_date: tripStartDate,
        trip_end_date: tripEndDate,
      },
      this.buildPreviewVoucherContext(id_request, normalizedVouchers),
      { persist: false },
    );

    return { policy_summary: summary };
  }

  async approve(
    req: RequestInterface,
    id_request: string,
    data: ApproveRequestDTO,
  ) {
    const id_user = req.sessionInfo.id;
    const id_travel_agency = data.id_travel_agency;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user', 'SOI'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    // Validate travel agency id
    if (!(await this.travelAgenciesChecks.Exists(id_travel_agency)))
      throw new BadRequestException('Invalid travel agency id.');

    if (request.id_admin !== id_user)
      throw new UnauthorizedException('Unable to approve request.');

    if (request.status !== 'Pending Review')
      throw new ConflictException(
        'Unable to approve because of the requests current status.',
      );

    await this.requestsRepo.update(
      { id: id_request },
      { id_travel_agency: id_travel_agency },
    );

    // Email failure should not abort status transition
    try {
      await this.notificationsService.notify(
        request.user.email,
        'Solicitud aprobada — pendiente de contabilidad',
        `Tu solicitud "${request.title}" fue aprobada por tu aprobador y está pendiente de revisión de contabilidad (SOI) antes de las reservaciones.`,
        `<p>Hola ${request.user.name},</p>
<p>Tu solicitud "<strong>${request.title}</strong>" fue aprobada y está pendiente de revisión contable antes de que la agencia de viajes realice las reservaciones.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error(
        'Failed to send approval notification to requester:',
        emailError,
      );
    }

    try {
      await this.notificationsService.notify(
        request.SOI.email,
        'Solicitud pendiente de tu aprobación',
        `La solicitud "${request.title}" fue aprobada por el aprobador y requiere tu revisión antes de las reservaciones.`,
        `<p>Hola ${request.SOI.name},</p>
<p>La solicitud "<strong>${request.title}</strong>" está pendiente de tu aprobación contable. Después podrá continuar la agencia de viajes con las reservaciones.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error(
        'Failed to send approval notification to SOI:',
        emailError,
      );
    }

    return await this.requestsService.updateStatus(
      id_request,
      'Pending Accounting Approval',
    );
  }

  async deny(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_admin !== id_user)
      throw new UnauthorizedException('Unable to deny request.');

    if (request.status !== 'Pending Review')
      throw new ConflictException(
        'Unable to deny because of the requests current status.',
      );

    // Email failure should not abort status transition
    try {
      await this.notificationsService.notify(
        request.user.email,
        'Solicitud de viaje denegada',
        `Tu solicitud de viaje con el título "${request.title}" ha sido denegada.`,
        `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido denegada.</p>
<p>Por favor, revisa los detalles de tu solicitud y considera realizar los cambios necesarios.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error('Failed to send denial notification:', emailError);
    }

    return await this.requestsService.updateStatus(id_request, 'Denied');
  }

  async cancel(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_user !== id_user)
      throw new UnauthorizedException('Unable to cancel request.');

    if (
      request.status !== 'Pending Review' &&
      request.status !== 'Changes Needed'
    )
      throw new ConflictException(
        'Unable to cancel because of the requests current status.',
      );

    // Email failure should not abort status transition
    try {
      await this.notificationsService.notify(
        request.user.email,
        'Solicitud de viaje cancelada',
        `Tu solicitud de viaje con el título "${request.title}" ha sido cancelada.`,
        `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido cancelada.</p>
<p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error('Failed to send cancellation notification:', emailError);
    }

    return await this.requestsService.updateStatus(id_request, 'Cancelled');
  }

  async finishedReservations(req: RequestInterface, id_request: string) {
    const id_travel_agency = req.userInfo.id_travel_agency;

    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    // console.log("Scenario 1: ")
    // console.log (`(!(id_travel_agency && id_travel_agency === request.id_travel_agency)) ${(!(id_travel_agency && id_travel_agency === request.id_travel_agency))}`)
    // console.log("Scenario 2: ")
    // console.log (` (!!id_travel_agency && id_travel_agency !== request.id_travel_agency) ${ (!!id_travel_agency && id_travel_agency !== request.id_travel_agency)}`)

    if (!(id_travel_agency && id_travel_agency === request.id_travel_agency))
      // Needs further testing
      throw new UnauthorizedException('Unable to change requests status.');

    if (request.status !== 'Pending Reservations')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    // Email failure should not abort status transition
    try {
      await this.notificationsService.notify(
        request.user.email,
        'Reservaciones registradas',
        `La solicitud "${request.title}" tiene las reservaciones listas. Puedes continuar con el siguiente paso en el sistema.`,
        `<p>Hola ${request.user.name},</p>
<p>La solicitud "<strong>${request.title}</strong>" tiene las reservaciones registradas por la agencia de viajes.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error(
        'Failed to send finished reservations notification:',
        emailError,
      );
    }

    return await this.requestsService.updateStatus(id_request, 'In Progress');
  }

  async SOIApproval(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_SOI !== id_user)
      throw new UnauthorizedException('Unable to approve request.');

    if (request.status !== 'Pending Accounting Approval')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    if (!request.id_travel_agency) {
      throw new BadRequestException(
        'Request has no travel agency assigned; cannot continue to reservations.',
      );
    }

    // Email failure should not abort status transition
    try {
      await this.notificationsService.notify(
        request.user.email,
        'Contabilidad aprobada — reservas pendientes',
        `Tu solicitud "${request.title}" fue aprobada contablemente. La agencia de viajes realizará las reservaciones.`,
        `<p>Hola ${request.user.name},</p>
<p>Tu solicitud "<strong>${request.title}</strong>" fue aprobada en contabilidad. La agencia asignada procederá con las reservaciones.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error('Failed to send SOI approval notification:', emailError);
    }

    // Start each voucher-upload cycle from a clean slate for this request.
    await this.vouchersRepo.delete({ id_request });

    const agents = await this.travelAgenciesChecks.getTravelAgencyUsers(
      request.id_travel_agency,
    );

    for (const agent of agents) {
      try {
        await this.notificationsService.notify(
          agent.email,
          'Puedes iniciar las reservaciones',
          `La solicitud "${request.title}" está lista para que registres hotel/vuelo según corresponda.`,
          `<p>Hola ${agent.name},</p>
<p>La solicitud "<strong>${request.title}</strong>" ya cuenta con aprobación contable. Puedes proceder con las reservaciones.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
        );
      } catch (emailError) {
        console.error(
          `Failed to send post-SOI notification to agent ${agent.email}:`,
          emailError,
        );
      }
    }

    return await this.requestsService.updateStatus(
      id_request,
      'Pending Reservations',
    );
  }

  async finishedUploadingVouchers(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['admin', 'requests_destinations', 'user', 'user.department'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_user !== id_user)
      throw new UnauthorizedException('Unable to change status on request.');

    if (request.status !== 'In Progress')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    const vouchers = await this.vouchersRepo.find({
      where: { id_request },
    });

    // Guard against duplicated relation state and ensure deterministic totals.
    const uniqueVouchers = vouchers.filter(
      (voucher, index, list) =>
        list.findIndex((candidate) => candidate.id === voucher.id) === index,
    );

    if (uniqueVouchers.length === 0) {
      throw new ConflictException(
        'Unable to finish uploading vouchers because no valid voucher was uploaded for this request.',
      );
    }

    const hasAdvance = Number(request.advance_money || 0) > 0;
    const destinations = request.requests_destinations || [];

    const tripStartDate = destinations.length
      ? new Date(
          Math.min(
            ...destinations.map((destination) => new Date(destination.departure_date).getTime()),
          ),
        )
      : null;

    const tripEndDate = destinations.length
      ? new Date(
          Math.max(
            ...destinations.map((destination) => new Date(destination.arrival_date).getTime()),
          ),
        )
      : null;

    if (hasAdvance && uniqueVouchers.length === 0) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message:
          'Cannot submit reimbursement without vouchers when an advance was requested.',
        policy_summary: {
          total_rules: 1,
          passed: 0,
          failed: 1,
          blocking_violations: 1,
          can_submit: false,
          violations: [
            {
              policy_id: 'ADVANCE_REQUIRES_VOUCHERS',
              policy_code: 'ADVANCE_REQUIRES_VOUCHERS',
              passed: false,
              message:
                'Advance exists on request, but no vouchers were uploaded for reimbursement.',
              severity: 'BLOCKING',
              consequence: 'POLICY_VIOLATION',
              can_override: false,
            },
          ],
        },
      });
    }

    if (!request.id_company) {
      const fallbackCompanyId =
        request.user?.department?.id_company ||
        (request.user?.idDepartment
          ? (
              await this.departmentRepo.findOne({
                where: { id: request.user.idDepartment },
                select: ['id', 'id_company'],
              })
            )?.id_company
          : undefined);

      if (!fallbackCompanyId) {
        throw new ConflictException(
          'Unable to evaluate reimbursement policies because request company context is missing.',
        );
      }

      request.id_company = fallbackCompanyId;
      await this.requestsRepo.update(request.id, { id_company: fallbackCompanyId });
    }

    // Evaluate reimbursement policies before moving the request to approval.
    const summary = await this.policyEngineService.evaluateRequestSubmission(
      {
        id: request.id,
        id_company: request.id_company,
        advance_money: request.advance_money,
        createdAt: request.createdAt,
        trip_start_date: tripStartDate,
        trip_end_date: tripEndDate,
      },
      uniqueVouchers.map((voucher) => ({
        id: voucher.id,
        id_request: voucher.id_request,
        class: voucher.class,
        amount: voucher.amount,
        currency: voucher.currency,
        file_url_pdf: voucher.file_url_pdf,
        file_url_xml: voucher.file_url_xml,
        date: voucher.date,
      })),
    );

    if (!summary.can_submit) {
      // Always reset uploaded vouchers after a failed submit to avoid amount carry-over on retries.
      await this.vouchersRepo.delete({ id_request });

      throw new UnprocessableEntityException({
        statusCode: 422,
        message: 'Policy validation failed. Resolve violations before submit.',
        policy_summary: summary,
      });
    }

    // Email failure should not abort status transition
    try {
      await this.notificationsService.notify(
        request.admin.email,
        'Solicitud de viaje pendiente de aprobación de comprobantes',
        `La solicitud de viaje con el título "${request.title}" ha finalizado la carga de comprobantes y está pendiente de tu aprobación.`,
        `<p>Hola ${request.admin.name},</p>
<p>La solicitud de viaje con el título "<strong>${request.title}</strong>" ha finalizado la carga de comprobantes y está pendiente de tu aprobación.</p>
<p>Por favor, revisa los comprobantes cargados y procede con la aprobación.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error('Failed to send voucher upload notification:', emailError);
    }

    return await this.requestsService.updateStatus(
      id_request,
      'Pending Vouchers Approval',
    );
  }

  // Status changes from Pending Vouchers Approval to Pending Refund Approval
  async finishedApprovingVouchers(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user', 'SOI'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_admin !== id_user)
      throw new UnauthorizedException('Unable to change status on request.');

    if (request.status !== 'Pending Vouchers Approval')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    // Email failure should not abort status transition
    try {
      await this.notificationsService.notify(
        request.user.email,
        'Comprobación de gastos del viaje completada',
        `Tu comprobación de gastos del viaje con el título "${request.title}" ha sido completada y está pendiente de aprobación de reembolso.`,
        `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido aprobada y está pendiente de aprobación de reembolso.</p>
<p>Por favor, espera a que se realice la aprobación de reembolso.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error(
        'Failed to send voucher approval notification to user:',
        emailError,
      );
    }

    // Email failure should not abort status transition
    try {
      await this.notificationsService.notify(
        request.SOI.email,
        'Solicitud de viaje pendiente de aprobación de reembolso',
        `La solicitud de viaje con el título "${request.title}" ha finalizado la comprobación de gastos y está pendiente de tu aprobación de reembolso.`,
        `<p>Hola ${request.SOI.name},</p>
<p>La solicitud de viaje con el título "<strong>${request.title}</strong>" ha finalizado la comprobación de gastos y está pendiente de tu aprobación de reembolso.</p>
<p>Por favor, revisa los detalles de la solicitud y procede con la aprobación de reembolso.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error(
        'Failed to send refund approval notification to SOI:',
        emailError,
      );
    }

    return await this.requestsService.updateStatus(
      id_request,
      'Pending Refund Approval',
    );
  }

  async finsihedRegisteringRequest(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_SOI !== id_user)
      throw new UnauthorizedException('Unable to change status on request.');

    if (request.status !== 'Pending Refund Approval')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    // Email failure should not abort status transition
    try {
      await this.notificationsService.notify(
        request.user.email,
        'Solicitud de viaje completada',
        `Tu solicitud de viaje con el título "${request.title}" ha sido completada y registrada.`,
        `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido completada y registrada.</p>
<p>En breve se realizará su reembolso si aplica.</p>
<p>Gracias por utilizar Monarca para gestionar tus viajes.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    } catch (emailError) {
      console.error('Failed to send completion notification:', emailError);
    }

    return await this.requestsService.updateStatus(id_request, 'Completed');
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-04-15 | Juan de Dios Gastélum Flores | Wrapped all notificationsService.notify() calls in try-catch to prevent email failures from aborting status transitions.
 */