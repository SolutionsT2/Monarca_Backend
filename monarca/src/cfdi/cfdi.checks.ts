/**
 * File: cfdi.checks.ts
 * Description: principal logic, xml parsing and data extraction
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';

/** Maps CFDI IVA TasaOCuota to voucher form tax codes (see Refunds/local/dummyData taxIndicatorOptions). */
export function mapTasaToTaxIndicator(tasaOCuota: string | undefined): string | null {
  if (tasaOCuota === undefined || tasaOCuota === null || tasaOCuota === '') {
    return null;
  }
  const n = Number(String(tasaOCuota).trim());
  if (Number.isNaN(n)) {
    return null;
  }
  if (Math.abs(n - 0.16) < 0.0001) {
    return 'V7';
  }
  if (Math.abs(n - 0.08) < 0.0001) {
    return 'VC';
  }
  if (Math.abs(n) < 0.0001) {
    return 'V0';
  }
  return null;
}

function collectTraslados(invoice: Record<string, unknown>): Array<Record<string, unknown>> {
  const imp = (invoice['cfdi:Impuestos'] || invoice['Impuestos']) as Record<string, unknown> | undefined;
  if (!imp) {
    return [];
  }
  const trRoot = (imp['cfdi:Traslados'] || imp['Traslados']) as Record<string, unknown> | undefined;
  if (!trRoot) {
    return [];
  }
  const raw = trRoot['cfdi:Traslado'] || trRoot['Traslado'];
  if (!raw) {
    return [];
  }
  const list = Array.isArray(raw) ? raw : [raw];
  return list as Record<string, unknown>[];
}

function extractTaxIndicatorFromInvoice(invoice: Record<string, unknown>): string | null {
  const traslados = collectTraslados(invoice);
  for (const t of traslados) {
    const node = t as { $?: Record<string, string> };
    const attrs = (node.$ || {}) as Record<string, string>;
    const tipoFactor = attrs.TipoFactor;
    if (tipoFactor === 'Exento') {
      return 'V0';
    }
    const impuesto = attrs.Impuesto;
    if (impuesto && impuesto !== '002') {
      continue;
    }
    const tasa = attrs.TasaOCuota;
    const mapped = mapTasaToTaxIndicator(tasa);
    if (mapped) {
      return mapped;
    }
  }
  const first = traslados[0] as { $?: Record<string, string> } | undefined;
  if (first?.$?.TasaOCuota !== undefined) {
    return mapTasaToTaxIndicator(first.$.TasaOCuota);
  }
  return null;
}

export function cfdiFechaToDateInput(fecha: string | undefined): string | null {
  if (!fecha || typeof fecha !== 'string') {
    return null;
  }
  const d = fecha.trim();
  const dayPart = d.includes('T') ? d.split('T')[0] : d.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) {
    return dayPart;
  }
  return null;
}

@Injectable()
export class CfdiChecks {
  async extractData(xml: string) {
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const invoice = parsed['cfdi:Comprobante'] || parsed['Comprobante'];

    if (!invoice) {
      throw new BadRequestException('Invalid CFDI structure');
    }

    const inv = invoice as Record<string, unknown>;
    const issuerRfc = (inv['cfdi:Emisor'] as { $?: { Rfc?: string } })?.$?.Rfc;
    const receiverRfc = (inv['cfdi:Receptor'] as { $?: { Rfc?: string } })?.$?.Rfc;
    const total = Number((inv.$ as { Total?: string })?.Total);
    const uuid =
      (inv['cfdi:Complemento'] as { 'tfd:TimbreFiscalDigital'?: { $?: { UUID?: string } } })?.[
        'tfd:TimbreFiscalDigital'
      ]?.$?.UUID;

    if (!uuid || !issuerRfc || !receiverRfc || !total) {
      throw new BadRequestException('Incomplete CFDI data');
    }

    return {
      uuid,
      issuerRfc,
      receiverRfc,
      total,
    };
  }

  async extractVoucherAutofillFields(xml: string): Promise<{
    total: number | null;
    fecha: string | null;
    taxIndicator: string | null;
  }> {
    let parsed: Record<string, unknown>;
    try {
      parsed = (await parseStringPromise(xml, { explicitArray: false })) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('XML inválido o no se pudo leer');
    }

    const invoice = (parsed['cfdi:Comprobante'] || parsed['Comprobante']) as
      | Record<string, unknown>
      | undefined;

    if (!invoice) {
      throw new BadRequestException('Estructura CFDI no reconocida');
    }

    const attrs = (invoice.$ || {}) as { Total?: string; Fecha?: string };
    const totalRaw = attrs.Total;
    const total =
      totalRaw !== undefined && totalRaw !== '' && !Number.isNaN(Number(totalRaw))
        ? Number(totalRaw)
        : null;

    const fecha = cfdiFechaToDateInput(attrs.Fecha);
    const taxIndicator = extractTaxIndicatorFromInvoice(invoice);

    return {
      total,
      fecha,
      taxIndicator,
    };
  }
}

/**
 * Modification History:
 * - 2026-02-26:
 */
