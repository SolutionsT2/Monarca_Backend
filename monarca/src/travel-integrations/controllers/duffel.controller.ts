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
import {
  CreateDuffelOfferRequestDto,
  GetDuffelOfferByIdQueryDto,
  ListDuffelOffersQueryDto,
} from '../dto/duffel.dto';
import { DuffelService } from '../services/duffel.service';
import {
  normalizeOfferDetailResponse,
  normalizeOfferRequestResponse,
  normalizeOffersListResponse,
} from '../utils/duffel-offers.normalizer';

@ApiTags('travel-integrations')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('travel-integrations/duffel')
export class DuffelController {
  constructor(
    private readonly duffelService: DuffelService,
    private readonly requestsChecks: RequestsChecks,
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

    const response = await this.duffelService.createOfferRequest({
      ...body.data,
      metadata: {
        ...baseMetadata,
        monarca_request_destination_id: body.requestDestinationId,
        monarca_user_id: req.userInfo?.id,
        monarca_travel_agency_id: req.userInfo?.id_travel_agency,
      },
    });

    return normalizeOfferRequestResponse(response);
  }

  @Get('offers')
  @ApiOperation({ summary: 'List Duffel offers by offer request id' })
  async listOffers(@Query() query: ListDuffelOffersQueryDto) {
    const response = await this.duffelService.listOffers(
      query.offerRequestId,
      query.after,
      query.limit,
      query.sort,
      query.maxConnections,
    );

    return normalizeOffersListResponse(response, query.offerRequestId);
  }

  @Get('offers/:offerId')
  @ApiOperation({ summary: 'Get a fresh Duffel offer by id' })
  async getOfferById(
    @Param('offerId') offerId: string,
    @Query() query: GetDuffelOfferByIdQueryDto,
  ) {
    const response = await this.duffelService.getOfferById(
      offerId,
      query.returnAvailableServices,
    );

    return normalizeOfferDetailResponse(response);
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
}
