import { ConflictException, UnauthorizedException } from '@nestjs/common';

jest.mock(
  'src/guards/auth.guard',
  () => ({
    AuthGuard: class AuthGuard {},
  }),
  { virtual: true },
);

jest.mock(
  'src/guards/permissions.guard',
  () => ({
    PermissionsGuard: class PermissionsGuard {},
  }),
  { virtual: true },
);

jest.mock(
  'src/requests/requests.checks',
  () => ({
    RequestsChecks: class RequestsChecks {},
  }),
  { virtual: true },
);

const { DuffelController } = require('./duffel.controller');

describe('DuffelController', () => {
  const duffelService = {
    createOfferRequest: jest.fn(),
    listOffers: jest.fn(),
    getOfferById: jest.fn(),
  };

  const requestsChecks = {
    isRequestDestinationTravelAgencyId: jest.fn(),
    getRequestStatusFromRequestDestination: jest.fn(),
  };

  const controller = new DuffelController(
    duffelService as never,
    requestsChecks as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    requestsChecks.isRequestDestinationTravelAgencyId.mockResolvedValue(true);
    requestsChecks.getRequestStatusFromRequestDestination.mockResolvedValue(
      'Pending Reservations',
    );
  });

  it('creates offer request and normalizes response', async () => {
    duffelService.createOfferRequest.mockResolvedValue({
      data: {
        id: 'orq_123',
        created_at: '2026-04-15T10:00:00Z',
        live_mode: false,
      },
    });

    const req = {
      userInfo: { id: 'user_1', id_travel_agency: 'agency_1' },
    };

    const result = await controller.createOfferRequest(req as never, {
      requestDestinationId: 'rd_1',
      data: {
        slices: [{ origin: 'MEX', destination: 'JFK', departure_date: '2026-05-01' }],
        passengers: [{ type: 'adult' }],
      },
    });

    expect(duffelService.createOfferRequest).toHaveBeenCalled();
    expect(result).toEqual({
      offer_request_id: 'orq_123',
      created_at: '2026-04-15T10:00:00Z',
      live_mode: false,
    });
  });

  it('lists offers with query options and normalized payload', async () => {
    duffelService.listOffers.mockResolvedValue({
      meta: { after: null, before: null, limit: 50 },
      data: [
        {
          id: 'off_1',
          offer_request_id: 'orq_1',
          owner: { id: 'air_1', iata_code: 'XX', name: 'Air' },
          slices: [],
        },
      ],
    });

    const result = await controller.listOffers({
      offerRequestId: 'orq_1',
      after: undefined,
      limit: 50,
      sort: 'total_amount',
      maxConnections: 1,
    });

    expect(duffelService.listOffers).toHaveBeenCalledWith(
      'orq_1',
      undefined,
      50,
      'total_amount',
      1,
    );
    expect(result.offers).toHaveLength(1);
    expect(result.offer_request_id).toBe('orq_1');
  });

  it('gets offer detail with optional available services flag', async () => {
    duffelService.getOfferById.mockResolvedValue({
      data: {
        id: 'off_88',
        offer_request_id: 'orq_88',
        owner: { id: 'air_88', iata_code: 'ZZ', name: 'Duffel Airways' },
        slices: [],
      },
    });

    const result = await controller.getOfferById('off_88', {
      returnAvailableServices: true,
    });

    expect(duffelService.getOfferById).toHaveBeenCalledWith('off_88', true);
    expect(result.offer.offer_id).toBe('off_88');
  });

  it('throws UnauthorizedException when agency context is missing', async () => {
    await expect(
      controller.createOfferRequest({ userInfo: {} } as never, {
        requestDestinationId: 'rd_1',
        data: { slices: [], passengers: [] },
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws ConflictException when request is not in Pending Reservations', async () => {
    requestsChecks.getRequestStatusFromRequestDestination.mockResolvedValue('Submitted');

    await expect(
      controller.createOfferRequest(
        { userInfo: { id_travel_agency: 'agency_1', id: 'user_1' } } as never,
        {
          requestDestinationId: 'rd_1',
          data: { slices: [], passengers: [] },
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
