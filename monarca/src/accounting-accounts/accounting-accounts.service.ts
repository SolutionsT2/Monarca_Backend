import { ForbiddenException, Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AccountingAccount } from './entity/accounting-account.entity';
import { BankAccount } from 'src/bank-accounts/entity/bank-account.entity';
import { Company } from 'src/companies/entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { CreateAccountingAccountDto, UpdateAccountingAccountDto } from './dto/accounting-account.dto';
import {
  ConfirmAccountingAccountsDto,
  PreviewAccountingAccountsResponseDto,
  PreviewAccountingAccountRowDto,
} from './dto/import-accounting-accounts.dto';
import { ImportResultDto } from 'src/utils/import-result.dto';
import { getRowValue, normalizeCellValue, parseExcelRows } from 'src/utils/excel-import.utils';

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

  async previewExcelForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    buffer: Buffer,
  ): Promise<PreviewAccountingAccountsResponseDto> {
    await this.assertCompanyAdminAccess(idRole, idDepartment, idCompany);
    await this.findCompanyOrFail(idCompany);

    const rows = parseExcelRows(buffer);
    if (!rows.length) {
      throw new HttpException({ errors: { file: ['El archivo Excel no contiene filas'] } }, HttpStatus.BAD_REQUEST);
    }

    const bankAccounts = await this.bankAccountRepo.find({
      where: { id_company: idCompany },
    });

    const existingAccounts = await this.accountingAccountRepo.find({
      where: { id_company: idCompany, deletedAt: IsNull() },
    });

    const existingKeys = new Set(existingAccounts.map((acc) => acc.key.trim()));

    const accounts = rows.map((row, index) => {
      const rowNumber = index + 2;
      const key = normalizeCellValue(getRowValue(row, 'clave', 'key'));
      const description = normalizeCellValue(getRowValue(row, 'descripcion', 'descripción', 'description'));
      const requiresCostCenterRaw = getRowValue(row, 'requiere centro de costos', 'requirescostcenter', 'requires cost center', 'requiere_centro_de_costos');
      const bankAccountRaw = normalizeCellValue(getRowValue(row, 'cuenta bancaria', 'bankaccount', 'bank account', 'cuenta_bancaria'));

      const validationErrors: string[] = [];

      if (!key) {
        validationErrors.push('La clave es obligatoria');
      } else if (key.length > 10) {
        validationErrors.push('La clave no puede tener más de 10 caracteres');
      }

      if (!description) {
        validationErrors.push('La descripción es obligatoria');
      }

      let requiresCostCenter = false;
      if (requiresCostCenterRaw !== undefined && requiresCostCenterRaw !== null) {
        const str = String(requiresCostCenterRaw).trim().toLowerCase();
        requiresCostCenter = ['sí', 'si', 'true', '1', 'yes'].includes(str);
      }

      let idBankAccount: string | null = null;
      let bankAccountName: string | null = null;

      if (bankAccountRaw) {
        const matchStr = bankAccountRaw.trim().toLowerCase();
        const matchedAccount = bankAccounts.find((ba) => {
          const nameMatch = ba.name?.trim().toLowerCase() === matchStr;
          const ibanMatch = ba.iban?.trim().toLowerCase() === matchStr;
          const identifierMatch = ba.iban?.trim().toLowerCase() === matchStr;
          return nameMatch || ibanMatch || identifierMatch;
        });

        if (matchedAccount) {
          idBankAccount = matchedAccount.id;
          bankAccountName = matchedAccount.name;
        } else {
          validationErrors.push(`No se encontró la cuenta bancaria: ${bankAccountRaw}`);
        }
      }

      const isUpdate = key ? existingKeys.has(key.trim()) : false;

      return {
        row: rowNumber,
        key,
        description,
        requiresCostCenter,
        idBankAccount,
        bankAccountName: bankAccountName || bankAccountRaw || null,
        isUpdate,
        validationErrors,
      };
    });

    const errorRows = accounts.filter((row) => row.validationErrors.length > 0).length;

    return {
      accounts,
      totalRows: accounts.length,
      validRows: accounts.length - errorRows,
      errorRows,
    };
  }

  async confirmImportForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    data: ConfirmAccountingAccountsDto,
  ): Promise<ImportResultDto> {
    await this.assertCompanyAdminAccess(idRole, idDepartment, idCompany);
    await this.findCompanyOrFail(idCompany);

    if (!data.accounts?.length) {
      throw new HttpException(
        { errors: { accounts: ['No se proporcionaron cuentas contables para importar'] } },
        HttpStatus.BAD_REQUEST,
      );
    }

    const result: ImportResultDto = { created: 0, updated: 0, errors: [] };

    for (const [index, account] of data.accounts.entries()) {
      try {
        const key = account.key?.trim();
        const description = account.description?.trim();

        if (!key) {
          throw new HttpException({ errors: { key: ['La clave es obligatoria'] } }, HttpStatus.BAD_REQUEST);
        }

        if (!description) {
          throw new HttpException({ errors: { description: ['La descripción es obligatoria'] } }, HttpStatus.BAD_REQUEST);
        }

        const existing = await this.accountingAccountRepo.findOne({
          where: { id_company: idCompany, key, deletedAt: IsNull() },
        });

        if (existing) {
          existing.description = description;
          existing.requiresCostCenter = account.requiresCostCenter ?? false;
          existing.id_bank_account = account.idBankAccount ?? null;
          await this.accountingAccountRepo.save(existing);
          result.updated += 1;
        } else {
          const newAccount = this.accountingAccountRepo.create({
            key,
            description,
            requiresCostCenter: account.requiresCostCenter ?? false,
            id_company: idCompany,
            id_bank_account: account.idBankAccount ?? null,
          });
          await this.accountingAccountRepo.save(newAccount);
          result.created += 1;
        }
      } catch (error) {
        result.errors.push({
          row: `row-${account.row ?? index + 2}`,
          message: this.formatImportErrorMessage(error, 'Error inesperado al importar la cuenta contable'),
        });
      }
    }

    return result;
  }

  private formatImportErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }

      if (response && typeof response === 'object') {
        return JSON.stringify(response);
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
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