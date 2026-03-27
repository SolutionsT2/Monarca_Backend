// This file defines the PolicyRule entity, which represents individual rules within a policy. Each rule specifies an expense class, an operator (e.g., LT, MISSING_XML), a threshold value and unit (if applicable), and a consequence for violations. The entity is linked to the Policy entity via a foreign key relationship.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Policy } from './policy.entity';

@Entity({ name: 'policy_rules' })
export class PolicyRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_policy', type: 'uuid' })
  id_policy: string;

  @Column({ name: 'expense_class', type: 'varchar' })
  expense_class: string;

  @Column({ name: 'operator', type: 'varchar' })
  operator: string;

  @Column({ name: 'threshold_value', type: 'float', nullable: true })
  threshold_value: number | null;

  @Column({ name: 'threshold_unit', type: 'varchar', nullable: true })
  threshold_unit: string | null;

  @Column({ name: 'consequence', type: 'varchar', default: 'POLICY_VIOLATION' })
  consequence: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Policy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_policy' })
  policy: Policy;
}
