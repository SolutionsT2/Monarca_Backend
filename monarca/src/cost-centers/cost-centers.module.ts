/**
 * File: cost-centers.module.ts
 * Description: NestJS module exposing TypeORM repository for cost centers.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostCenter } from './entity/cost-centers.entity';
import { CostCentersController } from './cost-centers.controller';
import { CostCentersService } from './cost-centers.service';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [
    GuardsModule,
    TypeOrmModule.forFeature([CostCenter, Department, Roles]),
  ],
  controllers: [CostCentersController],
  providers: [CostCentersService],
  exports: [TypeOrmModule, CostCentersService],
})
export class CostCentersModule {}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
