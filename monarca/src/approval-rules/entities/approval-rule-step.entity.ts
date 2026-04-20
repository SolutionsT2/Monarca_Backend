/**
 * File: approval-rule-step.entity.ts
 * Description: Entity defining a level in the approval chain (e.g., Level 1 requires 2 Manager approvals).
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApprovalRule } from './approval-rule.entity';
import { Roles } from 'src/roles/entity/roles.entity';

@Entity('approval_rule_steps')
export class ApprovalRuleStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_rule' })
  idRule: string;

  @Column({ type: 'int' })
  order: number; // Sequence level (1, 2, 3...)

  @Column({ name: 'id_role' })
  idRole: string;

  @Column({ name: 'min_approvals', type: 'int', default: 1 })
  minApprovals: number;

  @ManyToOne(() => ApprovalRule, (rule) => rule.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_rule' })
  rule: ApprovalRule;

  @ManyToOne(() => Roles)
  @JoinColumn({ name: 'id_role' })
  role: Roles;
}
