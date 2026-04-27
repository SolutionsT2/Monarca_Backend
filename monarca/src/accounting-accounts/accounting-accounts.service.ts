import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingAccount } from './entity/accounting-account.entity';
import { Company } from 'src/companies/entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { CreateAccountingAccountDto } from './dto/accounting-account.dto';

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
      where: { id_company: idCompany },
      order: { key: 'ASC' },
    });
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
      },
    });

    if (!accountingAccount) {
      throw new NotFoundException(`Accounting account ${idAccountingAccount} not found`);
    }

    await this.accountingAccountRepo.remove(accountingAccount);
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
}