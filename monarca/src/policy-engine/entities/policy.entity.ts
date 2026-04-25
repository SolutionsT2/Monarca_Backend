import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from 'src/companies/entity/company.entity';
import { PolicyRule } from './policy-rule.entity';

@Entity({ name: 'policies' })
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_company', type: 'uuid' })
  id_company!: string;

  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'description', type: 'varchar', nullable: true })
  description!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_company' })
  company!: Company;

  @OneToMany(() => PolicyRule, (policyRule) => policyRule.policy)
  rules!: PolicyRule[];
}