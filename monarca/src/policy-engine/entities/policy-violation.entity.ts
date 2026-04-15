// This file defines the PolicyViolation entity, which represents instances where a voucher has violated a specific policy rule. Each violation record includes references to the associated voucher and policy rule, as well as details about the violation and a timestamp of when it occurred.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { PolicyRule } from './policy-rule.entity';

@Entity({ name: 'policy_violations' })
export class PolicyViolation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_voucher', type: 'uuid' })
  id_voucher: string;

  @Column({ name: 'id_policy_rule', type: 'uuid' })
  id_policy_rule: string;

  @Column({ name: 'detail', type: 'varchar' })
  detail: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Voucher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_voucher' })
  voucher: Voucher;

  @ManyToOne(() => PolicyRule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_policy_rule' })
  policy_rule: PolicyRule;
}
