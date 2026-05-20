/**
 * File: bank-account.entity.ts
 * Description: TypeORM entity representing a bank account.
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Company } from 'src/companies/entity/company.entity';
import { AccountingAccount } from 'src/accounting-accounts/entity/accounting-account.entity';

@Entity({ name: 'bank_accounts' })
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'country', type: 'varchar', length: 100 })
  country!: string;

  @Column({ name: 'region', type: 'varchar', length: 100 })
  region!: string;

  @Column({ name: 'iban', type: 'varchar', length: 34 })
  iban!: string;

  @Column({ name: 'identifier_type', type: 'varchar', length: 20, nullable: true })
  identifierType!: string | null;

  @Column({ name: 'identifier_value', type: 'varchar', length: 100, nullable: true })
  identifierValue!: string | null;

  @Column({ name: 'id_company', type: 'uuid' })
  id_company!: string;

  @ManyToOne(() => Company, (company) => company.bankAccounts)
  @JoinColumn({ name: 'id_company' })
  company!: Company;

  @OneToMany(() => AccountingAccount, (accountingAccount) => accountingAccount.bankAccount)
  accountingAccounts!: AccountingAccount[];
}
