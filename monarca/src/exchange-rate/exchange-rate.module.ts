/**
 * File: exchange-rate.module.ts
 * Description: Module that registers the ExchangeRate entity, BanxicoClient, ExchangeRateService and ExchangeRateController.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { BanxicoClient } from './banxico.client';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate])],
  controllers: [ExchangeRateController],
  providers: [BanxicoClient, ExchangeRateService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}