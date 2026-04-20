/**
 * File: destination.entity.ts
 * Description: TypeORM entity representing a travel destination and its relationships.
 */

import { Request } from 'src/requests/entities/request.entity';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Airport } from './airport.entity';

@Entity({ name: 'destinations' })
export class Destination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  country: string;

  @Column()
  city: string;

  // RELATIONSHIPS

  @OneToMany(() => Request, (req) => req.destination, {
    cascade: true,
  })
  requests: Request[];

  @OneToMany(() => RequestsDestination, (reqdest) => reqdest.destination, {
    cascade: true,
  })
  requests_destinations: RequestsDestination[];

  @OneToMany(() => Airport, (airport) => airport.destination)
  airports: Airport[];
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer; normalized comments to English.
 */
