/**
 * File: cfdi.module.ts
 * Description:
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CfdiController } from './cfdi.controller';
import { CfdiService } from './cfdi.service';
import { CfdiChecks } from './cfdi.checks';
import { Cfdi } from './cfdi.entity';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cfdi]), GuardsModule],
  controllers: [CfdiController],
  providers: [CfdiService, CfdiChecks],
  exports: [CfdiService],
})
export class CfdiModule {}

/**
 * Modification History:
 * - 2026-02-26:
 */
