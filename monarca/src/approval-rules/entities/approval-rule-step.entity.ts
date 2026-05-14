/**
 * File: approval-rule-step.entity.ts
 * Description: Entity defining one level in the approval chain. A step can be
 * role-based (a specific role must approve) or hierarchy-based (the manager
 * N levels above the requester must approve).
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApprovalRule } from './approval-rule.entity';
import { Roles } from 'src/roles/entity/roles.entity';

export type StepType = 'role' | 'hierarchy';

@Entity('approval_rule_steps')
export class ApprovalRuleStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_rule' })
  idRule: string;

  @Column({ type: 'int' })
  order: number; // Sequence level (1, 2, 3...)

  @Column({ name: 'step_type', type: 'varchar', length: 20, default: 'role' })
  stepType: StepType;

  @Column({ name: 'id_role', nullable: true })
  idRole: string | null;

  // Number of levels to climb in the manager chain (only for stepType === 'hierarchy')
  @Column({ name: 'hierarchy_level', type: 'int', nullable: true })
  hierarchyLevel: number | null;

  @Column({ name: 'min_approvals', type: 'int', default: 1 })
  minApprovals: number;

  @ManyToOne(() => ApprovalRule, (rule) => rule.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_rule' })
  rule: ApprovalRule;

  @ManyToOne(() => Roles, { nullable: true })
  @JoinColumn({ name: 'id_role' })
  role: Roles | null;
}

/*
 * Modification History:
 * - 2026-02-05 | Diego Vergara | Initial file creation.
 * - 2026-05-12 | Juan de Dios Gastélum | Added stepType and hierarchyLevel columns.
 */
