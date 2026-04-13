/**
 * File: user.entity.ts
 * Description: Entity representing the users table in the database, including relations to departments, roles, and travel agencies.
 */
import { ApiProperty } from '@nestjs/swagger';
import { Department } from 'src/departments/entity/department.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Revision } from 'src/revisions/entities/revision.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { TravelAgency } from 'src/travel-agencies/entities/travel-agency.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

/**
 * User entity mapping to the "users" table.
 */
@Entity({ name: 'users' })
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'juan@gmail.com' })
  @Column()
  email: string;

  @ApiProperty({ example: 'Juan' })
  @Column()
  name: string;

  @ApiProperty({ example: 'López' })
  @Column({ name: 'last_name' })
  lastName: string;

  @ApiProperty({ example: '123456' })
  @Column()
  password: string;

  @ApiProperty({ example: 'active' })
  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'id_department' })
  idDepartment: string;

  @ApiProperty({ example: 2 })
  @Column({ name: 'id_role' })
  idRole: string;

  @ApiProperty()
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'id_travel_agency',
  })
  idTravelAgency?: string;

  @ManyToOne(() => Department, (department) => department.users)
  @JoinColumn({ name: 'id_department' })
  department: Department;

  @ManyToOne(() => Roles)
  @JoinColumn({ name: 'id_role' })
  role: Roles;

  @ManyToOne(() => TravelAgency, (travelAgency) => travelAgency.users)
  @JoinColumn({ name: 'id_travel_agency' })
  travelAgency?: TravelAgency;

  // Hacer conexion despues
  @OneToMany(() => Revision, (log) => log.request, {})
  revisions: Revision[];

  @OneToMany(() => Request, (req) => req.user, {})
  requests: Request[];

  @OneToMany(() => Request, (req) => req.admin, {})
  assignedRequests: Request[];

  @OneToMany(() => Request, (req) => req.admin, {})
  soiAssignedRequests: Request[];
}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
- 2026-03-24:
 *   - Definition of rules for status
*/
