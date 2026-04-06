/*
 * requests-destination.entity.ts
 *
 * TypeORM entity representing the association between
 * a request and its destinations. Stores trip sequencing,
 * stay details, and logistical requirements.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { Reservation } from 'src/reservations/entity/reservations.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { Destination } from 'src/destinations/entities/destination.entity';

/**
 * Entity representing a destination within a request.
 * Tracks travel sequence, timing, and requirements.
 */
@Entity({ name: 'requests_destinations' })
export class RequestsDestination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_destination' })
  id_destination: string;

  @Column({ name: 'id_request' })
  id_request: string;

  @Column({ name: 'destination_order', type: 'int' })
  destination_order: number;

  @Column({ name: 'stay_days', type: 'int' })
  stay_days: number;

  @Column({ name: 'arrival_date', type: 'timestamp' })
  arrival_date: Date;

  @Column({ name: 'departure_date', type: 'timestamp' })
  departure_date: Date;

  @Column({ name: 'is_hotel_required', default: true })
  is_hotel_required: boolean;

  @Column({ name: 'is_plane_required', default: true })
  is_plane_required: boolean;

  @Column({ name: 'is_last_destination', default: false })
  is_last_destination: boolean;

  @Column({ name: 'details', nullable: true })
  details: string;

  @Column({
    name: 'duffel_offer_request_id',
    type: 'varchar',
    nullable: true,
    default: null,
  })
  duffel_offer_request_id: string | null;

  @Column({
    name: 'duffel_search_params',
    type: 'jsonb',
    nullable: true,
    default: null,
  })
  duffel_search_params: Record<string, unknown> | null;

  // Defines relationships with Request, Destination, and related entities.

  @ManyToOne(() => Request, (request) => request.requests_destinations, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'id_request' })
  request: Request;

  @OneToMany(() => Reservation, (reservation) => reservation.requestDestination)
  reservations: Reservation[];

  @ManyToOne(() => Destination, (dest) => dest.requests_destinations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_destination' })
  destination: Destination;
}



/*
Modification History:

- 2026-02-26 | Diego Vergara | Added entity documentation and standardized relationship comments.
*/