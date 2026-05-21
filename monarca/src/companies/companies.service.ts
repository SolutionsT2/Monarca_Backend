import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNull } from 'typeorm';
import {
  CompanyDto,
  CompanyDepartmentDto,
  CreateCompanyDepartmentDto,
  CreateCompanyDto,
  UpdateCompanyDepartmentCostCenterDto,
  UpdateCompanyDto,
} from './dto/company.dtos';
import { Company } from './entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { User } from 'src/users/entities/user.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ConfirmDepartmentsDto,
  PreviewDepartmentsResponseDto,
  PreviewDepartmentRowDto,
} from './dto/import-departments.dto';
import { ImportResultDto } from 'src/utils/import-result.dto';
import {
  getRowValue,
  normalizeCellValue,
  normalizeNumberValue,
  parseExcelRows,
} from 'src/utils/excel-import.utils';

const ADMIN_DEPARTMENT_NAME = 'Admin Department';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(CostCenter)
    private readonly costCenterRepo: Repository<CostCenter>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Roles)
    private readonly roleRepo: Repository<Roles>,
  ) {}

  async create(data: CreateCompanyDto): Promise<CompanyDto> {
    const companyAdminRole = await this.findCompanyAdminRole();

    const adminEmail = data.admin.email.trim().toLowerCase();
    const existingAdmin = await this.userRepo.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      throw new NotFoundException(`User with email ${adminEmail} already exists`);
    }

    return this.companyRepo.manager.transaction(async (manager) => {
      const company = manager.create(Company, {
        key: data.key.trim(),
        name: data.name.trim(),
        localCurrency: data.localCurrency.trim().toUpperCase(),
      });

      const savedCompany = await manager.save(Company, company);

      const adminDepartment = manager.create(Department, {
        name: ADMIN_DEPARTMENT_NAME,
        id_company: savedCompany.id,
        isProtected: true,
      });

      const savedDepartment = await manager.save(Department, adminDepartment);

      const hashedPassword = await bcrypt.hash(data.admin.password, 10);
      const adminUser = manager.create(User, {
        email: adminEmail,
        name: data.admin.name.trim(),
        lastName: data.admin.lastName.trim(),
        password: hashedPassword,
        availabilityStatus: 'active',
        employeeStatus: 'active',
        username:
          data.admin.username?.trim() || adminEmail.split('@')[0] || undefined,
        idDepartment: savedDepartment.id,
        idRole: companyAdminRole.id,
      });

      await manager.save(User, adminUser);
      return savedCompany;
    });
  }

  findAll(): Promise<CompanyDto[]> {
    return this.companyRepo.find();
  }

  async findOne(id: string): Promise<CompanyDto> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async update(id: string, data: UpdateCompanyDto): Promise<CompanyDto> {
    const company = await this.findOne(id);

    if (data.key !== undefined) company.key = data.key.trim();
    if (data.name !== undefined) company.name = data.name.trim();
    if (data.localCurrency !== undefined) {
      company.localCurrency = data.localCurrency.trim().toUpperCase();
    }

    await this.companyRepo.save(company);
    return this.findOne(id);
  }

  async createDepartment(
    idCompany: string,
    data: CreateCompanyDepartmentDto,
  ): Promise<CompanyDepartmentDto> {
    await this.findOne(idCompany);

    const costCenter = await this.costCenterRepo.findOne({
      where: {
        numericId: data.cost_center_id,
        id_company: idCompany,
        deletedAt: IsNull(),
      },
    });

    if (!costCenter) {
      throw new NotFoundException(
        `Cost center ${data.cost_center_id} not found`,
      );
    }

    const department = this.departmentRepo.create({
      name: data.name.trim(),
      id_company: idCompany,
      isProtected: false,
      cost_center: costCenter,
    });

    return this.departmentRepo.save(department);
  }

  async previewDepartmentsExcel(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    buffer: Buffer,
  ): Promise<PreviewDepartmentsResponseDto> {
    await this.assertCompanyDepartmentAccess(idRole, idDepartment, idCompany);

    const rows = parseExcelRows(buffer);
    if (!rows.length) {
      throw new HttpException({ errors: { file: ['El archivo Excel no contiene filas'] } }, HttpStatus.BAD_REQUEST);
    }

    const departments = rows.map((row, index) => this.mapDepartmentPreviewRow(row, index + 2, idCompany));
    const errorRows = departments.filter((row) => row.validationErrors.length > 0).length;

    return {
      departments,
      totalRows: departments.length,
      validRows: departments.length - errorRows,
      errorRows,
    };
  }

  async confirmDepartmentsImport(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    data: ConfirmDepartmentsDto,
  ): Promise<ImportResultDto> {
    await this.assertCompanyDepartmentAccess(idRole, idDepartment, idCompany);

    if (!data.departments?.length) {
      throw new HttpException({ errors: { departments: ['No se proporcionaron departamentos para importar'] } }, HttpStatus.BAD_REQUEST);
    }

    const result: ImportResultDto = { created: 0, updated: 0, errors: [] };

    for (const [index, department] of data.departments.entries()) {
      try {
        const normalizedName = normalizeCellValue(department.name);
        const costCenterId = department.cost_center_id;

        if (!normalizedName) {
          throw new HttpException({ errors: { name: ['El nombre es obligatorio'] } }, HttpStatus.BAD_REQUEST);
        }

        const costCenter = await this.costCenterRepo.findOne({
          where: { numericId: costCenterId, id_company: idCompany, deletedAt: IsNull() },
        });

        if (!costCenter) {
          throw new HttpException({ errors: { cost_center_id: [`Centro de costo ${costCenterId} no se encontró para esta empresa`] } }, HttpStatus.BAD_REQUEST);
        }

        const existing = await this.departmentRepo.findOne({
          where: { id_company: idCompany, name: normalizedName },
          relations: ['cost_center'],
        });

        if (existing) {
          existing.cost_center = costCenter;
          await this.departmentRepo.save(existing);
          result.updated += 1;
        } else {
          await this.departmentRepo.save(
            this.departmentRepo.create({
              name: normalizedName,
              id_company: idCompany,
              isProtected: false,
              cost_center: costCenter,
            }),
          );
          result.created += 1;
        }
      } catch (error) {
        result.errors.push({
          row: `row-${index + 2}`,
          message: this.formatImportErrorMessage(error, 'Error inesperado al importar departamentos'),
        });
      }
    }

    return result;
  }

  findDepartments(idCompany: string): Promise<CompanyDepartmentDto[]> {
    return this.departmentRepo.find({
      where: { id_company: idCompany },
      relations: ['cost_center'],
      order: { name: 'ASC' },
    });
  }

  async updateDepartmentCostCenter(
    idCompany: string,
    idDepartment: string,
    data: UpdateCompanyDepartmentCostCenterDto,
  ): Promise<CompanyDepartmentDto> {
    const department = await this.departmentRepo.findOne({
      where: { id: idDepartment, id_company: idCompany },
      relations: ['cost_center'],
    });

    if (!department) {
      throw new NotFoundException(`Department ${idDepartment} not found`);
    }

    const costCenter = await this.costCenterRepo.findOne({
      where: {
        numericId: data.cost_center_id,
        id_company: idCompany,
        deletedAt: IsNull(),
      },
    });

    if (!costCenter) {
      throw new NotFoundException(
        `Cost center ${data.cost_center_id} not found`,
      );
    }

    department.cost_center = costCenter;
    await this.departmentRepo.save(department);

    return this.departmentRepo.findOneOrFail({
      where: { id: idDepartment },
      relations: ['cost_center'],
    });
  }

  async assertSuperAdmin(idRole: string): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id: idRole } });
    if (!role) {
      throw new ForbiddenException('Role not found');
    }

    const normalizedRole = role.name.trim().toLowerCase();
    const allowedSuperAdminNames = [
      'superadmin',
      'super admin',
      'superadministrador',
      'super administrador',
    ];

    if (!allowedSuperAdminNames.includes(normalizedRole)) {
      throw new ForbiddenException('Only SuperAdmin can access companies endpoints.');
    }
  }

  async assertCompanyDepartmentAccess(
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
      throw new ForbiddenException(
        'Only CompanyAdmin can access company departments endpoints.',
      );
    }

    if (!userDepartmentId) {
      throw new ForbiddenException(
        'CompanyAdmin must belong to a department associated with a company.',
      );
    }

    const department = await this.departmentRepo.findOne({
      where: { id: userDepartmentId },
    });

    const departmentCompanyId = department?.id_company;

    if (!departmentCompanyId || departmentCompanyId !== targetCompanyId) {
      throw new ForbiddenException(
        'CompanyAdmin can only access departments for their own company.',
      );
    }
  }

  private mapDepartmentPreviewRow(
    row: Record<string, any>,
    rowNumber: number,
    idCompany: string,
  ): PreviewDepartmentRowDto {
    const name = normalizeCellValue(getRowValue(row, 'name', 'nombre')) ?? '';
    const costCenterId = normalizeNumberValue(
      getRowValue(
        row,
        'cost_center_id',
        'cost center id',
        'ceco',
        'numericid',
        'centro de costos',
        'centro de costo',
        'id centro de costos',
        'id centro de costo',
      ),
    );

    const validationErrors: string[] = [];
    let costCenterName: string | null = null;

    if (!name) {
      validationErrors.push('El nombre es obligatorio');
    }

    if (!costCenterId) {
      validationErrors.push('El centro de costo es obligatorio');
    }

    return {
      row: rowNumber,
      name,
      cost_center_id: costCenterId ?? 0,
      costCenterName,
      isUpdate: false,
      validationErrors,
    };
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

  private async findCompanyAdminRole(): Promise<Roles> {
    const preferredRoleName =
      process.env.COMPANY_ADMIN_ROLE_NAME?.trim() || 'CompanyAdmin';

    const role = await this.roleRepo
      .createQueryBuilder('role')
      .where('LOWER(role.name) = LOWER(:name)', { name: preferredRoleName })
      .orWhere('LOWER(role.name) = LOWER(:alt1)', {
        alt1: 'Administrador de Empresa',
      })
      .orWhere('LOWER(role.name) = LOWER(:alt2)', {
        alt2: 'Company Admin',
      })
      .orWhere('LOWER(role.name) = LOWER(:alt3)', {
        alt3: 'Admin Empresa',
      })
      .getOne();

    if (!role) {
      throw new NotFoundException(
        'CompanyAdmin role not found. Seed/create this role before creating companies.',
      );
    }

    return role;
  }
}
