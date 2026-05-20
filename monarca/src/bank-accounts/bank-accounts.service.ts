import { ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BankAccount } from './entity/bank-account.entity';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { Company } from 'src/companies/entity/company.entity';
import { AccountingAccount } from 'src/accounting-accounts/entity/accounting-account.entity';
import {
  BankAccountInputValidationError,
  normalizeBankAccountInput,
} from './bank-account-identifier';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly repo: Repository<BankAccount>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Roles)
    private readonly roleRepo: Repository<Roles>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(AccountingAccount)
    private readonly accountingAccountRepo: Repository<AccountingAccount>,
  ) {}

  async create(
    idRole: string,
    userDepartmentId: string | undefined,
    data: CreateBankAccountDto,
  ): Promise<BankAccount> {
    await this.assertCompanyAdminAccess(idRole, userDepartmentId);

    const normalized = this.normalizeBankAccountInputOrFail(data);

    const entity = this.repo.create({
      name: normalized.name,
      country: normalized.country,
      region: normalized.region,
      iban: normalized.identifierValue,
      identifierType: normalized.identifierType,
      identifierValue: normalized.identifierValue,
    });

    return this.repo.save(entity);
  }

  findAll(): Promise<BankAccount[]> {
    return this.repo.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<BankAccount> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }

    return entity;
  }

  async createForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    data: CreateBankAccountDto,
  ): Promise<BankAccount> {
    await this.assertCompanyAdminAccessForCompany(idRole, idDepartment, idCompany);
    await this.findCompanyOrFail(idCompany);

    const normalized = this.normalizeBankAccountInputOrFail(data);

    const entity = this.repo.create({
      name: normalized.name,
      country: normalized.country,
      region: normalized.region,
      iban: normalized.identifierValue,
      identifierType: normalized.identifierType,
      identifierValue: normalized.identifierValue,
      id_company: idCompany,
    });

    return this.repo.save(entity);
  }

  async findAllForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
  ): Promise<BankAccount[]> {
    await this.assertCompanyAdminAccessForCompany(idRole, idDepartment, idCompany);

    return this.repo.find({ where: { id_company: idCompany }, order: { name: 'ASC' } });
  }

  async updateForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    id: string,
    data: UpdateBankAccountDto,
  ): Promise<BankAccount> {
    await this.assertCompanyAdminAccessForCompany(idRole, idDepartment, idCompany);

    const entity = await this.repo.findOne({ where: { id, id_company: idCompany } });
    if (!entity) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }

    const normalized = this.normalizeBankAccountInputOrFail({
      name: data.name ?? entity.name,
      country: data.country ?? entity.country,
      region: data.region ?? entity.region,
      regionOther: data.regionOther,
      iban: data.iban ?? entity.iban,
    });

    entity.name = normalized.name;
    entity.country = normalized.country;
    entity.region = normalized.region;
    entity.iban = normalized.identifierValue;
    entity.identifierType = normalized.identifierType;
    entity.identifierValue = normalized.identifierValue;

    await this.repo.save(entity);
    return this.findOne(id);
  }

  async deleteForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    id: string,
  ): Promise<{ status: boolean; message: string }> {
    await this.assertCompanyAdminAccessForCompany(idRole, idDepartment, idCompany);
    await this.assertBankAccountIsNotInUse(id, idCompany);

    const result = await this.repo.delete({ id, id_company: idCompany });
    if (!result.affected) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }

    return { status: true, message: `Bank account ${id} removed` };
  }

  async update(
    idRole: string,
    userDepartmentId: string | undefined,
    id: string,
    data: UpdateBankAccountDto,
  ): Promise<BankAccount> {
    await this.assertCompanyAdminAccess(idRole, userDepartmentId);

    const entity = await this.findOne(id);

    const normalized = this.normalizeBankAccountInputOrFail({
      name: data.name ?? entity.name,
      country: data.country ?? entity.country,
      region: data.region ?? entity.region,
      regionOther: data.regionOther,
      iban: data.iban ?? entity.iban,
    });

    entity.name = normalized.name;
    entity.country = normalized.country;
    entity.region = normalized.region;
    entity.iban = normalized.identifierValue;
    entity.identifierType = normalized.identifierType;
    entity.identifierValue = normalized.identifierValue;

    await this.repo.save(entity);
    return this.findOne(id);
  }

  async remove(
    idRole: string,
    userDepartmentId: string | undefined,
    id: string,
  ): Promise<{ status: boolean; message: string }> {
    await this.assertCompanyAdminAccess(idRole, userDepartmentId);
    await this.assertBankAccountIsNotInUse(id);

    const result = await this.repo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }

    return { status: true, message: `Bank account ${id} removed` };
  }

  private async assertCompanyAdminAccess(
    idRole: string,
    userDepartmentId: string | undefined,
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
      throw new ForbiddenException('Only CompanyAdmin can manage bank accounts.');
    }

    if (!userDepartmentId) {
      throw new ForbiddenException('CompanyAdmin must belong to a department associated with a company.');
    }

    const department = await this.departmentRepo.findOne({
      where: { id: userDepartmentId },
    });

    if (!department?.id_company) {
      throw new ForbiddenException('CompanyAdmin must belong to a department associated with a company.');
    }
  }

  private async assertCompanyAdminAccessForCompany(
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
      throw new ForbiddenException('Only CompanyAdmin can manage bank accounts.');
    }

    if (!userDepartmentId) {
      throw new ForbiddenException('CompanyAdmin must belong to a department associated with a company.');
    }

    const department = await this.departmentRepo.findOne({
      where: { id: userDepartmentId },
    });

    const departmentCompanyId = department?.id_company;
    if (!departmentCompanyId || departmentCompanyId !== targetCompanyId) {
      throw new ForbiddenException('CompanyAdmin can only manage bank accounts for their own company.');
    }
  }

  private async findCompanyOrFail(idCompany: string) {
    const company = await this.companyRepo.findOne({ where: { id: idCompany } });
    if (!company) {
      throw new NotFoundException(`Company ${idCompany} not found`);
    }

    return company;
  }

  private async assertBankAccountIsNotInUse(idBankAccount: string, idCompany?: string): Promise<void> {
    const where = idCompany
      ? { id_bank_account: idBankAccount, id_company: idCompany, deletedAt: IsNull() }
      : { id_bank_account: idBankAccount, deletedAt: IsNull() };

    const inUseCount = await this.accountingAccountRepo.count({ where });
    if (inUseCount > 0) {
      throw new ConflictException('No se puede eliminar la cuenta bancaria porque está siendo utilizada por una cuenta contable.');
    }
  }

  private normalizeBankAccountInputOrFail(data: {
    name?: string | null;
    country?: string | null;
    region?: string | null;
    regionOther?: string | null;
    iban?: string | null;
  }) {
    try {
      return normalizeBankAccountInput({
        name: data.name,
        country: data.country,
        region: data.region,
        regionOther: data.regionOther,
        identifier: data.iban,
      });
    } catch (error) {
      if (error instanceof BankAccountInputValidationError) {
        throw new HttpException({ errors: error.errors }, HttpStatus.BAD_REQUEST);
      }

      throw error;
    }
  }
}
