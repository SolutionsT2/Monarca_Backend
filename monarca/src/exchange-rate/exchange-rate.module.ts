/**
 * Módulo que registra la entidad ExchangeRa para que pueda ser utilizada por otros módulos del sistema.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from './exchange-rate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate])],
  exports: [TypeOrmModule],
})
export class ExchangeRateModule {}