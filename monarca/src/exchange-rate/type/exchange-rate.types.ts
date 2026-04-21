
// esto hace que el DTO de Banxico sea más fácil de manejar y entender dentro del sistema, 
export interface BanxicoRateDto {
  fecha: string;
  valor: number;
  serie: string;
  fuente: string;
}

/** Clean exchange rate data used internally */
export interface ExchangeRateDto {
  date: string;
  rate: number;
  sourceCurrency: string;
  targetCurrency: string;
  isFallback: boolean;
}