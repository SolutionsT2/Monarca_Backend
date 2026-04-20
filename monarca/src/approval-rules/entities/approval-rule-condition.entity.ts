/**
 * File: approval-rule-condition.entity.ts
 * Description: Entity defining a condition for an approval rule (e.g., flight cost > 5000).
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApprovalRule } from './approval-rule.entity';

@Entity('approval_rule_conditions')
export class ApprovalRuleCondition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_rule' })
  idRule: string;

  @Column()
  field: string; // e.g., 'trip_type', 'cost', 'priority'

  @Column({ nullable: true })
  operator: string; // e.g., 'gt', 'lt', 'eq', 'lte', 'gte'

  @Column()
  value: string; // Serialized value (e.g., '10000', 'internacional')

  @ManyToOne(() => ApprovalRule, (rule) => rule.conditions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_rule' })
  rule: ApprovalRule;
}
