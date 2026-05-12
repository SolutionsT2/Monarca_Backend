/**
 * File: bank-accounts.module.ts
 * Description: Nest module exposing bank account CRUD functionality.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from './entity/bank-account.entity';
import { CompaniesBankAccountsController } from './companies-bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';
import { AccountingAccount } from 'src/accounting-accounts/entity/accounting-account.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { Company } from 'src/companies/entity/company.entity';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [GuardsModule, TypeOrmModule.forFeature([BankAccount, Department, Roles, Company, AccountingAccount])],
  controllers: [CompaniesBankAccountsController],
  providers: [BankAccountsService],
  exports: [TypeOrmModule, BankAccountsService],
})
export class BankAccountsModule {}
