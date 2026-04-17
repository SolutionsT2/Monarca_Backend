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
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { Company } from 'src/companies/entity/company.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
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
  @Column({ name: 'availability_status', type: 'varchar', length: 30, default: 'active' })
  availabilityStatus: string;

  @ApiProperty({ example: 'active' })
  @Column({ name: 'employee_status', type: 'varchar', length: 20, default: 'active' })
  employeeStatus: string;

  @ApiProperty({ example: 'mperez' })
  @Column({ unique: true, nullable: true })
  username: string;

  @ApiProperty({ example: '883d9e05-612c-4d08-9efb-5099952fc850' })
  @Column({ name: 'id_manager', type: 'uuid', nullable: true })
  idManager?: string;

  @ApiProperty({ example: '12345678' })
  @Column({ name: 'supplier_number', type: 'varchar', length: 8, nullable: true })
  supplierNumber?: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'signup_date' })
  signupDate: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'lastchange_date' })
  lastchangeDate: Date;

  @ApiProperty({ example: 1 })
  @Column({ name: 'id_department', type: 'uuid', nullable: true })
  idDepartment?: string;

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

  // ---- Ditta Consulting integration fields ----

  @ApiProperty({ example: 'Emp001' })
  @Column({ name: 'employee_number', type: 'varchar', length: 20, nullable: true, unique: true })
  employeeNumber?: string;

  @ApiProperty()
  @Column({ name: 'id_cost_center', type: 'uuid', nullable: true })
  idCostCenter?: string;

  // ---- Relationships ----

  @ManyToOne(() => Department, (department) => department.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_department' })
  department?: Department;

  @ManyToOne(() => Roles)
  @JoinColumn({ name: 'id_role' })
  role: Roles;

  @ManyToOne(() => TravelAgency, (travelAgency) => travelAgency.users)
  @JoinColumn({ name: 'id_travel_agency' })
  travelAgency?: TravelAgency;

  @ManyToOne(() => User, (user) => user.managedUsers)
  @JoinColumn({ name: 'id_manager' })
  manager?: User;

  @OneToMany(() => User, (user) => user.manager)
  managedUsers: User[];

  @ManyToOne(() => CostCenter, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_cost_center' })
  costCenter?: CostCenter;

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
- 2026-03-24 | Definition of rules for status.
- 2026-04-10 | Added employeeStatus, username, manager_id, supplier_number, signupDate, and lastchangeDate.
- 2026-04-13 | Diego Vergara | Added Ditta Consulting fields: employeeNumber, idCostCenter, idCompany. Added relationships to CostCenter and Company. Reused existing idManager and supplierNumber as semantic mapping for "Jefe Inmediato" and "Proveedor" from Ditta catalog.
*/
