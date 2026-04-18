/**
 * File: reservations.entity.ts
 * Description: TypeORM entity for reservations linked to a request destination.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RequestsDestination } from '../../requests/entities/requests-destination.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  comments: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  link: string | null;

  @Column({ type: 'float', nullable: false })
  price: number;

  @Column({ type: 'varchar', nullable: true, default: null })
  provider_name: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  provider_offer_id: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  booking_reference: string | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  hold_expires_at: Date | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  provider_meta: Record<string, unknown> | null;

  @Column({ name: 'id_request_destination', type: 'uuid' })
  id_request_destination: string;

  @ManyToOne(
    () => RequestsDestination,
    (requestDestination) => requestDestination.reservations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'id_request_destination' })
  requestDestination: RequestsDestination;
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history; fixed requestDestination type to RequestsDestination.
 */
