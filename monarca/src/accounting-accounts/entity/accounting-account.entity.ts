/**
 * File: accounting-account.entity.ts
 * Description: TypeORM entity representing an accounting account entry
 * (Catalogo Contable) from Ditta Consulting.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from 'src/companies/entity/company.entity';
import { BankAccount } from 'src/bank-accounts/entity/bank-account.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';

@Entity({ name: 'accounting_accounts' })
export class AccountingAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'key', type: 'varchar', length: 10 })
  key: string;

  @Column({ name: 'description', type: 'varchar' })
  description: string;

  @Column({ name: 'requires_cost_center', type: 'boolean', default: false })
  requiresCostCenter: boolean;

  @Column({ name: 'id_company', type: 'uuid' })
  id_company: string;

  @Column({ name: 'id_bank_account', type: 'uuid', nullable: true })
  id_bank_account?: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Voucher, (voucher) => voucher.accounting_account)
  vouchers: Voucher[];

  @ManyToOne(() => Company, (company) => company.accountingAccounts)
  @JoinColumn({ name: 'id_company' })
  company: Company;

  @ManyToOne(() => BankAccount, (bankAccount) => bankAccount.accountingAccounts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_bank_account' })
  bankAccount?: BankAccount;
}

/*
Modification History:
- 2026-04-13 | Diego Vergara | Initial file creation. Entity for Ditta Consulting Catalogo Contable.
*/
