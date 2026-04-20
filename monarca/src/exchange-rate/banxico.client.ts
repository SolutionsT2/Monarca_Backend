// en este archivo lo que hace es que se define el cliente HTTP para consultar la API del SIE de Banxico, para el tipo de cambio 
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BanxicoRateDto } from './type/exchange-rate.types';

@Injectable()
export class BanxicoClient {
  private readonly BASE_URL = 'https://www.banxico.org.mx/SieAPIRest/service/v1';
  private readonly token: string = process.env.BANXICO_TOKEN ?? '';
  private readonly SERIE_USD_MXN = 'SF43718';


  async fetchUsdMxnRate(date: string): Promise<BanxicoRateDto | null> {
    const url = `${this.BASE_URL}/series/${this.SERIE_USD_MXN}/datos/${date}/${date}`;

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

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return null;
    }

    const dato = json?.bmx?.series?.[0]?.datos?.[0]?.dato;

    if (!dato || dato === 'N/E') return null;

    return {
      fecha: date,
      valor: parseFloat(dato.replace(',', '')),
      serie: this.SERIE_USD_MXN,
      fuente: 'Banxico SIE',
    };
  }
}
