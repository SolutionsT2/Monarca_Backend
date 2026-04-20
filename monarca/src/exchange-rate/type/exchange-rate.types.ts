// dentro de este archivo se definen los tipos de datos relacionados con los tipos de cambio, incluyendo el formato de los datos que se reciben desde la API de Banxico y el formato interno que se utiliza dentro del sistema para manejar esta información.


// esto hace que el DTO de Banxico sea más fácil de manejar y entender dentro del sistema, 
export interface BanxicoRateDto {
  fecha: string;
  valor: number;
  serie: string;
  fuente: string;
}

export interface ExchangeRateDto {
  date: string;
  rate: number;
  sourceCurrency: string;
  targetCurrency: string;
  isFallback: boolean;
}
