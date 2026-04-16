import {
  normalizeOfferDetailResponse,
  normalizeOfferRequestResponse,
  normalizeOffersListResponse,
} from './duffel-offers.normalizer';

describe('duffel-offers.normalizer', () => {
  it('normalizes offer request response', () => {
    const input = {
      data: {
        id: 'orq_123',
        created_at: '2026-04-15T10:00:00Z',
        live_mode: false,
      },
    };

    expect(normalizeOfferRequestResponse(input)).toEqual({
      offer_request_id: 'orq_123',
      created_at: '2026-04-15T10:00:00Z',
      live_mode: false,
    });
  });

  it('normalizes offers list with pagination and computed connections', () => {
    const input = {
      meta: {
        after: 'cursor_after',
        before: null,
        limit: 20,
      },
      data: [
        {
          id: 'off_1',
          offer_request_id: 'orq_123',
          live_mode: false,
          owner: { id: 'air_1', iata_code: 'XX', name: 'Example Air' },
          total_amount: '120.50',
          total_currency: 'USD',
          base_amount: '100.00',
          base_currency: 'USD',
          tax_amount: '20.50',
          tax_currency: 'USD',
          expires_at: '2026-04-15T11:00:00Z',
          total_emissions_kg: '123',
          payment_requirements: { requires_instant_payment: true },
          slices: [
            {
              id: 'sli_1',
              departing_at: '2026-05-01T09:00:00',
              arriving_at: '2026-05-01T14:00:00',
              duration: 'PT5H',
              origin: { iata_code: 'MEX', name: 'Mexico City', city_name: 'Mexico City' },
              destination: { iata_code: 'JFK', name: 'JFK', city_name: 'New York' },
              segments: [
                {
                  id: 'seg_1',
                  operating_carrier_flight_number: '1234',
                  departing_at: '2026-05-01T09:00:00',
                  arriving_at: '2026-05-01T11:00:00',
                  duration: 'PT2H',
                  origin: { iata_code: 'MEX', name: 'Mexico City', city_name: 'Mexico City' },
                  destination: { iata_code: 'DFW', name: 'Dallas', city_name: 'Dallas' },
                  marketing_carrier: { id: 'mk_1', iata_code: 'MK', name: 'Marketing Air' },
                  operating_carrier: { id: 'op_1', iata_code: 'OP', name: 'Operating Air' },
                },
                {
                  id: 'seg_2',
                  operating_carrier_flight_number: '5678',
                  departing_at: '2026-05-01T12:00:00',
                  arriving_at: '2026-05-01T14:00:00',
                  duration: 'PT2H',
                  origin: { iata_code: 'DFW', name: 'Dallas', city_name: 'Dallas' },
                  destination: { iata_code: 'JFK', name: 'JFK', city_name: 'New York' },
                  marketing_carrier: { id: 'mk_1', iata_code: 'MK', name: 'Marketing Air' },
                  operating_carrier: { id: 'op_1', iata_code: 'OP', name: 'Operating Air' },
                },
              ],
            },
          ],
        },
      ],
    };

    const normalized = normalizeOffersListResponse(input, 'orq_123');

    expect(normalized.offer_request_id).toBe('orq_123');
    expect(normalized.pagination).toEqual({
      after: 'cursor_after',
      before: null,
      limit: 20,
    });
    expect(normalized.offers).toHaveLength(1);
    expect(normalized.offers[0].total_connections).toBe(1);
    expect(normalized.offers[0].operating_carriers).toEqual([
      {
        id: 'op_1',
        iata_code: 'OP',
        name: 'Operating Air',
      },
    ]);
  });

  it('normalizes offer detail from data wrapper', () => {
    const input = {
      data: {
        id: 'off_99',
        offer_request_id: 'orq_99',
        owner: { id: 'air_99', iata_code: 'ZZ', name: 'Duffel Airways' },
        slices: [],
      },
    };

    const normalized = normalizeOfferDetailResponse(input);

    expect(normalized.offer.offer_id).toBe('off_99');
    expect(normalized.offer.offer_request_id).toBe('orq_99');
    expect(normalized.offer.owner.name).toBe('Duffel Airways');
    expect(normalized.offer.slices).toEqual([]);
  });
});
