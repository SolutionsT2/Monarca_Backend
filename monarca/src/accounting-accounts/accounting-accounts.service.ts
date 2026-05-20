import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AccountingAccount } from './entity/accounting-account.entity';
import { BankAccount } from 'src/bank-accounts/entity/bank-account.entity';
import { Company } from 'src/companies/entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { CreateAccountingAccountDto, UpdateAccountingAccountDto } from './dto/accounting-account.dto';

@Injectable()
export class AccountingAccountsService {
  constructor(
    @InjectRepository(AccountingAccount)
    private readonly accountingAccountRepo: Repository<AccountingAccount>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Roles)
    private readonly roleRepo: Repository<Roles>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepo: Repository<BankAccount>,
  ) {}

  async createForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    data: CreateAccountingAccountDto,
  ): Promise<AccountingAccount> {
    await this.assertCompanyAdminAccess(idRole, idDepartment, idCompany);
    await this.findCompanyOrFail(idCompany);

    const key = data.key.trim();

    const accountingAccount = this.accountingAccountRepo.create({
      key,
      description: data.description.trim(),
      requiresCostCenter: data.requiresCostCenter ?? false,
      id_company: idCompany,
      id_bank_account: data.idBankAccount
        ? await this.findBankAccountIdForCompanyOrFail(idCompany, data.idBankAccount)
        : null,
    });

    return this.accountingAccountRepo.save(accountingAccount);
  }

  async findAllForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
  ): Promise<AccountingAccount[]> {
    await this.assertCompanyAdminAccess(idRole, idDepartment, idCompany);

    return this.accountingAccountRepo.find({
      where: { id_company: idCompany, deletedAt: IsNull() },
      relations: { bankAccount: true },
      order: { key: 'ASC' },
    });
  }

  async findOneForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    idAccountingAccount: string,
  ): Promise<AccountingAccount> {
    await this.assertCompanyAdminAccess(idRole, idDepartment, idCompany);

    const accountingAccount = await this.accountingAccountRepo.findOne({
      where: { id: idAccountingAccount, id_company: idCompany, deletedAt: IsNull() },
      relations: { bankAccount: true },
    });

    if (!accountingAccount) {
      throw new NotFoundException(`Accounting account ${idAccountingAccount} not found`);
    }

    return accountingAccount;
  }

  async updateForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    idAccountingAccount: string,
    data: UpdateAccountingAccountDto,
  ): Promise<AccountingAccount> {
    await this.assertCompanyAdminAccess(idRole, idDepartment, idCompany);

    const accountingAccount = await this.accountingAccountRepo.findOne({
      where: { id: idAccountingAccount, id_company: idCompany, deletedAt: IsNull() },
    });

    if (!accountingAccount) {
      throw new NotFoundException(`Accounting account ${idAccountingAccount} not found`);
    }

    if (data.key !== undefined) {
      accountingAccount.key = data.key.trim();
    }

    if (data.description !== undefined) {
      accountingAccount.description = data.description.trim();
    }

    if (data.requiresCostCenter !== undefined) {
      accountingAccount.requiresCostCenter = data.requiresCostCenter;
    }

    if (data.idBankAccount !== undefined) {
      if (data.idBankAccount === null) {
        accountingAccount.id_bank_account = null;
      } else {
        accountingAccount.id_bank_account = await this.findBankAccountIdForCompanyOrFail(
          idCompany,
          data.idBankAccount,
        );
      }
    }

    await this.accountingAccountRepo.save(accountingAccount);

    return (await this.accountingAccountRepo.findOne({
      where: { id: idAccountingAccount, id_company: idCompany, deletedAt: IsNull() },
      relations: { bankAccount: true },
    })) as AccountingAccount;
  }

  async deleteForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    idAccountingAccount: string,
  ): Promise<void> {
    await this.assertCompanyAdminAccess(idRole, idDepartment, idCompany);

    const accountingAccount = await this.accountingAccountRepo.findOne({
      where: {
        id: idAccountingAccount,
        id_company: idCompany,
        deletedAt: IsNull(),
      },
    });

    if (!accountingAccount) {
      throw new NotFoundException(`Accounting account ${idAccountingAccount} not found`);
    }

    await this.accountingAccountRepo.update(
      { id: idAccountingAccount },
      { deletedAt: new Date() },
    );
  }

  private async assertCompanyAdminAccess(
    idRole: string,
    userDepartmentId: string | undefined,
    targetCompanyId: string,
  ): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id: idRole } });
    if (!role) {
      throw new ForbiddenException('Role not found');
    }

    const normalizedRole = role.name.trim().toLowerCase();
    const isCompanyAdmin = [
      'companyadmin',
      'company admin',
      'administrador de empresa',
      'admin empresa',
    ].includes(normalizedRole);

    if (!isCompanyAdmin) {
      throw new ForbiddenException('Only CompanyAdmin can access accounting accounts endpoints.');
    }

    if (!userDepartmentId) {
      throw new ForbiddenException('CompanyAdmin must belong to a department associated with a company.');
    }

    const department = await this.departmentRepo.findOne({
      where: { id: userDepartmentId },
    });

    const departmentCompanyId = department?.id_company;
    if (!departmentCompanyId || departmentCompanyId !== targetCompanyId) {
      throw new ForbiddenException('CompanyAdmin can only access accounting accounts for their own company.');
    }
  }

  private async findCompanyOrFail(idCompany: string): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id: idCompany } });
    if (!company) {
      throw new NotFoundException(`Company ${idCompany} not found`);
    }

    return company;
  }

  private async findBankAccountIdForCompanyOrFail(
    idCompany: string,
    idBankAccount: string,
  ): Promise<string> {
    const bankAccount = await this.bankAccountRepo.findOne({
      where: { id: idBankAccount, id_company: idCompany },
    });

    if (!bankAccount) {
      throw new NotFoundException(`Bank account ${idBankAccount} not found for company ${idCompany}`);
    }

    return bankAccount.id;
  }
}