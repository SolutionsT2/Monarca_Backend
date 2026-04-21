// en este otro archivo hacemos que jale campos de date y currency como parámetros de consulta para obtener el tipo de cambio correspondiente a esa fecha y moneda. 
import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';

@Controller('exchange-rates')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  /**
   * Returns the exchange rate for a given date and currency pair.
   * @param date Date in YYYY-MM-DD format.
   * @param currency Source currency code (default: USD).
   */
  @Get()
  getRate(
    @Query('date') date: string,
    @Query('currency') currency: string = 'USD',
  ) {
    return this.exchangeRateService.getRate(date, currency, 'MXN');
  }
}