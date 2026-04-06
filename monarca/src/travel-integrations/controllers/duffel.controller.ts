import {
  Body,
  Controller,
  ConflictException,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsChecks } from 'src/requests/requests.checks';
import { ReservationsService } from 'src/reservations/reservations.service';
import {
  CreateDuffelOfferRequestDto,
  CreateDuffelOrderDto,
  CreateDuffelPaymentDto,
  ListDuffelOffersQueryDto,
} from '../dto/duffel.dto';
import { DuffelService } from '../services/duffel.service';

@ApiTags('travel-integrations')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('travel-integrations/duffel')
export class DuffelController {
  constructor(
    private readonly duffelService: DuffelService,
    private readonly requestsChecks: RequestsChecks,
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post('offer-requests')
  @ApiOperation({ summary: 'Create Duffel offer request' })
  async createOfferRequest(
    @Request() req: RequestInterface,
    @Body() body: CreateDuffelOfferRequestDto,
  ) {
    await this.assertRequestDestinationAccess(
      req,
      body.requestDestinationId,
    );

    const baseMetadata =
      typeof body.data.metadata === 'object' && body.data.metadata !== null
        ? (body.data.metadata as Record<string, unknown>)
        : {};

    return this.duffelService.createOfferRequest({
      ...body.data,
      metadata: {
        ...baseMetadata,
        monarca_request_destination_id: body.requestDestinationId,
        monarca_user_id: req.userInfo?.id,
        monarca_travel_agency_id: req.userInfo?.id_travel_agency,
      },
    });
  }

  @Get('offers')
  @ApiOperation({ summary: 'List Duffel offers by offer request id' })
  async listOffers(@Query() query: ListDuffelOffersQueryDto) {
    return this.duffelService.listOffers(
      query.offerRequestId,
      query.after,
      query.limit,
    );
  }

  @Get('offers/:offerId')
  @ApiOperation({ summary: 'Get a fresh Duffel offer by id' })
  async getOfferById(@Param('offerId') offerId: string) {
    return this.duffelService.getOfferById(offerId);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create Duffel order from selected offer(s)' })
  async createOrder(
    @Request() req: RequestInterface,
    @Body() body: CreateDuffelOrderDto,
  ) {
    await this.assertRequestDestinationAccess(req, body.requestDestinationId);

    const selectedOffers = Array.isArray(
      body.data.selected_offers,
    )
      ? (body.data.selected_offers as string[])
      : [body.offerId];

    const orderResponse = await this.duffelService.createOrder({
      ...body.data,
      selected_offers: selectedOffers,
      metadata: {
        ...(body.data.metadata && typeof body.data.metadata === 'object'
          ? (body.data.metadata as Record<string, unknown>)
          : {}),
        monarca_request_destination_id: body.requestDestinationId,
      },
    });

    const orderDetails = this.extractOrderDetails(orderResponse);

    const reservation = await this.reservationsService.createReservation(req, {
      title: body.reservationTitle,
      comments: body.reservationComments,
      price: body.reservationPrice,
      id_request_destination: body.requestDestinationId,
      provider_name: 'duffel',
      provider_offer_id:
        orderDetails.offerId ?? selectedOffers[0] ?? null,
      booking_reference: orderDetails.bookingReference ?? orderDetails.orderId,
      hold_expires_at: orderDetails.holdExpiresAt ?? undefined,
      provider_meta: {
        duffel_order: orderResponse,
      },
    });

    return {
      order: orderResponse,
      reservation,
    };
  }

  @Post('payments')
  @ApiOperation({ summary: 'Create Duffel payment for an existing order' })
  async createPayment(
    @Request() req: RequestInterface,
    @Body() body: CreateDuffelPaymentDto,
  ) {
    await this.assertRequestDestinationAccess(req, body.requestDestinationId);

    return this.duffelService.createPayment({
      ...body.data,
      order_id: body.orderId,
    });
  }

  private async assertRequestDestinationAccess(
    req: RequestInterface,
    requestDestinationId: string,
  ): Promise<void> {
    const id_travel_agency = req?.userInfo?.id_travel_agency;

    if (!id_travel_agency) {
      throw new UnauthorizedException('Missing travel agency context.');
    }

    const belongsToAgency =
      await this.requestsChecks.isRequestDestinationTravelAgencyId(
        requestDestinationId,
        id_travel_agency,
      );

    if (!belongsToAgency) {
      throw new UnauthorizedException('Unable to access that request destination.');
    }

    const requestStatus =
      await this.requestsChecks.getRequestStatusFromRequestDestination(
        requestDestinationId,
      );

    if (requestStatus !== 'Pending Reservations') {
      throw new ConflictException(
        'Unable to use Duffel because the request is not in Pending Reservations.',
      );
    }
  }

  private extractOrderDetails(orderResponse: unknown): {
    orderId?: string;
    offerId?: string;
    bookingReference?: string;
    holdExpiresAt?: string;
  } {
    const root =
      typeof orderResponse === 'object' && orderResponse !== null
        ? (orderResponse as Record<string, unknown>)
        : {};
    const order =
      typeof root.order === 'object' && root.order !== null
        ? (root.order as Record<string, unknown>)
        : root;

    return {
      orderId: this.asString(order.id) ?? this.asString(root.id),
      offerId:
        this.asString(order.offer_id) ?? this.asString(root.offer_id) ?? this.asString(root.offerId),
      bookingReference:
        this.asString(order.booking_reference) ??
        this.asString(root.booking_reference) ??
        this.asString(root.bookingReference),
      holdExpiresAt:
        this.asString(order.hold_expires_at) ??
        this.asString(root.hold_expires_at) ??
        this.asString(root.holdExpiresAt),
    };
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
