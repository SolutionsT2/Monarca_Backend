/**
 * File: cost-centers.entity.ts
 * Description: TypeORM entity representing a cost center and its related departments.
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Department } from 'src/departments/entity/department.entity';

@Entity({ name: 'cost_centers' })
export class CostCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // One cost center can have many departments
  @OneToMany(() => Department, (department) => department.cost_center)
  departments: Department[];
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */