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
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In, Not } from 'typeorm';
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
import { ApproverSubstituteService } from './services/approver-substitute.service';
import { RequestApprovalStep } from './entities/request-approval-step.entity';
import { ApprovalRulesService } from 'src/approval-rules/approval-rules.service';
import { Destination } from 'src/destinations/entities/destination.entity';

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
    @InjectRepository(RequestApprovalStep)
    private readonly requestApprovalStepsRepo: Repository<RequestApprovalStep>,
    @InjectRepository(Destination)
    private readonly destinationRepo: Repository<Destination>,
    private readonly userChecks: UserChecks,
    private readonly destinationChecks: DestinationsChecks,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
    private readonly approverSubstituteService: ApproverSubstituteService,
    private readonly approvalRulesService: ApprovalRulesService,
  ) {}

  public buildRequestSummaryHtml(request: RequestEntity): string {
    const requesterName = request.user
      ? `${request.user.name} ${request.user.lastName || ''}`.trim()
      : 'N/A';
    const originCity =
      request.destination?.city || request.id_origin_city || 'N/A';
    const travelAgencyName = request.travelAgency?.name
      ? request.travelAgency.name
      : request.id_travel_agency
        ? 'Agencia asignada'
        : 'Sin asignar';
    const createdAt = request.createdAt
      ? new Date(request.createdAt).toLocaleDateString('es-MX')
      : 'N/A';
    const destinationsHtml = this.buildDestinationsSummaryHtml(request);

    return `
      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr style="background:#1a73e8;color:#fff;">
          <th style="padding:8px;text-align:left;">Campo</th>
          <th style="padding:8px;text-align:left;">Detalle</th>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>ID solicitud</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${request.id}</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="padding:8px;border:1px solid #ddd;"><strong>Solicitante</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${requesterName}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Ciudad de origen</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${originCity}</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="padding:8px;border:1px solid #ddd;"><strong>Agencia de viaje</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${travelAgencyName}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Fecha de creacion</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${createdAt}</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="padding:8px;border:1px solid #ddd;"><strong>Titulo</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${request.title}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Motivo</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${request.motive}</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="padding:8px;border:1px solid #ddd;"><strong>Prioridad</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${request.priority}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #ddd;"><strong>Anticipo</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">$${request.advance_money} MXN</td>
        </tr>
        ${
          request.requirements
            ? `
        <tr style="background:#f9f9f9;">
          <td style="padding:8px;border:1px solid #ddd;"><strong>Requerimientos</strong></td>
          <td style="padding:8px;border:1px solid #ddd;">${request.requirements}</td>
        </tr>`
            : ''
        }
      </table>
      ${destinationsHtml}
    `;
  }

  private buildDestinationsSummaryHtml(request: RequestEntity): string {
    const destinations = request.requests_destinations || [];
    if (destinations.length === 0) {
      return '<p><strong>Destinos:</strong> N/A</p>';
    }

    const rows = destinations
      .sort((a, b) => (a.destination_order || 0) - (b.destination_order || 0))
      .map((destination, index) => {
        const cityName =
          destination.destination?.city || destination.id_destination;
        const departure = this.formatDate(destination.departure_date);
        const arrival = this.formatDate(destination.arrival_date);
        const hotel = destination.is_hotel_required ? 'Si' : 'No';
        const airplane = destination.is_plane_required ? 'Si' : 'No';
        return `<tr style="background:${index % 2 === 0 ? '#f9f9f9' : '#fff'}">
          <td style="padding:8px;border:1px solid #ddd;">${cityName}</td>
          <td style="padding:8px;border:1px solid #ddd;">${departure}</td>
          <td style="padding:8px;border:1px solid #ddd;">${arrival}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${destination.stay_days || 0}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${hotel}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${airplane}</td>
        </tr>`;
      })
      .join('');

    return `
      <h3 style="margin-top:24px;">Destinos</h3>
      <table style="border-collapse:collapse;width:100%;">
        <tr style="background:#1a73e8;color:#fff;">
          <th style="padding:8px;">Destino</th>
          <th style="padding:8px;">Salida</th>
          <th style="padding:8px;">Llegada</th>
          <th style="padding:8px;">Dias</th>
          <th style="padding:8px;">Hotel</th>
          <th style="padding:8px;">Avion</th>
        </tr>
        ${rows}
      </table>
    `;
  }

  private formatDate(value?: Date | string | null): string {
    if (!value) {
      return 'N/A';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }

    return parsed.toLocaleDateString('es-MX');
  }

  public getLoginUrl(): string {
    const baseUrl = (process.env.FRONTEND_URL || '').trim();
    if (!baseUrl) {
      return '';
    }

    const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalized}/dashboard`;
  }

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

  /**
   * Normalizes country names before comparing origin and destinations.
   * @param country Country name to normalize.
   * @returns Normalized lowercase country name without accents.
   */
  private normalizeCountry(country?: string | null): string {
    return String(country ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Builds the approval rule context from the request payload.
   * @param data Request creation payload.
   * @returns Trip type and monetary amount used by the approval rules engine.
   */
  private async buildApprovalContext(data: CreateRequestDto): Promise<{
    tripType: 'nacional' | 'internacional';
    cost: number;
  }> {
    const origin = await this.destinationRepo.findOne({
      where: { id: data.id_origin_city },
      select: ['id', 'country'],
    });

    if (!origin) {
      throw new BadRequestException('Invalid id_origin_city.');
    }

    const destinationIds = data.requests_destinations.map(
      (destination) => destination.id_destination,
    );

    const destinations = await this.destinationRepo.find({
      where: { id: In(destinationIds) },
      select: ['id', 'country'],
    });

    const originCountry = this.normalizeCountry(origin.country);

    const isInternational = destinations.some(
      (destination) =>
        this.normalizeCountry(destination.country) !== originCountry,
    );

    return {
      tripType: isInternational ? 'internacional' : 'nacional',
      cost: Number(data.advance_money || 0),
    };
  }

  /**
   * Resolves the first approver and the frozen hierarchy chain for a new request.
   * Falls back to the existing department approver logic when no rule matches.
   * @param userId Requester user ID.
   * @param departmentId Requester department ID.
   * @param data Request creation payload.
   * @returns First approver and full hierarchy approval chain.
   */
  private async resolveInitialApprover(
    userId: string,
    departmentId: string,
    data: CreateRequestDto,
  ): Promise<{
    approverId: string;
    approvalManagers: { userId: string }[];
  }> {
    const approvalContext = await this.buildApprovalContext(data);

    let resolvedApproval = await this.approvalRulesService.resolveApprovers({
      userId,
      tripType: approvalContext.tripType,
      cost: approvalContext.cost,
      priority: data.priority,
    });

    const approvalManagers =
      resolvedApproval?.steps.flatMap((step) => step.resolvedManagers ?? []) ??
      [];

    if (resolvedApproval && approvalManagers.length === 0) {
      resolvedApproval = null;
    }

    const ruleApproverId = approvalManagers[0]?.userId;

    if (ruleApproverId) {
      return {
        approverId: ruleApproverId,
        approvalManagers,
      };
    }

    const fallbackApproverId =
      (await this.userChecks.getRandomApproverIdFromSameDepartment(
        departmentId,
        userId,
      )) ?? (await this.userChecks.getRandomApproverId());

    if (!fallbackApproverId) {
      throw new HttpException(
        'There is no admin available to assign the request.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return {
      approverId: fallbackApproverId,
      approvalManagers: [],
    };
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

    if (!(await this.destinationChecks.isValid(data.id_origin_city))) {
      throw new BadRequestException('Invalid id_origin_city.');
    }

    await this.validateAirportSelection(data);

    const id_department = req.userInfo.id_department;
    if (!id_department) {
      throw new BadRequestException(
        'User must belong to a company department to create requests.',
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
    const { approverId, approvalManagers } = await this.resolveInitialApprover(
      userId,
      id_department,
      data,
    );

    const resolvedAdminId =
      await this.approverSubstituteService.resolveApprover(approverId);

    const SOIId = await this.userChecks.getRandomSoiId();
    if (!SOIId) {
      throw new HttpException(
        'There is no SOI available to assign the request.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const request = this.requestsRepo.create({
      id_user: userId,
      id_admin: resolvedAdminId,
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

    if (approvalManagers.length > 0) {
      await this.requestApprovalStepsRepo.save(
        approvalManagers.map((manager, index) =>
          this.requestApprovalStepsRepo.create({
            idRequest: saved.id,
            idApprover: manager.userId,
            order: index + 1,
            status: 'pending',
          }),
        ),
      );
    }

    const emailWarnings: EmailWarning[] = [];

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

    const detailedRequest = await this.requestsRepo.findOne({
      where: { id: saved.id },
      relations: [
        'user',
        'destination',
        'requests_destinations',
        'requests_destinations.destination',
        'travelAgency',
      ],
    });
    const summary = this.buildRequestSummaryHtml(detailedRequest || saved);
    const loginUrl = this.getLoginUrl();
    const loginLine = loginUrl
      ? `<p>Ingresa a la plataforma para revisar la solicitud: <a href="${loginUrl}">${loginUrl}</a></p>`
      : '<p>Ingresa a la plataforma para revisar la solicitud.</p>';
    const requesterEmailWarning = await this.notificationsService.notifyOrWarn({
      to: req.userInfo.email,
      subject: 'Solicitud enviada a revision',
      text: `Tu solicitud "${saved.title}" fue enviada al aprobador para su revision.`,
      html: `<p>Hola ${req.userInfo.name},</p>
<p>Tu solicitud "<strong>${saved.title}</strong>" fue enviada al aprobador para revision.</p>
${summary}
${loginLine}
<p>Te avisaremos cuando cambie el estatus.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      failureMessage:
        'La solicitud fue creada, pero no se pudo enviar el correo de notificacion al solicitante.',
    });

    if (requesterEmailWarning) {
      emailWarnings.push(requesterEmailWarning);
    }

    const admin = await this.userChecks.getUserById(saved.id_admin);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${saved.id_admin} not found.`);
    }

    const adminEmailWarning = await this.notificationsService.notifyOrWarn({
      to: admin.email,
      subject: 'Solicitud pendiente de aprobacion',
      text: `Tienes una nueva solicitud de viaje pendiente de aprobacion: ${saved.title}.`,
      html: `<p>Hola ${admin.name},</p>
<p>Tienes una nueva solicitud de viaje pendiente de aprobacion: <strong>${saved.title}</strong>.</p>
${summary}
${loginLine}
<p>Por favor, revisa los detalles en el sistema para aprobar, denegar o solicitar cambios.</p>
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

    const id_travel_agency = req.userInfo.id_travel_agency;

    const isSubstitute =
      await this.approverSubstituteService.isAuthorizedToApprove(
        request.id_admin,
        userId,
      );

    if (
      userId !== request.id_user &&
      userId !== request.id_admin &&
      userId !== request.id_SOI &&
      !(id_travel_agency && id_travel_agency === request.id_travel_agency) &&
      !isSubstitute
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

    const originalApproverIds =
      await this.approverSubstituteService.getOriginalApproverIdsForSubstitute(
        userId,
      );

    const adminIds = [userId, ...originalApproverIds];

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
      .where('r.id_admin IN (:...adminIds)', { adminIds })
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

  /** Statuses excluded from "viajes ya reservados" history for the travel agency. */
  private static readonly TRAVEL_AGENT_HISTORY_EXCLUDED_STATUSES = [
    'Pending Review',
    'Denied',
    'Cancelled',
    'Changes Needed',
    'Pending Accounting Approval',
    'Pending Reservations',
  ] as const;

  /**
   * Paginated list of requests assigned to the caller's travel agency that are
   * past the reservation queue (excludes Pending Reservations and early pipeline states).
   */
  async findTravelAgentReservedHistory(
    req: RequestInterface,
    page: number,
    limit: number,
  ): Promise<{ data: RequestEntity[]; total: number }> {
    const travelAgencyId = req.userInfo?.id_travel_agency;
    if (!travelAgencyId) {
      throw new UnauthorizedException('Travel agency context required.');
    }

    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit) || 10));

    const excluded = [
      ...RequestsService.TRAVEL_AGENT_HISTORY_EXCLUDED_STATUSES,
    ];
    const where = {
      id_travel_agency: travelAgencyId,
      status: Not(In(excluded)),
    };

    const total = await this.requestsRepo.count({ where });

    const data = await this.requestsRepo.find({
      where,
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
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

    return { data, total };
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
        rule: {
          expense_class: violation.policy_rule?.expense_class,
          operator: violation.policy_rule?.operator,
          threshold_value: violation.policy_rule?.threshold_value,
          threshold_unit: violation.policy_rule?.threshold_unit,
          consequence: violation.policy_rule?.consequence,
        },
      })),
    };
  }

  async updateRequest(
    req: RequestInterface,
    id: string,
    data: UpdateRequestDto,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.withRepository(this.requestsRepo);

      const entity = await repo.findOne({
        where: { id },
        relations: ['requests_destinations'],
      });
      if (!entity) throw new NotFoundException(`Request ${id} not found`);

      if (req.sessionInfo.id !== entity.id_user)
        throw new UnauthorizedException('Unable to edit this request.');

      if (
        entity.status !== 'Pending Review' &&
        entity.status !== 'Changes Needed'
      )
        throw new ConflictException(
          'Unable to edit this request beacuse of its current status.',
        );

      if (!(await this.destinationChecks.isValid(data.id_origin_city))) {
        throw new BadRequestException('Invalid id_origin_city.');
      }

      for (const rd of data.requests_destinations) {
        if (!(await this.destinationChecks.isValid(rd.id_destination)))
          throw new BadRequestException('Invalid id_destination.');
      }

      await this.validateAirportSelection(data as CreateRequestDto);

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

      const destRepo = manager.getRepository(RequestsDestination);
      entity.requests_destinations = data.requests_destinations.map((d) =>
        destRepo.create({ ...d }),
      );

      // Reset approval flow when the requester resubmits after changes.
      if (!req.userInfo.id_department) {
        throw new BadRequestException(
          'User must belong to a company department to update requests.',
        );
      }

      const { approverId, approvalManagers } =
        await this.resolveInitialApprover(
          entity.id_user,
          req.userInfo.id_department,
          data as CreateRequestDto,
        );

      const resolvedAdminId =
        await this.approverSubstituteService.resolveApprover(approverId);

      entity.id_admin = resolvedAdminId;
      entity.id_travel_agency = null;
      entity.status = 'Pending Review';

      const updated = await repo.save(entity);

      const approvalStepRepo = manager.getRepository(RequestApprovalStep);

      await approvalStepRepo.delete({ idRequest: updated.id });

      if (approvalManagers.length > 0) {
        await approvalStepRepo.save(
          approvalManagers.map((managerEntry, index) =>
            approvalStepRepo.create({
              idRequest: updated.id,
              idApprover: managerEntry.userId,
              order: index + 1,
              status: 'pending',
            }),
          ),
        );
      }

      const emailWarnings: EmailWarning[] = [];

      await this.logRequestAction(
        manager,
        updated.id,
        updated.id_user,
        'update',
        updated.status,
      );

      const admin = await this.userChecks.getUserById(updated.id_admin);
      if (!admin) {
        throw new NotFoundException(
          `Admin with ID ${updated.id_admin} not found.`,
        );
      }

      const detailedRequest = await repo.findOne({
        where: { id: updated.id },
        relations: [
          'user',
          'destination',
          'requests_destinations',
          'requests_destinations.destination',
          'travelAgency',
        ],
      });
      const summary = this.buildRequestSummaryHtml(detailedRequest || updated);
      const loginUrl = this.getLoginUrl();
      const loginLine = loginUrl
        ? `<p>Ingresa a la plataforma para revisar la solicitud: <a href="${loginUrl}">${loginUrl}</a></p>`
        : '<p>Ingresa a la plataforma para revisar la solicitud.</p>';
      const adminEmailWarning = await this.notificationsService.notifyOrWarn({
        to: admin.email,
        subject: 'Solicitud actualizada',
        text: `La solicitud de viaje "${updated.title}" ha sido actualizada.`,
        html: `<p>Hola ${admin.name},</p>
<p>La solicitud de viaje "<strong>${updated.title}</strong>" ha sido actualizada.</p>
${summary}
${loginLine}
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
      relations: [
        'user',
        'destination',
        'requests_destinations',
        'requests_destinations.destination',
        'travelAgency',
      ],
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

    await this.logRequestAction(
      this.dataSource.createEntityManager(),
      updated.id,
      updated.id_user,
      'status_change',
      newStatus,
      { fromStatus: previousStatus },
    );

    // Notify request owner of status change
    try {
      const detailedRequest = await this.requestsRepo.findOne({
        where: { id: updated.id },
        relations: [
          'user',
          'destination',
          'requests_destinations',
          'requests_destinations.destination',
          'travelAgency',
        ],
      });
      const requestUser = detailedRequest?.user
        ? detailedRequest.user
        : await this.userChecks.getUserById(updated.id_user);

      if (requestUser?.email) {
        const summary = this.buildRequestSummaryHtml(
          detailedRequest || updated,
        );
        const loginUrl = this.getLoginUrl();
        const loginLine = loginUrl
          ? `<p>Ingresa a la plataforma para revisar la solicitud: <a href="${loginUrl}">${loginUrl}</a></p>`
          : '<p>Ingresa a la plataforma para revisar la solicitud.</p>';

        await this.notificationsService.notify(
          requestUser.email,
          'Cambio de estatus de solicitud',
          `El estado de tu solicitud "${updated.title}" cambió de '${previousStatus}' a '${newStatus}'.`,
          `<p>Hola ${requestUser.name},</p>
<p>El estado de tu solicitud "<strong>${updated.title}</strong>" cambió de <em>${previousStatus}</em> a <em>${newStatus}</em>.</p>
${summary}
${loginLine}
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
        );
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    return updated;
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-04-15 | Juan de Dios Gastélum Flores | Wrapped notificationsService.notify() calls in try-catch to prevent email failures from aborting request operations.
 * - 2026-04-29 | Juan de Dios Gastélum Flores | Added email warning response handling for request creation and updates when notification delivery fails.
 * - 2026-04-30 | Diego Vergara | Added Spanish, indexed destination validation in create() so the frontend toast can render the exact missing/invalid destino message and react-hook-form can highlight the offending field.
 * - 2026-05-12 | Juan de Dios Gastélum | Integrated approval rules into request creation and froze hierarchy approval steps.
 * - 2026-05-13 | Juan de Dios Gastélum | Added company wide approver fallback when no approver exists in requester's department.
 */
