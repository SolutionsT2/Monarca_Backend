/**
 * File: cfdi.service.ts
 * Description:
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { CfdiChecks } from './cfdi.checks';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cfdi } from './cfdi.entity';
import * as soap from 'soap';
import * as fs from 'fs/promises';
import { join } from 'path';

@Injectable()
export class CfdiService {
  constructor(
    private readonly cfdiChecks: CfdiChecks,

    @InjectRepository(Cfdi)
    private readonly cfdiRepository: Repository<Cfdi>,
  ) {}
  
  async previewForVoucher(xml: string) {
    return this.cfdiChecks.extractVoucherAutofillFields(xml);
  }


  async processXML(xml: string) {
    const data = await this.cfdiChecks.extractData(xml);

    const satStatus = await this.validateWithSAT(data);

    if (satStatus !== 'Vigente') {
      throw new BadRequestException(
        `La factura no está aprobada ante el SAT. Estado recibido: ${satStatus}`,
      );
    }

    const filePath = await this.saveInvoiceXml(xml, data.uuid);

    const existing = await this.cfdiRepository.findOne({
      where: { uuid: data.uuid },
    });

    if (existing) {
      existing.issuerRfc = data.issuerRfc;
      existing.receiverRfc = data.receiverRfc;
      existing.total = data.total;
      existing.status = 'APROBADO';
      existing.filePath = filePath;
      return this.cfdiRepository.save(existing);
    }

    const cfdi = this.cfdiRepository.create({
      uuid: data.uuid,
      issuerRfc: data.issuerRfc,
      receiverRfc: data.receiverRfc,
      total: data.total,
      status: 'APROBADO',
      filePath,
    });

    return this.cfdiRepository.save(cfdi);
  }

  private async saveInvoiceXml(xml: string, uuid: string): Promise<string> {
    const dir = join(process.cwd(), 'uploads', 'cfdi');
    await fs.mkdir(dir, { recursive: true });
    const filename = `${uuid}.xml`;
    await fs.writeFile(join(dir, filename), xml, 'utf8');
    return `/files/cfdi/${filename}`;
  }

  async validateWithSAT(data: any): Promise<string> {
    try {
      const url =
        'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?wsdl';

      const expresion = `?re=${data.issuerRfc}&rr=${data.receiverRfc}&tt=${data.total}&id=${data.uuid}`;

      const client = await soap.createClientAsync(url);

      const [result] = await client.ConsultaAsync({
        expresionImpresa: expresion,
      });

      const estado = result?.ConsultaResult?.Estado;

      return estado || 'NO_ENCONTRADO';
    } catch (error) {
      console.error('SAT ERROR:', error.message);
      return 'ERROR';
    }
  }
}

/**
 * Modification History:
 * - 2026-02-26:
 */
