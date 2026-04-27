import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingAccountsController } from './accounting-accounts.controller';
import { AccountingAccountsService } from './accounting-accounts.service';
import { AccountingAccount } from './entity/accounting-account.entity';
import { Company } from 'src/companies/entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [
    GuardsModule,
    TypeOrmModule.forFeature([AccountingAccount, Company, Department, Roles]),
  ],
  controllers: [AccountingAccountsController],
  providers: [AccountingAccountsService],
})
export class AccountingAccountsModule {}