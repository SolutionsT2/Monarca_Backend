/*
 * request.entity.ts
 *
 * TypeORM entity representing the requests table.
 * Defines core request data and relationships with
 * users, destinations, logs, revisions, and vouchers.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';
import { Revision } from 'src/revisions/entities/revision.entity';
import { Destination } from 'src/destinations/entities/destination.entity';
import { User } from 'src/users/entities/user.entity';
import { TravelAgency } from 'src/travel-agencies/entities/travel-agency.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { Company } from 'src/companies/entity/company.entity';
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';
import { Airport } from 'src/destinations/entities/airport.entity';

/**
 * Entity representing a travel request.
 * Contains request metadata, financial data,
 * status tracking, and relational mappings.
 */
@Entity({ name: 'requests' })
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_user', type: 'uuid' })
  id_user: string;

  @Column()
  id_origin_city: string;

  @Column({ name: 'id_origin_airport', type: 'uuid', nullable: true })
  id_origin_airport?: string;

  @Column()
  id_admin: string;

  @Column()
  id_SOI: string;

  @Column({ nullable: true, default: null })
  id_travel_agency: string;

  @Column()
  title: string;

  @Column()
  motive: string;

  @Column()
  advance_money: number;

  @Column({ default: 'Pending Review' })
  status: string;

  @Column({ nullable: true })
  requirements?: string;

  @Column()
  priority: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ---- Ditta Consulting integration fields ----

  @Column({ name: 'id_company', type: 'uuid', nullable: true })
  id_company?: string;

  @Column({ name: 'id_document_class', type: 'uuid', nullable: true })
  id_document_class?: string;

  // Defines entity relationships and database associations.

  @OneToMany(() => RequestsDestination, (dest) => dest.request, {
    cascade: true,
  })
  requests_destinations: RequestsDestination[];

  @OneToMany(() => RequestLog, (log) => log.request, {})
  requestLogs: RequestLog[];

  @OneToMany(() => Revision, (rev) => rev.request, {})
  revisions: Revision[];

  @ManyToOne(() => Destination, (dest) => dest.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_origin_city' })
  destination: Destination;

  @ManyToOne(() => Airport, (airport) => airport.requests_as_origin, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_origin_airport' })
  origin_airport?: Airport;

  @ManyToOne(() => User, (usr) => usr.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_user' })
  user: User;

  @ManyToOne(() => User, (usr) => usr.assignedRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_admin' })
  admin: User;

  @ManyToOne(() => User, (usr) => usr.soiAssignedRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_SOI' })
  SOI: User;

  @ManyToOne(() => TravelAgency, (trva) => trva.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_travel_agency' })
  travelAgency: TravelAgency;

  @OneToMany(() => Voucher, (v) => v.requests, {})
  @JoinColumn({ name: 'id_request' })
  vouchers: Voucher[];

  @ManyToOne(() => Company, (company) => company.requests, { nullable: true })
  @JoinColumn({ name: 'id_company' })
  company?: Company;

  @ManyToOne(() => DocumentClass, (dc) => dc.requests, { nullable: true })
  @JoinColumn({ name: 'id_document_class' })
  document_class?: DocumentClass;
}

/*
Modification History:
- 2026-02-26 | Diego Vergara | Added entity documentation and improved relationship comments.
- 2026-04-13 | Diego Vergara | Added Ditta Consulting fields: id_company and id_document_class with relationships to Company and DocumentClass.
*/
