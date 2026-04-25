import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Destination } from './destination.entity';
import { Request } from 'src/requests/entities/request.entity';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';

@Entity({ name: 'airports' })
@Index('IDX_AIRPORTS_IATA_UNIQUE', ['iata_code'], { unique: true })
export class Airport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_destination', type: 'uuid' })
  id_destination: string;

  @Column({ name: 'iata_code', type: 'varchar', length: 3 })
  iata_code: string;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Destination, (destination) => destination.airports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_destination' })
  destination: Destination;

  @OneToMany(() => Request, (request) => request.origin_airport)
  requests_as_origin: Request[];

  @OneToMany(() => RequestsDestination, (requestDestination) => requestDestination.airport)
  requests_destinations: RequestsDestination[];
}
