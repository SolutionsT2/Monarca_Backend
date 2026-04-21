/**
 * File: vouchers.module.ts
 * Description: Nest module that registers vouchers controller, service, Voucher and Request entities.
 */
import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';
import { GuardsModule } from 'src/guards/guards.module';
import { PolicyEngineModule } from 'src/policy-engine/policy-engine.module';
import { CfdiModule } from 'src/cfdi/cfdi.module';
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Voucher, Request, DocumentClass]),
  GuardsModule,
  PolicyEngineModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Voucher, Request, DocumentClass]),
    GuardsModule,
    PolicyEngineModule,
    CfdiModule,
  ],
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history; removed unused Req import; formatted imports and module options.
 */
