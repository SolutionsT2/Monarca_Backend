//Dentro de este archivo se encuentra el cliente para consumir la API de Banxico SIE, el cual se encarga de obtener los tipos de cambio históricos para diferentes monedas con respecto al peso mexicano (MXN).
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BanxicoRateDto } from './type/exchange-rate.types';

@Injectable()
export class BanxicoClient {
  private readonly BASE_URL = 'https://www.banxico.org.mx/SieAPIRest/service/v1';
  private readonly token: string = process.env.BANXICO_TOKEN ?? '';

  // Map of currency codes to Banxico series IDs
  private readonly SERIES_MAP: Record<string, string> = {
    USD: 'SF43718',  // Dolares a Pesos Mexicanos
    EUR: 'SF46410',  // Euros a Pesos Mexicanos
    JPY: 'SF46406',  // Yenes a Pesos Mexicanos
    CNY: 'SF290383', // Yuanes a Pesos Mexicanos
    PEN: 'SF63519',  // Soles peruanos a Pesos Mexicanos
  };

  /**
   * Fetches the exchange rate for a given currency to MXN for a specific date.
   * Returns null if no data is available for that date (weekend, holiday).
   */
  async fetchRate(date: string, sourceCurrency: string = 'USD'): Promise<BanxicoRateDto | null> {
    const serie = this.SERIES_MAP[sourceCurrency];

    if (!serie) {
      throw new HttpException(`Currency ${sourceCurrency} is not supported`, HttpStatus.BAD_REQUEST);
    }

    const url = `${this.BASE_URL}/series/${serie}/datos/${date}/${date}`;

    console.log('Fetching URL:', url);
    console.log('Serie:', serie);

    const response = await fetch(url, {
      headers: {
        'Bmx-Token': this.token,
        'Accept': 'application/json',
      },
    });

    if (response.status === 401) {
      throw new HttpException('Invalid Banxico token', HttpStatus.UNAUTHORIZED);
    }

    if (response.status === 429) {
      throw new HttpException('Banxico rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (response.status === 503) {
      throw new HttpException('Banxico service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const text = await response.text();

    console.log('Banxico response:', text);

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      // Banxico returned HTML instead of JSON (weekend/holiday error page)
      return null;
    }

    const dato = json?.bmx?.series?.[0]?.datos?.[0]?.dato;

    if (!dato || dato === 'N/E') return null;

    return {
      fecha: date,
      valor: parseFloat(dato.replace(',', '')),
      serie,
      fuente: 'Banxico SIE',
    };
  }
}

