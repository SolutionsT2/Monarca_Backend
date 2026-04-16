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

  @Column({ type: 'varchar', nullable: false })
  link: string;

  @Column({ type: 'float', nullable: false })
  price: number;

  @Column({ name: 'id_request_destination', type: 'uuid' })
  id_request_destination: string;

  @ManyToOne(
    () => RequestsDestination,
    (requestDestination) => requestDestination.reservations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'id_request_destination' })
  requestDestination: RequestDestination;
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history; fixed requestDestination type to RequestsDestination.
 */
