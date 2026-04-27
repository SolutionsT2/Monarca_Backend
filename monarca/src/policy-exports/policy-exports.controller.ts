import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PolicyExportsService } from './policy-exports.service';

@Controller('policy-exports')
export class PolicyExportsController {
  constructor(private readonly policyExportsService: PolicyExportsService) {}

  @Get('advance-policies')
  async downloadAdvancePolicies(@Res() res: Response) {
    try {
      const data = await this.policyExportsService.generateAdvancePolicies();
      
      const fileName = `polizas_anticipo_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      return res.status(200).send(data);
    } catch (error) {
      return res.status(error.status || 500).json({
        message: error.message || 'Internal server error',
      });
    }
  }
}
