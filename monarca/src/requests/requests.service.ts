/**
 * File: requests.service.ts
 * Description: Service for request CRUD, creation/update logging, and status updates.
 */

import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';
import { UserChecks } from 'src/users/user.checks.service';
import { DestinationsChecks } from 'src/destinations/destinations.checks';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsDestination } from './entities/requests-destination.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';
import {
  EmailWarning,
  NotificationsService,
} from 'src/notifications/notifications.service';
import { PolicyViolation } from 'src/policy-engine/entities/policy-violation.entity';
import { Department } from 'src/departments/entity/department.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(DocumentClass)
    private readonly documentClassRepo: Repository<DocumentClass>,
    @InjectRepository(PolicyViolation)
    private readonly policyViolationRepo: Repository<PolicyViolation>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    private readonly userChecks: UserChecks,
    private readonly destinationChecks: DestinationsChecks,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  private async getCityName(id: string): Promise<string> {
    return await this.destinationChecks.getCityNameById(id);
  }

  private async validateAirportSelection(
    data: CreateRequestDto,
  ): Promise<void> {
    if (data.id_origin_airport) {
      const isOriginAirportValid = await this.destinationChecks.isAirportValid(
        data.id_origin_airport,
      );
      if (!isOriginAirportValid) {
        throw new BadRequestException('Invalid id_origin_airport.');
      }

      const isOriginAirportInCity =
        await this.destinationChecks.isAirportInDestination(
          data.id_origin_airport,
          data.id_origin_city,
        );

      if (!isOriginAirportInCity) {
        throw new BadRequestException(
          'id_origin_airport does not belong to id_origin_city.',
        );
      }
    }

    for (const rd of data.requests_destinations) {
      if (rd.is_plane_required && !rd.id_airport) {
        throw new BadRequestException(
          'id_airport is required when is_plane_required is true.',
        );
      }

      if (!rd.is_plane_required && rd.id_airport) {
        throw new BadRequestException(
          'id_airport must be omitted when is_plane_required is false.',
        );
      }

      if (!rd.id_airport) {
        continue;
      }

      const isAirportValid = await this.destinationChecks.isAirportValid(
        rd.id_airport,
      );

      if (!isAirportValid) {
        throw new BadRequestException('Invalid id_airport.');
      }

      const isAirportInDestination =
        await this.destinationChecks.isAirportInDestination(
          rd.id_airport,
          rd.id_destination,
        );

      if (!isAirportInDestination) {
        throw new BadRequestException(
          'id_airport does not belong to id_destination.',
        );
      }
    }
  }

  private async getDocumentClassIdForAdvance(
    advanceMoney: number,
  ): Promise<string | null> {
    if (Number(advanceMoney || 0) <= 0) {
      return null;
    }

    const documentClass = await this.documentClassRepo.findOne({
      where: { key: 'av' },
    });

    if (!documentClass) {
      throw new NotFoundException('Document class with key av not found.');
    }

    return documentClass.id;
  }

  private async logRequestAction(
    manager: EntityManager,
    id_request: string,
    id_user: string,
    action: 'create' | 'update' | 'status_change',
    new_status: string,
    extraData?: Record<string, any>,
  ) {
    let report: string;

    switch (action) {
      case 'create':
        report = `Solicitud creada con origen en la ciudad ${extraData?.originCity} y ${extraData?.numDestinations} destino(s).`;
        break;
      case 'update':
        report = `Solicitud actualizada. Se modificaron campos como motivo, ciudad de origen o destinos.`;
        break;
      case 'status_change':
        report = `El estado cambió de '${extraData?.fromStatus}' a '${new_status}'.`;
        break;
      default:
        report = 'Acción realizada en la solicitud.';
    }

    await manager.save(RequestLog, {
      id_request,
      id_user,
      report,
      new_status,
    });
  }

  async create(req: RequestInterface, data: CreateRequestDto) {
    const userId = req?.sessionInfo?.id;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated session context.');
    }

    if (!req?.userInfo) {
      throw new UnauthorizedException(
        'Missing user context for request creation.',
      );
    }

    // Server-side safety net for the destinations selector. The frontend
    // already validates with Zod, so these branches normally don't fire — but
    // when they do (Postman / direct API calls / a bug in the client) we want
    // the toast to read in plain Spanish and, when possible, point at the
    // exact field so react-hook-form can highlight it.
    if (
      !Array.isArray(data.requests_destinations) ||
      data.requests_destinations.length === 0
    ) {
      throw new BadRequestException({
        message: 'La solicitud debe incluir al menos un destino.',
        field: 'requests_destinations',
      });
    }

    for (const [idx, dest] of data.requests_destinations.entries()) {
      if (
        !dest.id_destination ||
        (typeof dest.id_destination === 'string' &&
          dest.id_destination.trim() === '')
      ) {
        throw new BadRequestException({
          message: `El destino #${idx + 1} no tiene una ciudad seleccionada.`,
          field: `requests_destinations.${idx}.id_destination`,
        });
      }

      if (!(await this.destinationChecks.isValid(dest.id_destination))) {
        throw new BadRequestException({
          message: `El destino #${idx + 1} no es válido.`,
          field: `requests_destinations.${idx}.id_destination`,
        });
      }
    }

    // Validate origin city
    if (!(await this.destinationChecks.isValid(data.id_origin_city))) {
      throw new BadRequestException('Invalid id_origin_city.');
    }

    await this.validateAirportSelection(data);

    // Assign approver
    const id_department = req.userInfo.id_department;
    if (!id_department) {
      throw new BadRequestException(
        'User must belong to a company department  to create requests.',
      );
    }

    const department = await this.departmentRepo.findOne({
      where: { id: id_department },
      select: ['id', 'id_company'],
    });

    if (!department?.id_company) {
      throw new BadRequestException(
        'User department is missing company context for request creation.',
      );
    }
    const adminId = await this.userChecks.getRandomApproverIdFromSameDepartment(
      id_department,
      userId,
    );
    if (!adminId) {
      throw new HttpException(
        'There is no admin available to assign the request.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Assign SOI
    const SOIId = await this.userChecks.getRandomSoiId();
    if (!SOIId) {
      throw new HttpException(
        'There is no SOI available to assign the request.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const request = this.requestsRepo.create({
      id_user: userId,
      id_admin: adminId,
      id_SOI: SOIId,
      id_company: department.id_company,
      id_document_class: await this.getDocumentClassIdForAdvance(
        data.advance_money,
      ),
      ...data,
      requests_destinations: data.requests_destinations.map((destDto) => ({
        ...destDto,
      })),
    });

    const saved = await this.requestsRepo.save(request);

    const emailWarnings: EmailWarning[] = [];

    // Log request creation
    const originCityName = await this.getCityName(saved.id_origin_city);
    await this.logRequestAction(
      this.dataSource.createEntityManager(),
      saved.id,
      saved.id_user,
      'create',
      saved.status,
      {
        originCity: originCityName,
        numDestinations: saved.requests_destinations.length,
      },
    );

    const admin = await this.userChecks.getUserById(saved.id_admin);

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${saved.id_admin} not found.`);
    }

    const adminEmailWarning = await this.notificationsService.notifyOrWarn({
      to: admin.email,
      subject: 'Nueva solicitud asignada',
      text: `Se te ha asignado una nueva solicitud de viaje con ID: ${saved.id}. Por favor, revisa los detalles en el sistema.`,
      html: `<p>Hola ${admin.name},</p>
<p>Se te ha asignado una nueva solicitud de viaje con ID: <strong>${saved.id}</strong>.</p>
<p>Por favor, revisa los detalles en el sistema.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      failureMessage:
        'La solicitud fue creada, pero no se pudo enviar el correo de notificación al aprobador.',
    });

    if (adminEmailWarning) {
      emailWarnings.push(adminEmailWarning);
    }

    return Object.assign(saved, { emailWarnings });
  }

  async findAll(): Promise<RequestEntity[]> {
    return this.requestsRepo.find({
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'requests_destinations.airport',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'origin_airport',
        'travelAgency',
        'travelAgency.users',
      ],
    });
  }

  async findOne(req: RequestInterface, id: string): Promise<RequestEntity> {
    const userId = req.sessionInfo.id;

    const request = await this.requestsRepo.findOne({
      where: { id },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'requests_destinations.airport',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'origin_airport',
        'vouchers',
        'requests_destinations.reservations',
      ],
    });
    if (!request) throw new NotFoundException(`Request ${id} not found`);

    // Validate access to request
    const id_travel_agency = req.userInfo.id_travel_agency;

    if (
      userId !== request.id_user &&
      userId !== request.id_admin &&
      userId !== request.id_SOI &&
      !(id_travel_agency && id_travel_agency === request.id_travel_agency) // Needs further testing
    )
      throw new UnauthorizedException('Cannot access this request.');

    return request;
  }

  async findByUser(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const list = await this.requestsRepo.find({
      where: { id_user: userId },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'requests_destinations.airport',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'origin_airport',
      ],
    });
    return list;
  }

  async findByAdmin(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;

    return this.requestsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.requests_destinations', 'rd')
      .leftJoinAndSelect('rd.destination', 'd')
      .leftJoinAndSelect('r.revisions', 'rev')
      .leftJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('u.department', 'dept')
      .leftJoinAndSelect('r.admin', 'adm')
      .leftJoinAndSelect('r.SOI', 'soi')
      .leftJoinAndSelect('r.destination', 'dest')
      .where('r.id_admin = :userId', { userId })
      .andWhere('r.status = :status', { status: 'Pending Review' })
      .orderBy(
        `CASE r.priority
         WHEN 'alta' THEN 1
         WHEN 'media' THEN 2
         WHEN 'baja' THEN 3
       END`,
        'ASC',
      )
      .getMany();
  }

  async findBySOI(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const list = await this.requestsRepo.find({
      where: { id_SOI: userId },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'requests_destinations.airport',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'origin_airport',
      ],
    });
    return list;
  }

  // Fetch all requests with Pending Refund Approval status assigned to a SOI
  async findPendingRefundApproval(
    req: RequestInterface,
  ): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const list = await this.requestsRepo.find({
      where: {
        status: 'Pending Refund Approval',
        id_SOI: userId,
      },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'requests_destinations.airport',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'origin_airport',
      ],
    });
    return list;
  }

  async findByTA(req: RequestInterface): Promise<RequestEntity[]> {
    const travelAgencyId = req?.userInfo?.id_travel_agency;

    if (!travelAgencyId)
      throw new UnauthorizedException('Cannot access this endpoint.');

    const list = await this.requestsRepo.find({
      where: {
        id_travel_agency: travelAgencyId,
        status: 'Pending Reservations',
      },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'requests_destinations.airport',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'origin_airport',
      ],
    });
    return list;
  }

  async findPolicyViolationsByRequest(req: RequestInterface, id: string) {
    await this.findOne(req, id);

    const violations = await this.policyViolationRepo.find({
      where: {
        voucher: {
          id_request: id,
        },
      },
      relations: ['voucher', 'policy_rule'],
      order: {
        created_at: 'DESC',
      },
    });

    return {
      request_id: id,
      total: violations.length,
      violations: violations.map((violation) => ({
        id: violation.id,
        id_voucher: violation.id_voucher,
        id_policy_rule: violation.id_policy_rule,
        detail: violation.detail,
        created_at: violation.created_at,
        voucher: {
          class: violation.voucher?.class,
          amount: violation.voucher?.amount,
          currency: violation.voucher?.currency,
          date: violation.voucher?.date,
        },
      })),
    };
  }

  async updateRequest(
    req: RequestInterface,
    id: string,
    data: UpdateRequestDto,
  ) {
    // Uses a transaction to ensure automatic rollback on error
    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.withRepository(this.requestsRepo);

      const entity = await repo.findOne({
        where: { id },
        relations: ['requests_destinations'],
      });
      if (!entity) throw new NotFoundException(`Request ${id} not found`);

      if (req.sessionInfo.id !== entity.id_user)
        throw new UnauthorizedException('Unable to edit this request.');

      // A request can only be edited if it is in these states
      if (
        entity.status !== 'Pending Review' &&
        entity.status !== 'Changes Needed'
      )
        throw new ConflictException(
          'Unable to edit this request beacuse of its current status.',
        );

      // Validate destination cities
      if (!(await this.destinationChecks.isValid(data.id_origin_city))) {
        throw new BadRequestException('Invalid id_origin_city.');
      }

      for (const rd of data.requests_destinations) {
        if (!(await this.destinationChecks.isValid(rd.id_destination)))
          throw new BadRequestException('Invalid id_destination.');
      }

      await this.validateAirportSelection(data as CreateRequestDto);

      // Update general request fields
      entity.advance_money = data.advance_money;
      entity.id_document_class = await this.getDocumentClassIdForAdvance(
        data.advance_money,
      );
      entity.id_origin_city = data.id_origin_city;
      entity.id_origin_airport = data.id_origin_airport;
      entity.motive = data.motive;
      entity.requirements = data.requirements;
      entity.priority = data.priority;

      if (!entity.id_company && req.userInfo.id_department) {
        const department = await this.departmentRepo.findOne({
          where: { id: req.userInfo.id_department },
          select: ['id', 'id_company'],
        });

        if (department?.id_company) {
          entity.id_company = department.id_company;
        }
      }

      // Replace all request destinations
      const destRepo = manager.getRepository(RequestsDestination);
      entity.requests_destinations = data.requests_destinations.map((d) =>
        destRepo.create({ ...d }),
      );

      // Reset status to Pending Review
      entity.status = 'Pending Review';

      const updated = await repo.save(entity);

      const emailWarnings: EmailWarning[] = [];

      // Log request update
      await this.logRequestAction(
        manager,
        updated.id,
        updated.id_user,
        'update',
        updated.status,
      );

      // Notify assigned admin
      const admin = await this.userChecks.getUserById(updated.id_admin);
      if (!admin) {
        throw new NotFoundException(
          `Admin with ID ${updated.id_admin} not found.`,
        );
      }

      // Email failures are returned as warnings so the request update can continue.
      const adminEmailWarning = await this.notificationsService.notifyOrWarn({
        to: admin.email,
        subject: 'Solicitud actualizada',
        text: `La solicitud de viaje con ID: ${updated.id} ha sido actualizada. Por favor, revisa los detalles en el sistema.`,
        html: `<p>Hola ${admin.name},</p>
<p>La solicitud de viaje con ID: <strong>${updated.id}</strong> ha sido actualizada.</p>
<p>Por favor, revisa los detalles en el sistema.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
        failureMessage:
          'La solicitud fue actualizada, pero no se pudo enviar el correo de notificación al aprobador.',
      });

      if (adminEmailWarning) {
        emailWarnings.push(adminEmailWarning);
      }

      return Object.assign(updated, { emailWarnings });
    });
  }

  async getRequestById(id: string): Promise<RequestEntity> {
    const request = await this.requestsRepo.findOne({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    return request;
  }

  async updateStatus(id: string, newStatus: string): Promise<RequestEntity> {
    const request = await this.requestsRepo.findOne({ where: { id } });

    if (!request) {
      throw new Error('Request not found');
    }
    const previousStatus = request.status;
    request.status = newStatus;

    const updated = await this.requestsRepo.save(request);

    // Log status change
    await this.logRequestAction(
      this.dataSource.createEntityManager(),
      updated.id,
      updated.id_user,
      'status_change',
      newStatus,
      { fromStatus: previousStatus },
    );

    return updated;
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-04-15 | Juan de Dios Gastélum Flores | Wrapped notificationsService.notify() calls in try-catch in create() and updateRequest() to prevent email failures from aborting request operations.
 * - 2026-04-29 | Juan de Dios Gastélum Flores | Added email warning response handling for request creation and updates when notification delivery fails.
 * - 2026-04-30 | Diego Vergara | Added Spanish, indexed destination validation in create() so the frontend toast can render the exact missing/invalid destino message and react-hook-form can highlight the offending field.
 */
