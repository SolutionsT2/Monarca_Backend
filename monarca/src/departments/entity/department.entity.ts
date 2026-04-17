/**
 * File: department.entity.ts
 * Description: TypeORM entity representing a department, its users and related cost center.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { Company } from 'src/companies/entity/company.entity';
@Entity({ name: 'departments' })
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // One department can have many users.
  @OneToMany(() => User, (user) => user.department)
  users: User[];

  @ManyToOne(() => CostCenter, (costCenter) => costCenter.departments)
  @JoinColumn({ name: 'cost_center_id' })
  cost_center: CostCenter;

  @Column({ name: 'id_company', type: 'uuid', nullable: true })
  id_company?: string;

  @ManyToOne(() => Company, (company) => company.departments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_company' })
  company?: Company;
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
