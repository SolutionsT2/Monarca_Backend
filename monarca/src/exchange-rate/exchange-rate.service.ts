import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { BanxicoClient } from './banxico.client';
import { ExchangeRateDto, BanxicoRateDto } from './type/exchange-rate.types';

@Injectable()
export class ExchangeRateService {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepo: Repository<ExchangeRate>,
    private readonly banxicoClient: BanxicoClient,
  ) {}

  async getRate(date: string, sourceCurrency: string, targetCurrency: string): Promise<ExchangeRateDto> {
    const rateDate = new Date(date);

    // Checa si ya tenemos el tipo de cambio en cache
    const cached = await this.exchangeRateRepo.findOne({
      where: { date: rateDate, source_currency: sourceCurrency, target_currency: targetCurrency },
    });

    if (cached) {
      return this.toDto(cached);
    }

    // Query Banxico
    const banxicoData = await this.banxicoClient.fetchRate(date, sourceCurrency);

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

    // Si Banxico no tiene el dato (fin de semana, festivo, puente),
    // retrocedemos día por día hasta encontrar un dato válido
    let fallbackDate = new Date(date);
    let fallbackData: BanxicoRateDto | null = null;
    let attempts = 0;

    while (!fallbackData && attempts < 10) {
      fallbackDate.setDate(fallbackDate.getDate() - 1);
      const fallbackDateStr = fallbackDate.toISOString().split('T')[0];
      fallbackData = await this.banxicoClient.fetchRate(fallbackDateStr, sourceCurrency);
      attempts++;
    }

    if (!fallbackData) {
      throw new NotFoundException(`No exchange rate available for ${date}`);
    }

    const saved = await this.exchangeRateRepo.save({
      date: rateDate,
      source_currency: sourceCurrency,
      target_currency: targetCurrency,
      rate: fallbackData.valor,
      source: fallbackData.serie,
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