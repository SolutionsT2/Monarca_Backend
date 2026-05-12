import { Controller, Get, HttpCode, HttpStatus, Query, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { PolicyExportsService } from './policy-exports.service';

/**
 * Valid policy type identifiers accepted by the unified query endpoint.
 * - advance:           Travel Advance Policies  (advance_money > 0)
 * - reconciliation:   Travel Expense Verification Policies (advance > 0, with vouchers)
 * - no-advance:       Travel Expense Policies Without Advance (advance <= 0, with vouchers)
 */
const VALID_POLICY_TYPES = ['advance', 'reconciliation', 'no-advance'] as const;
type PolicyType = (typeof VALID_POLICY_TYPES)[number];

@Controller('policy-exports')
export class PolicyExportsController {
  constructor(private readonly policyExportsService: PolicyExportsService) {}

  /**
   * GET /policy-exports?type=advance&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   *
   * @param type      - Policy type: 'advance' | 'reconciliation' | 'no-advance'
   * @param startDate - ISO date string for the start of the trip date range (inclusive)
   * @param endDate   - ISO date string for the end of the trip date range (inclusive)
   * @returns         Array of policy objects (cabecera + detalle structure)
   */

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPolicies(
    @Query('type') type: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!type || !VALID_POLICY_TYPES.includes(type as PolicyType)) {
      throw new BadRequestException(
        `El tipo de póliza es inválido. Valores permitidos: ${VALID_POLICY_TYPES.join(', ')}`,
      );
    }

    if (!startDate) {
      throw new BadRequestException('La fecha de inicio es obligatoria');
    }
    if (!endDate) {
      throw new BadRequestException('La fecha de fin es obligatoria');
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
    }

    switch (type as PolicyType) {
      case 'advance':
        return this.policyExportsService.generateAdvancePolicies(startDate, endDate);
      case 'reconciliation':
        return this.policyExportsService.generateReconciliationPolicies(startDate, endDate);
      case 'no-advance':
        return this.policyExportsService.generateNoAdvanceReconciliationPolicies(startDate, endDate);
    }
  }

  @Get('advance-policies')
  async downloadAdvancePolicies(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Las fechas de inicio y fin son obligatorias');
    }

    try {
      const data = await this.policyExportsService.generateAdvancePolicies(startDate, endDate);
      
      const fileName = `polizas_anticipo_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      return res.status(200).send(data);
    } catch (error) {
      return res.status(error.status || 500).json({
        message: error.message || 'Error al generar pólizas de anticipos',
      });
    }
  }

  @Get('reconciliation-policies')
  async downloadReconciliationPolicies(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Las fechas de inicio y fin son obligatorias');
    }

    try {
      const data = await this.policyExportsService.generateReconciliationPolicies(startDate, endDate);
      
      const fileName = `polizas_comprobacion_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      return res.status(200).send(data);
    } catch (error) {
      return res.status(error.status || 500).json({
        message: error.message || 'Error al generar pólizas de comprobaciones',
      });
    }
  }

  @Get('no-advance-reconciliation-policies')
  async downloadNoAdvanceReconciliationPolicies(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Las fechas de inicio y fin son obligatorias');
    }

    try {
      const data = await this.policyExportsService.generateNoAdvanceReconciliationPolicies(startDate, endDate);
      
      const fileName = `polizas_comprobacion_sin_anticipo_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      return res.status(200).send(data);
    } catch (error) {
      return res.status(error.status || 500).json({
        message: error.message || 'Error al generar pólizas sin anticipo',
      });
    }
  }
}
