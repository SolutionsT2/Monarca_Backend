// Y en este archivo se implementa el servicio de tipos de cambio, que es el encargado de manejar la lógica para obtener los tipos de cambio, ya sea consultando la base de datos o haciendo una solicitud a Banxico si no se encuentra en caché. 
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { BanxicoClient } from './banxico.client';
import { ExchangeRateDto } from './type/exchange-rate.types';

@Injectable()
export class ExchangeRateService {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepo: Repository<ExchangeRate>,
    private readonly banxicoClient: BanxicoClient,
  ) {}

 // el método getRate es el encargado de obtener el tipo de cambio para una fecha y par de monedas específico. Primero verifica si el tipo de cambio ya está almacenado en la base de datos (cache). Si no lo encuentra, hace una solicitud a Banxico para obtener el tipo de cambio USD/MXN de esa fecha. Si Banxico no tiene el dato (por ejemplo, si es un fin de semana o día festivo), busca el último tipo de cambio disponible antes de esa fecha para usarlo como fallback. Finalmente, devuelve un DTO con la información del tipo de cambio.
  async getRate(date: string, sourceCurrency: string, targetCurrency: string): Promise<ExchangeRateDto> {
    const rateDate = new Date(date);

    // checa si ya tenemos el tipo de cambio para esta fecha en la base de datos (cache)
    const cached = await this.exchangeRateRepo.findOne({
      where: { date: rateDate, source_currency: sourceCurrency, target_currency: targetCurrency },
    });

    if (cached) {
      return this.toDto(cached);
    }

    // Query Banxico
    const banxicoData = await this.banxicoClient.fetchUsdMxnRate(date);

    if (banxicoData) {
      const saved = await this.exchangeRateRepo.save({
        date: rateDate,
        source_currency: sourceCurrency,
        target_currency: targetCurrency,
        rate: banxicoData.valor,
        source: banxicoData.serie,
        is_fallback: false,
      });
      return this.toDto(saved);
    }

    // Si Banxico no tiene el dato, buscamos el último tipo de cambio disponible antes de esa fecha para usarlo como fallback.
    const fallback = await this.exchangeRateRepo.findOne({
      where: {
        source_currency: sourceCurrency,
        target_currency: targetCurrency,
        date: LessThanOrEqual(rateDate),
        is_fallback: false,
      },
      order: { date: 'DESC' },
    });

    if (!fallback) {
      throw new NotFoundException(`No exchange rate available for ${date}`);
    }

    const saved = await this.exchangeRateRepo.save({
      date: rateDate,
      source_currency: sourceCurrency,
      target_currency: targetCurrency,
      rate: fallback.rate,
      source: fallback.source,
      is_fallback: true,
    });

    return this.toDto(saved);
  }


  
  private toDto(entity: ExchangeRate): ExchangeRateDto {
    return {
      date: typeof entity.date === 'string' ? entity.date : entity.date.toISOString().split('T')[0],
      rate: Number(entity.rate),
      sourceCurrency: entity.source_currency,
      targetCurrency: entity.target_currency,
      isFallback: entity.is_fallback,
    };
  }
}
