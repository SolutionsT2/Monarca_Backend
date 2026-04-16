/**
 * File: cfdi.checks.ts
 * Description: principal logic, xml parsing and data extraction
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class CfdiChecks {
  async extractData(xml: string) {
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const invoice = parsed['cfdi:Comprobante'] || parsed['Comprobante'];

    if (!invoice) {
      throw new BadRequestException('Invalid CFDI structure');
    }

    const issuerRfc = invoice['cfdi:Emisor']?.$?.Rfc;
    const receiverRfc = invoice['cfdi:Receptor']?.$?.Rfc;
    const total = Number(invoice.$?.Total);
    const uuid =
      invoice['cfdi:Complemento']?.['tfd:TimbreFiscalDigital']?.$?.UUID;

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
}

/**
 * Modification History:
 * - 2026-02-26:
 */
