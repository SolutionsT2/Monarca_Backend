/**
 * File: approval-rule.entity.ts
 * Description: Header entity for approval rules, defining the name and status of a rule.
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

  @OneToMany(() => ApprovalRuleCondition, (condition) => condition.rule, { cascade: true })
  conditions: ApprovalRuleCondition[];

  @OneToMany(() => ApprovalRuleStep, (step) => step.rule, { cascade: true })
  steps: ApprovalRuleStep[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
