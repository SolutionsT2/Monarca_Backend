/**
 * File: company.entity.ts
 * Description: TypeORM entity representing a client company (Sociedad)
 * from the Ditta Consulting accounting catalog.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { Department } from 'src/departments/entity/department.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';

@Entity({ name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'key', type: 'varchar', length: 10, unique: true })
  key: string;

  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'local_currency', type: 'varchar', length: 3, default: 'MXN' })
  localCurrency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Request, (request) => request.company)
  requests: Request[];

  @OneToMany(() => Department, (department) => department.company)
  departments: Department[];

  @OneToMany(() => CostCenter, (costCenter) => costCenter.company)
  costCenters: CostCenter[];
}

/*
Modification History:
- 2026-04-13 | Diego Vergara | Initial file creation. Entity for Ditta Consulting Sociedades catalog.
*/
