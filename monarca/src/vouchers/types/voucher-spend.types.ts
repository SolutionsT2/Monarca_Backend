/**
 * File: voucher-spend.types.ts
 * Description: Shared voucher spend-class codes and normalization helpers.
 */

export const VOUCHER_SPEND_CODES = [
  'ALIF',
  'CAPA',
  'CPF',
  'FIDP',
  'GAS',
  'HTLP',
  'LAUN',
  'NDPR',
  'NDVA',
  'REAU',
  'TCCF',
  'TSCF',
  'TRAA',
  'AIRP',
] as const;

export type VoucherSpendCode = (typeof VOUCHER_SPEND_CODES)[number];

const VOUCHER_SPEND_CLASS_ALIASES: Record<string, VoucherSpendCode> = {
  // Canonical codes
  ALIF: 'ALIF',
  CAPA: 'CAPA',
  CPF: 'CPF',
  FIDP: 'FIDP',
  GAS: 'GAS',
  HTLP: 'HTLP',
  LAUN: 'LAUN',
  NDPR: 'NDPR',
  NDVA: 'NDVA',
  REAU: 'REAU',
  TCCF: 'TCCF',
  TSCF: 'TSCF',
  TRAA: 'TRAA',
  AIRP: 'AIRP',

  // Legacy/full-name aliases seen in early backend rules
  ALIMENTACION: 'ALIF',
  CAPACITACION: 'CAPA',
  CASETA: 'CPF',
  FICHA_DEPOSITO: 'FIDP',
  GASOLINA: 'GAS',
  HOTEL_PAGADO: 'HTLP',
  LAVANDERIA: 'LAUN',
  NO_DEDUCIBLE: 'NDPR',
  NO_DEDUCIBLE_VALE_AZUL: 'NDVA',
  RENTA_AUTOMOVIL: 'REAU',
  TAXI_CON_COMPROBANTE_FISCAL: 'TCCF',
  TAXI_SIN_COMPROBANTE_FISCAL: 'TSCF',
  TRANS_AUTOMOVIL_Y_O_AUTOBUS: 'TRAA',
  VUELO_PAGADO: 'AIRP',
};

export function normalizeVoucherSpendClass(rawValue: string): string {
  const normalized = rawValue.trim().toUpperCase();
  return VOUCHER_SPEND_CLASS_ALIASES[normalized] ?? normalized;
}
