// aqui solo se define el módulo de tipos de cambio, que incluye la entidad de tipo de cambio, el cliente para consultar la API de Banxico, el servicio que maneja la lógica de negocio relacionada con los tipos de cambio y el controlador que expone los endpoints para obtener esta información. 
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
