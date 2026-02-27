/**
 * File: cost-centers.module.ts
 * Description: NestJS module exposing TypeORM repository for cost centers.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostCenter } from './entity/cost-centers.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CostCenter])],
  exports: [TypeOrmModule],
})
export class CostCentersModule {}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
