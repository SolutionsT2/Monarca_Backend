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
import {
  EmailWarning,
  NotificationsService,
} from 'src/notifications/notifications.service';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { PolicyEngineService } from 'src/policy-engine/policy-engine.service';
import { Department } from 'src/departments/entity/department.entity';
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';

interface VoucherPolicyPreviewInput {
  id_request?: string;
  class: string;
  amount?: number;
  amount_mxn?: number;
  currency?: string;
  date?: string;
  has_xml?: boolean;
  has_pdf?: boolean;
  is_foreign?: boolean;
}
import { ApproverSubstituteService } from './services/approver-substitute.service';
import { RequestApprovalStep } from './entities/request-approval-step.entity';


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
    @InjectRepository(RequestApprovalStep)
    private readonly requestApprovalStepsRepo: Repository<RequestApprovalStep>,
    @InjectRepository(DocumentClass)
    private readonly documentClassRepo: Repository<DocumentClass>,
    private readonly requestsService: RequestsService,
    private readonly notificationsService: NotificationsService,
    private readonly travelAgenciesChecks: TravelAgenciesChecks,
    private readonly policyEngineService: PolicyEngineService,
    private readonly approverSubstituteService: ApproverSubstituteService,

  ) {}

  private async getVoucherDocumentClassId(): Promise<string> {
    const documentClass = await this.documentClassRepo.findOne({
      where: { key: 'gv' },
    });

    if (!documentClass) {
      throw new NotFoundException('Document class with key gv not found.');
    }

    return documentClass.id;
  }

  private buildPreviewVoucherContext(
    id_request: string,
    vouchers: VoucherPolicyPreviewInput[],
  ) {
    return vouchers.map((voucher, index) => ({
      id: `preview-${index + 1}`,
      id_request,
      class: voucher.class || '',
      amount: Number(voucher.amount_mxn ?? voucher.amount ?? 0),
      currency: voucher.currency || 'MXN',
      file_url_pdf: voucher.has_pdf ? 'preview://pdf' : null,
      file_url_xml: voucher.has_xml ? 'preview://xml' : null,
      is_foreign: voucher.is_foreign ?? false,
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
      throw new UnauthorizedException(
        'Unable to validate vouchers for request.',
      );

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
              Number(voucher.amount_mxn ?? voucher.amount) > 0 ||
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
            ...destinations.map((d) => new Date(d.departure_date).getTime()),
          ),
        )
      : null;

    const tripEndDate = destinations.length
      ? new Date(
          Math.max(
            ...destinations.map((d) => new Date(d.arrival_date).getTime()),
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
      await this.requestsRepo.update(request.id, { id_company: fallbackCompanyId });
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

    return {
      policy_summary: {
        ...summary,
        violations: summary.violations.map((violation) => ({
          ...violation,
          evaluated_value: undefined,
        })),
      },
    };
  }

  async approve(
    req: RequestInterface,
    id_request: string,
    data: ApproveRequestDTO,
  ) {
    await this.approverSubstituteService.reassignRequestIfNeeded(id_request);

    const id_user = req.sessionInfo.id;
    const id_travel_agency = data.id_travel_agency;

    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: [
        'user',
        'SOI',
        'destination',
        'requests_destinations',
        'requests_destinations.destination',
      ],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    const canApprove =
      await this.approverSubstituteService.isAuthorizedToApprove(
        request.id_admin,
        id_user,
      );
    if (!canApprove)
      throw new UnauthorizedException('Unable to approve request.');

    if (request.status !== 'Pending Review')
      throw new ConflictException(
        'Unable to approve because of the requests current status.',
      );

    if (!(await this.travelAgenciesChecks.Exists(id_travel_agency))) {
      throw new BadRequestException('Invalid travel agency id.');
    }

    const currentApprovalStep = await this.requestApprovalStepsRepo.findOne({
      where: {
        idRequest: id_request,
        status: 'pending',
      },
      order: { order: 'ASC' },
    });

    if (currentApprovalStep) {
      currentApprovalStep.status = 'approved';
      currentApprovalStep.approvedAt = new Date();
      currentApprovalStep.idApprovedBy = id_user;

      await this.requestApprovalStepsRepo.save(currentApprovalStep);

      const nextApprovalStep = await this.requestApprovalStepsRepo.findOne({
        where: {
          idRequest: id_request,
          status: 'pending',
        },
        order: { order: 'ASC' },
      });

      if (nextApprovalStep) {
        const nextApproverId =
          await this.approverSubstituteService.resolveApprover(
            nextApprovalStep.idApprover,
          );

        await this.requestsRepo.update(
          { id: id_request },
          {
            id_admin: nextApproverId,
            id_travel_agency: id_travel_agency,
          },
        );

        const updated = await this.requestsRepo.findOne({
          where: { id: id_request },
          relations: ['user', 'admin', 'SOI'],
        });

        if (!updated) {
          throw new NotFoundException('Invalid request id');
        }

        const emailWarnings: EmailWarning[] = [];

        const nextApproverEmailWarning =
          await this.notificationsService.notifyOrWarn({
            to: updated.admin.email,
            subject: 'Nueva solicitud pendiente de tu aprobación',
            text: `La solicitud "${updated.title}" requiere tu aprobación como parte de la cadena jerárquica.`,
            html: `<p>Hola ${updated.admin.name},</p>
<p>La solicitud "<strong>${updated.title}</strong>" fue aprobada por el nivel anterior y ahora requiere tu aprobación.</p>
<p>Por favor, revisa los detalles en el sistema.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
            failureMessage:
              'La cadena de aprobación avanzó, pero no se pudo notificar al siguiente aprobador.',
          });

        if (nextApproverEmailWarning) {
          emailWarnings.push(nextApproverEmailWarning);
        }

        return Object.assign(updated, {
          emailWarnings,
          approvalChainContinues: true,
        });
      }
    }

    const finalApproverUpdate: {
      id_travel_agency: string;
      id_admin?: string;
    } = { id_travel_agency };

    if (id_user !== request.id_admin) {
      finalApproverUpdate.id_admin = id_user;
    }

    await this.requestsRepo.update({ id: id_request }, finalApproverUpdate);

    const emailWarnings: EmailWarning[] = [];

    const detailedRequest = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: [
        'user',
        'SOI',
        'admin',
        'destination',
        'requests_destinations',
        'requests_destinations.destination',
        'travelAgency',
      ],
    });
    const summary = this.requestsService.buildRequestSummaryHtml(
      detailedRequest || request,
    );
    const loginUrl = this.requestsService.getLoginUrl();
    const loginLine = loginUrl
      ? `<p>Ingresa a la plataforma para revisar la solicitud: <a href="${loginUrl}">${loginUrl}</a></p>`
      : '<p>Ingresa a la plataforma para revisar la solicitud.</p>';

    const soiEmail = detailedRequest?.SOI?.email ?? request.SOI.email;
    const soiName = detailedRequest?.SOI?.name ?? request.SOI.name;

    const soiEmailWarning = await this.notificationsService.notifyOrWarn({
      to: soiEmail,
      subject: 'Solicitud pendiente de aprobacion contable',
      text: `Tienes la solicitud "${request.id}" por aprobar. Ingresa a la plataforma para revisarla.`,
      html: `<p>Hola ${soiName},</p>
<p>Tienes la solicitud <strong>${request.id}</strong> por aprobar.</p>
${summary}
${loginLine}
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      failureMessage:
        'La solicitud fue aprobada, pero no se pudo enviar el correo de notificacion al SOI.',
    });

    if (soiEmailWarning) {
      emailWarnings.push(soiEmailWarning);
    }

    const updated = await this.requestsService.updateStatus(
      id_request,
      'Pending Accounting Approval',
    );

    return Object.assign(updated, { emailWarnings });
  }

  async deny(req: RequestInterface, id_request: string) {
    await this.approverSubstituteService.reassignRequestIfNeeded(id_request);

    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: [
        'user',
        'destination',
        'requests_destinations',
        'requests_destinations.destination',
        'travelAgency',
      ],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    const canDeny = await this.approverSubstituteService.isAuthorizedToApprove(
      request.id_admin,
      id_user,
    );
    if (!canDeny) throw new UnauthorizedException('Unable to deny request.');

    if (request.status !== 'Pending Review')
      throw new ConflictException(
        'Unable to deny because of the requests current status.',
      );

    const currentApprovalStep = await this.requestApprovalStepsRepo.findOne({
      where: {
        idRequest: id_request,
        status: 'pending',
      },
      order: { order: 'ASC' },
    });

    if (currentApprovalStep) {
      currentApprovalStep.status = 'denied';
      currentApprovalStep.idApprovedBy = id_user;
      currentApprovalStep.approvedAt = new Date();

      await this.requestApprovalStepsRepo.save(currentApprovalStep);
    }

    const emailWarnings: EmailWarning[] = [];

    const updated = await this.requestsService.updateStatus(id_request, 'Denied');
    return Object.assign(updated, { emailWarnings });
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

    const emailWarnings: EmailWarning[] = [];

    const updated = await this.requestsService.updateStatus(id_request, 'Cancelled');
    return Object.assign(updated, { emailWarnings });
  }

  async finishedReservations(req: RequestInterface, id_request: string) {
    const id_travel_agency = req.userInfo.id_travel_agency;

    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: [
        'user',
        'destination',
        'requests_destinations',
        'requests_destinations.destination',
        'travelAgency',
      ],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (!(id_travel_agency && id_travel_agency === request.id_travel_agency))
      throw new UnauthorizedException('Unable to change requests status.');

    if (request.status !== 'Pending Reservations')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    const emailWarnings: EmailWarning[] = [];

    const summary = this.requestsService.buildRequestSummaryHtml(request);
    const loginUrl = this.requestsService.getLoginUrl();
    const loginLine = loginUrl
      ? `<p>Ingresa a la plataforma para revisar la solicitud: <a href="${loginUrl}">${loginUrl}</a></p>`
      : '<p>Ingresa a la plataforma para revisar la solicitud.</p>';

    const requesterEmailWarning = await this.notificationsService.notifyOrWarn({
      to: request.user.email,
      subject: 'Solicitud lista para comprobacion de gastos',
      text: `Ya puedes subir tus comprobantes para la solicitud "${request.id}". Ingresa a la plataforma para continuar.`,
      html: `<p>Hola ${request.user.name},</p>
<p>Tu solicitud <strong>${request.id}</strong> ya cuenta con reservaciones. Puedes continuar con la carga de comprobantes.</p>
${summary}
${loginLine}
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      failureMessage:
        'Las reservaciones fueron registradas, pero no se pudo enviar el correo de notificación al solicitante.',
    });

    if (requesterEmailWarning) {
      emailWarnings.push(requesterEmailWarning);
    }

    const updated = await this.requestsService.updateStatus(id_request, 'In Progress');
    return Object.assign(updated, { emailWarnings });
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

    const emailWarnings: EmailWarning[] = [];

    const summary = this.requestsService.buildRequestSummaryHtml(request);
    const loginUrl = this.requestsService.getLoginUrl();
    const loginLine = loginUrl
      ? `<p>Ingresa a la plataforma para revisar la solicitud: <a href="${loginUrl}">${loginUrl}</a></p>`
      : '<p>Ingresa a la plataforma para revisar la solicitud.</p>';

    await this.vouchersRepo.delete({ id_request });

    const agents = await this.travelAgenciesChecks.getTravelAgencyUsers(
      request.id_travel_agency,
    );

    for (const agent of agents) {
      const agentEmailWarning = await this.notificationsService.notifyOrWarn({
        to: agent.email,
        subject: 'Solicitud lista para reservaciones',
        text: `Tienes la solicitud "${request.id}" lista para registrar vuelos y hospedaje. Ingresa a la plataforma para continuar.`,
        html: `<p>Hola ${agent.name},</p>
<p>Tienes la solicitud <strong>${request.id}</strong> lista para registrar vuelos y hospedaje.</p>
${summary}
${loginLine}
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
        failureMessage: `La aprobación contable fue registrada, pero no se pudo enviar el correo de notificación al agente ${agent.email}.`,
      });

      if (agentEmailWarning) emailWarnings.push(agentEmailWarning);
    }

    const updated = await this.requestsService.updateStatus(
      id_request,
      'Pending Reservations',
    );

    return Object.assign(updated, { emailWarnings });
  }

  async finishedUploadingVouchers(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: [
        'admin',
        'requests_destinations',
        'requests_destinations.destination',
        'user',
        'user.department',
        'destination',
        'travelAgency',
      ],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_user !== id_user)
      throw new UnauthorizedException('Unable to change status on request.');

    if (request.status !== 'In Progress')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    const vouchers = await this.vouchersRepo.find({ where: { id_request } });

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
            ...destinations.map((d) => new Date(d.departure_date).getTime()),
          ),
        )
      : null;

    const tripEndDate = destinations.length
      ? new Date(
          Math.max(
            ...destinations.map((d) => new Date(d.arrival_date).getTime()),
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
        amount_mxn: voucher.amount_mxn ?? null,
        currency: voucher.currency,
        file_url_pdf: voucher.file_url_pdf,
        file_url_xml: voucher.file_url_xml,
        date: voucher.date,
      })),
    );

    if (!summary.can_submit) {
      await this.vouchersRepo.delete({ id_request });

      throw new UnprocessableEntityException({
        statusCode: 422,
        message: 'Policy validation failed. Resolve violations before submit.',
        policy_summary: summary,
      });
    }

    const emailWarnings: EmailWarning[] = [];

    const summaryEmail = this.requestsService.buildRequestSummaryHtml(request);
    const loginUrl = this.requestsService.getLoginUrl();
    const loginLine = loginUrl
      ? `<p>Ingresa a la plataforma para revisar la solicitud: <a href="${loginUrl}">${loginUrl}</a></p>`
      : '<p>Ingresa a la plataforma para revisar la solicitud.</p>';

    const adminEmailWarning = await this.notificationsService.notifyOrWarn({
      to: request.admin.email,
      subject: 'Solicitud pendiente de aprobacion de comprobantes',
      text: `Tienes la solicitud "${request.id}" lista para aprobar comprobantes. Ingresa a la plataforma para continuar.`,
      html: `<p>Hola ${request.admin.name},</p>
<p>Tienes la solicitud <strong>${request.id}</strong> lista para aprobar comprobantes.</p>
${summaryEmail}
${loginLine}
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      failureMessage:
        'La solicitud de reembolso fue enviada, pero no se pudo enviar el correo de notificación al aprobador.',
    });

    if (adminEmailWarning) emailWarnings.push(adminEmailWarning);

    const updated = await this.requestsService.updateStatus(
      id_request,
      'Pending Vouchers Approval',
    );

    return Object.assign(updated, { emailWarnings });
  }

  async finishedApprovingVouchers(req: RequestInterface, id_request: string) {
    await this.approverSubstituteService.reassignRequestIfNeeded(id_request);

    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: [
        'user',
        'SOI',
        'destination',
        'requests_destinations',
        'requests_destinations.destination',
        'travelAgency',
      ],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_admin !== id_user)
      throw new UnauthorizedException('Unable to change status on request.');

    if (request.status !== 'Pending Vouchers Approval')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    const emailWarnings: EmailWarning[] = [];

    const summaryEmail = this.requestsService.buildRequestSummaryHtml(request);
    const loginUrl = this.requestsService.getLoginUrl();
    const loginLine = loginUrl
      ? `<p>Ingresa a la plataforma para revisar la solicitud: <a href="${loginUrl}">${loginUrl}</a></p>`
      : '<p>Ingresa a la plataforma para revisar la solicitud.</p>';

    const soiEmailWarning = await this.notificationsService.notifyOrWarn({
      to: request.SOI.email,
      subject: 'Solicitud pendiente de registro de reembolso',
      text: `Tienes la solicitud "${request.id}" lista para registrar el reembolso. Ingresa a la plataforma para continuar.`,
      html: `<p>Hola ${request.SOI.name},</p>
<p>Tienes la solicitud <strong>${request.id}</strong> lista para registrar el reembolso.</p>
${summaryEmail}
${loginLine}
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      failureMessage:
        'La comprobación fue aprobada, pero no se pudo enviar el correo de notificación al SOI.',
    });

    if (soiEmailWarning) emailWarnings.push(soiEmailWarning);

    const updated = await this.requestsService.updateStatus(
      id_request,
      'Pending Refund Approval',
    );

    return Object.assign(updated, { emailWarnings });
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

    const emailWarnings: EmailWarning[] = [];

    const updated = await this.requestsService.updateStatus(id_request, 'Completed');
    return Object.assign(updated, { emailWarnings });
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-04-15 | Juan de Dios Gastélum Flores | Wrapped all notificationsService.notify() calls in try-catch to prevent email failures from aborting status transitions.
 * - 2026-04-29 | Juan de Dios Gastélum Flores | Added email warning responses for request status transitions when notification delivery fails.
 * - 2026-05-12 | Juan de Dios Gastélum | Added hierarchical approval step progression before accounting approval. Added email notification to next approver when approval chain advances. Changed approve/deny authorization to allow substitute approvers via isAuthorizedToApprove.
 */
