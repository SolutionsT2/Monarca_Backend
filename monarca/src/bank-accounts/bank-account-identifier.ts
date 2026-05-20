export type BankAccountIdentifierType =
  | 'IBAN'
  | 'CLABE'
  | 'SWIFT'
  | 'BSB'
  | 'ROUTING'
  | 'TRANSIT'
  | 'OTHER';

export interface BankAccountNormalizationResult {
  name: string;
  country: string;
  region: string;
  identifierType: BankAccountIdentifierType;
  identifierValue: string;
}

export class BankAccountInputValidationError extends Error {
  constructor(public readonly errors: Record<string, string[]>) {
    super('Invalid bank account payload');
    this.name = 'BankAccountInputValidationError';
  }
}

const COUNTRY_ALIASES = {
  mexico: ['mexico', 'méxico', 'mx'],
  unitedStates: ['united states', 'united states of america', 'usa', 'us', 'u.s.a.'],
  canada: ['canada', 'ca', 'can'],
  australia: ['australia', 'au', 'aus'],
  newZealand: ['new zealand', 'nz', 'nzl'],
} as const;

const SWIFT_REGEX = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const BSB_REGEX = /^\d{6}$/;
const ROUTING_REGEX = /^\d{9}$/;
const CLABE_REGEX = /^\d{18}$/;
const CANADA_TRANSIT_REGEX = /^\d{9}$/;
const FALLBACK_NUMERIC_REGEX = /^\d{4,34}$/;

export function normalizeTextInput(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeCountryKey(country?: string | null): string {
  return normalizeTextInput(country)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizeIdentifierInput(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .replace(/[\s-]+/g, '')
    .toUpperCase();
}

export function normalizeBankAccountInput(data: {
  name?: string | null;
  country?: string | null;
  region?: string | null;
  regionOther?: string | null;
  identifier?: string | null;
}): BankAccountNormalizationResult {
  const errors: Record<string, string[]> = {};

  const name = normalizeTextInput(data.name);
  const country = normalizeTextInput(data.country);
  const region = normalizeTextInput(data.region);
  const regionOther = normalizeTextInput(data.regionOther);
  const identifierValue = normalizeIdentifierInput(data.identifier);

  if (!name) {
    errors.name = ['El nombre es obligatorio'];
  }

  if (!country) {
    errors.country = ['El país es obligatorio'];
  }

  if (!region) {
    errors.region = ['La región es obligatoria'];
  }

  const normalizedRegion = region.toLowerCase() === 'other' ? regionOther : region;

  if (region.toLowerCase() === 'other' && !regionOther) {
    errors.regionOther = ['La región personalizada es obligatoria cuando la región es Otra'];
  }

  if (!identifierValue) {
    errors.iban = ['El identificador de la cuenta bancaria es obligatorio'];
  }

  const resolvedIdentifier = validateIdentifierByCountry(country, identifierValue, errors);

  if (Object.keys(errors).length > 0) {
    throw new BankAccountInputValidationError(errors);
  }

  return {
    name,
    country,
    region: normalizedRegion,
    identifierType: resolvedIdentifier.identifierType,
    identifierValue: resolvedIdentifier.identifierValue,
  };
}

function validateIdentifierByCountry(
  country: string,
  identifierValue: string,
  errors: Record<string, string[]>,
): {
  identifierType: BankAccountIdentifierType;
  identifierValue: string;
} {
  const countryKey = normalizeCountryKey(country);

  if (isInList(countryKey, COUNTRY_ALIASES.mexico)) {
    if (isValidClabe(identifierValue)) {
      return { identifierType: 'CLABE', identifierValue };
    }

    if (isValidSwift(identifierValue)) {
      return { identifierType: 'SWIFT', identifierValue };
    }

    errors.iban = ['CLABE inválida o formato SWIFT/BIC no válido'];
    return { identifierType: 'OTHER', identifierValue };
  }

  if (isInList(countryKey, COUNTRY_ALIASES.unitedStates)) {
    if (isValidAbaRouting(identifierValue)) {
      return { identifierType: 'ROUTING', identifierValue };
    }

    if (isValidSwift(identifierValue)) {
      return { identifierType: 'SWIFT', identifierValue };
    }

    errors.iban = ['El número de ruta ABA no es válido o el formato SWIFT/BIC no es válido'];
    return { identifierType: 'OTHER', identifierValue };
  }

  if (isInList(countryKey, COUNTRY_ALIASES.canada)) {
    if (isValidCanadaTransit(identifierValue)) {
      return { identifierType: 'TRANSIT', identifierValue };
    }

    if (isValidSwift(identifierValue)) {
      return { identifierType: 'SWIFT', identifierValue };
    }

    errors.iban = ['El número de tránsito/institución de Canadá no es válido o el formato SWIFT/BIC no es válido'];
    return { identifierType: 'OTHER', identifierValue };
  }

  if (isInList(countryKey, COUNTRY_ALIASES.australia) || isInList(countryKey, COUNTRY_ALIASES.newZealand)) {
    if (isValidBsb(identifierValue)) {
      return { identifierType: 'BSB', identifierValue };
    }

    if (isValidSwift(identifierValue)) {
      return { identifierType: 'SWIFT', identifierValue };
    }

    errors.iban = ['El formato BSB no es válido o el formato SWIFT/BIC no es válido'];
    return { identifierType: 'OTHER', identifierValue };
  }

  if (isValidIban(identifierValue)) {
    return { identifierType: 'IBAN', identifierValue };
  }

  if (isValidSwift(identifierValue)) {
    return { identifierType: 'SWIFT', identifierValue };
  }

  if (FALLBACK_NUMERIC_REGEX.test(identifierValue)) {
    return { identifierType: 'OTHER', identifierValue };
  }

  errors.iban = ['El checksum IBAN no es válido, el formato SWIFT/BIC no es válido o el identificador numérico no cumple el largo permitido'];
  return { identifierType: 'OTHER', identifierValue };
}

function isInList(value: string, candidates: readonly string[]): boolean {
  return candidates.includes(value);
}

function isValidSwift(identifierValue: string): boolean {
  return SWIFT_REGEX.test(identifierValue);
}

function isValidBsb(identifierValue: string): boolean {
  return BSB_REGEX.test(identifierValue);
}

function isValidCanadaTransit(identifierValue: string): boolean {
  return CANADA_TRANSIT_REGEX.test(identifierValue);
}

function isValidAbaRouting(identifierValue: string): boolean {
    return ROUTING_REGEX.test(identifierValue);
}

function isValidClabe(identifierValue: string): boolean {
  return CLABE_REGEX.test(identifierValue);
}

function isValidIban(identifierValue: string): boolean {
  return /^[A-Z0-9]{15,34}$/.test(identifierValue);

  const rearranged = `${identifierValue.slice(4)}${identifierValue.slice(0, 4)}`;
  const expanded = rearranged
    .split('')
    .map((character) => {
      if (/[A-Z]/.test(character)) {
        return String(character.charCodeAt(0) - 55);
      }

      return character;
    })
    .join('');

  let remainder = 0;
  for (const digit of expanded) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder === 1;
}