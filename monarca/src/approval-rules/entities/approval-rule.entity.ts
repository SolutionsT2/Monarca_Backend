/**
 * File: approval-rule.entity.ts
 * Description: Header entity for approval rules, defining the name and status of a rule.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApprovalRuleCondition } from './approval-rule-condition.entity';
import { ApprovalRuleStep } from './approval-rule-step.entity';

@Entity('approval_rules')
export class ApprovalRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'id_company', type: 'uuid', nullable: true })
  idCompany: string | null;

  // Lower value = higher priority = evaluated first in resolveApprovers.
  @Column({ type: 'int', default: 0 })
  priority: number;

  @OneToMany(() => ApprovalRuleCondition, (condition) => condition.rule, {
    cascade: true,
  })
  conditions: ApprovalRuleCondition[];

  @OneToMany(() => ApprovalRuleStep, (step) => step.rule, { cascade: true })
  steps: ApprovalRuleStep[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/*
 * Modification History:
 * - 2026-02-05 | Diego Vergara | Initial file creation.
 * - 2026-05-26 | Juan de Dios Gastélum | Added idCompany column for multi-tenant isolation. Added priority column for rule evaluation order.
 */
