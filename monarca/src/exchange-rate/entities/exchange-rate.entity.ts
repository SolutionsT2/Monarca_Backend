// entidades que representa  los tipos de cambio consultados desde la API del SIE de Banxico.
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('exchange_rates')
@Index(['date', 'source_currency', 'target_currency'], { unique: true })
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string; // id 

  @Column({ type: 'date' })
  date: Date; // fecha del tipo de cambio, checar con la api

  @Column({ length: 3 })
  source_currency: string; // moneda de origen (ej. USD)

  @Column({ length: 3 })
  target_currency: string; // moneda de destino (ej. MXN)

  @Column({ type: 'decimal', precision: 12, scale: 6 })
  rate: number; // el valor de tipo de cambio igual checkar con la api 

  @Column({ length: 50, nullable: true })
  source: string; // fuente del tipo de cambio

  @Column({ default: false })
  is_fallback: boolean; // indica si es un tipo de cambio de respaldo

  @CreateDateColumn({ type: 'timestamptz' })
  fetched_at: Date; // fecha en que se obtuvo el tipo de cambio
}