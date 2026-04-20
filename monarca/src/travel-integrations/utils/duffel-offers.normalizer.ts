type JsonMap = Record<string, unknown>;

type AirportSummary = {
  iata_code: string | null;
  name: string | null;
  city_name: string | null;
};

type CarrierSummary = {
  id: string | null;
  iata_code: string | null;
  name: string | null;
  logo_symbol_url: string | null;
  logo_lockup_url: string | null;
};

type SegmentSummary = {
  id: string | null;
  flight_number: string | null;
  departing_at: string | null;
  arriving_at: string | null;
  duration: string | null;
  origin: AirportSummary;
  destination: AirportSummary;
  marketing_carrier: CarrierSummary;
  operating_carrier: CarrierSummary;
};

type SliceSummary = {
  id: string | null;
  departing_at: string | null;
  arriving_at: string | null;
  duration: string | null;
  origin: AirportSummary;
  destination: AirportSummary;
  segments: SegmentSummary[];
  connections: number;
};

export type NormalizedDuffelOffer = {
  offer_id: string | null;
  offer_request_id: string | null;
  live_mode: boolean | null;
  owner: CarrierSummary;
  price: {
    total_amount: string | null;
    total_currency: string | null;
    base_amount: string | null;
    base_currency: string | null;
    tax_amount: string | null;
    tax_currency: string | null;
  };
  expires_at: string | null;
  total_emissions_kg: string | null;
  payment_requirements: JsonMap | null;
  operating_carriers: CarrierSummary[];
  slices: SliceSummary[];
  total_connections: number;
};

export type NormalizedDuffelOffersListResponse = {
  offer_request_id: string;
  pagination: {
    after: string | null;
    before: string | null;
    limit: number | null;
  };
  offers: NormalizedDuffelOffer[];
};

export type NormalizedDuffelOfferDetailResponse = {
  offer: NormalizedDuffelOffer;
};

export type NormalizedDuffelOfferRequestResponse = {
  offer_request_id: string | null;
  created_at: string | null;
  live_mode: boolean | null;
};

export function normalizeOfferRequestResponse(
  response: unknown,
): NormalizedDuffelOfferRequestResponse {
  const root = asObject(response);
  const data = asObject(root.data) ?? root;

  return {
    offer_request_id: asString(data.id),
    created_at: asString(data.created_at),
    live_mode: asBoolean(data.live_mode),
  };
}

export function normalizeOffersListResponse(
  response: unknown,
  offerRequestId: string,
): NormalizedDuffelOffersListResponse {
  const root = asObject(response);
  const meta = asObject(root.meta);
  const data = asArray(root.data);

  return {
    offer_request_id: offerRequestId,
    pagination: {
      after: asString(meta?.after),
      before: asString(meta?.before),
      limit: asNumber(meta?.limit),
    },
    offers: data.map((item) => normalizeOffer(item)),
  };
}

export function normalizeOfferDetailResponse(
  response: unknown,
): NormalizedDuffelOfferDetailResponse {
  const root = asObject(response);
  const data = asObject(root.data) ?? root;

  return {
    offer: normalizeOffer(data),
  };
}

function normalizeOffer(input: unknown): NormalizedDuffelOffer {
  const offer = asObject(input);
  const slices = asArray(offer.slices).map((slice) => normalizeSlice(slice));
  const carriers = collectOperatingCarriers(slices);

  return {
    offer_id: asString(offer.id),
    offer_request_id: asString(offer.offer_request_id),
    live_mode: asBoolean(offer.live_mode),
    owner: mapCarrier(offer.owner),
    price: {
      total_amount: asString(offer.total_amount),
      total_currency: asString(offer.total_currency),
      base_amount: asString(offer.base_amount),
      base_currency: asString(offer.base_currency),
      tax_amount: asString(offer.tax_amount),
      tax_currency: asString(offer.tax_currency),
    },
    expires_at: asString(offer.expires_at),
    total_emissions_kg: asString(offer.total_emissions_kg),
    payment_requirements: asObject(offer.payment_requirements),
    operating_carriers: carriers,
    slices,
    total_connections: slices.reduce((sum, slice) => sum + slice.connections, 0),
  };
}

function normalizeSlice(input: unknown): SliceSummary {
  const slice = asObject(input);
  const segments = asArray(slice.segments).map((segment) => normalizeSegment(segment));

  return {
    id: asString(slice.id),
    departing_at: asString(slice.departing_at),
    arriving_at: asString(slice.arriving_at),
    duration: asString(slice.duration),
    origin: mapAirport(slice.origin),
    destination: mapAirport(slice.destination),
    segments,
    connections: Math.max(segments.length - 1, 0),
  };
}

function normalizeSegment(input: unknown): SegmentSummary {
  const segment = asObject(input);

  return {
    id: asString(segment.id),
    flight_number: asString(segment.operating_carrier_flight_number),
    departing_at: asString(segment.departing_at),
    arriving_at: asString(segment.arriving_at),
    duration: asString(segment.duration),
    origin: mapAirport(segment.origin),
    destination: mapAirport(segment.destination),
    marketing_carrier: mapCarrier(segment.marketing_carrier),
    operating_carrier: mapCarrier(segment.operating_carrier),
  };
}

function mapAirport(value: unknown): AirportSummary {
  const airport = asObject(value);

  return {
    iata_code: asString(airport.iata_code),
    name: asString(airport.name),
    city_name: asString(airport.city_name),
  };
}

function mapCarrier(value: unknown): CarrierSummary {
  const carrier = asObject(value);

  return {
    id: asString(carrier.id),
    iata_code: asString(carrier.iata_code),
    name: asString(carrier.name),
    logo_symbol_url: asString(carrier.logo_symbol_url),
    logo_lockup_url: asString(carrier.logo_lockup_url),
  };
}

function collectOperatingCarriers(slices: SliceSummary[]): CarrierSummary[] {
  const map = new Map<string, CarrierSummary>();

  for (const slice of slices) {
    for (const segment of slice.segments) {
      const carrier = segment.operating_carrier;
      const key = `${carrier.iata_code ?? ''}|${carrier.name ?? ''}`;

      if (!map.has(key)) {
        map.set(key, carrier);
      }
    }
  }

  return Array.from(map.values());
}

function asObject(value: unknown): JsonMap {
  return typeof value === 'object' && value !== null
    ? (value as JsonMap)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}
