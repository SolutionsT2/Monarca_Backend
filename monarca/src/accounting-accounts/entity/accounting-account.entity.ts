/**
 * File: accounting-account.entity.ts
 * Description: TypeORM entity representing an accounting account entry
 * (Catalogo Contable) from Ditta Consulting.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';

@Entity({ name: 'accounting_accounts' })
export class AccountingAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'key', type: 'varchar', length: 10, unique: true })
  key: string;

  @Column({ name: 'description', type: 'varchar' })
  description: string;

  @Column({ name: 'requires_cost_center', type: 'boolean', default: false })
  requiresCostCenter: boolean;

  @Column({ name: 'id_cost_center', type: 'uuid' })
  id_cost_center: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Voucher, (voucher) => voucher.accounting_account)
  vouchers: Voucher[];

  @ManyToOne(() => CostCenter, (costCenter) => costCenter.accountingAccounts)
  @JoinColumn({ name: 'id_cost_center' })
  costCenter: CostCenter;
}

/*
Modification History:
- 2026-04-13 | Diego Vergara | Initial file creation. Entity for Ditta Consulting Catalogo Contable.
*/
