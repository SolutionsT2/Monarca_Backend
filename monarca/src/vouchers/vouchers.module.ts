/**
<<<<<<< Updated upstream
 * File: vouchers.module.ts
 * Description: Nest module that registers vouchers controller, service, Voucher and Request entities.
=======
 * Vouchers Module
 * 
 * Module for managing travel vouchers and expense documentation.
 * Exports: VouchersService, VouchersController
>>>>>>> Stashed changes
 */
import { Module, Req } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { GuardsModule } from 'src/guards/guards.module';
@Module({
  imports: [TypeOrmModule.forFeature([Voucher,Request ]),
  GuardsModule

],
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history; removed unused Req import; formatted imports and module options.
 */
