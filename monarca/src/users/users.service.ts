/**
 * File: users.service.ts
 * Description: Service containing the business logic for user creation, retrieval, updating, deletion, and Excel import.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In, Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto, UserDto } from './dto/user.dtos';
import { Department } from 'src/departments/entity/department.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { PreviewEmployeeDto, PreviewResponseDto } from './dto/import-preview.dto';
import { ConfirmImportDto } from './dto/import-confirm.dto';
import { ImportResultDto } from './dto/import-result.dto';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(CostCenter)
    private readonly costCenterRepo: Repository<CostCenter>,
    @InjectRepository(Roles)
    private readonly rolesRepo: Repository<Roles>,
  ) {}

  /**
   * Finds a user by ID, including their role and permissions.
   * @param id The UUID of the user.
   * @returns The user entity.
   */
  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user;
  }

  /**
   * Retrieves all registered users.
   * @returns An array of user data transfer objects.
   */
  async findAll(): Promise<UserDto[]> {
    return await this.repo.find();
  }

  /**
   * Creates a new user in the database.
   * @param data The user creation data.
   * @returns The newly created user entity.
   */
  async create(data: CreateUserDto): Promise<User> {
    await this.validateCompanyRoleInvariant(data.idRole, data.idDepartment);
    const ent = this.repo.create(data);
    return this.repo.save(ent);
  }

  /**
   * Finds a single user by ID, including their travel agency relation.
   * @param id The UUID of the user.
   * @returns The user data transfer object.
   */
  async findOne(id: string): Promise<UserDto> {
    const ent = await this.repo.findOne({
      where: { id },
      relations: { travelAgency: true },
    });
    if (!ent) throw new NotFoundException(`User ${id} not found`);
    return ent;
  }

  /**
   * Updates a user's information.
   * @param id The UUID of the user to update.
   * @param data The data to update.
   * @returns The updated user data transfer object.
   */
  async update(id: string, data: UpdateUserDto): Promise<UserDto> {
    const currentUser = await this.repo.findOne({ where: { id } });
    if (!currentUser) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const targetRoleId = data.idRole ?? currentUser.idRole;
    const targetDepartmentId =
      data.idDepartment !== undefined ? data.idDepartment : currentUser.idDepartment;

    await this.validateCompanyRoleInvariant(targetRoleId, targetDepartmentId);

    await this.repo.update(id, data);
    return this.findOne(id);
  }

  /**
   * Deletes a user from the database.
   * @param id The UUID of the user to delete.
   * @returns An object containing the operation status and a confirmation message.
   */
  async delete(id: string): Promise<{ status: boolean; message: string }> {
    await this.repo.delete(id);
    return { status: true, message: `User ${id} deleted` };
  }

  /**
   * Ensures that the current user has CompanyAdmin role.
   */
  async assertCompanyAdmin(userId: string): Promise<void> {
    const user = await this.repo.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user?.role) {
      throw new ForbiddenException('User role not found');
    }

    const normalizedRole = user.role.name.toLowerCase().replace(/\s+/g, '');
    if (normalizedRole !== 'companyadmin') {
      throw new ForbiddenException(
        'Only CompanyAdmin can import employees from Excel',
      );
    }
  }

  /**
   * Step 1: Parse Excel and return preview payload for UI role assignment.
   */
  async previewExcel(buffer: Buffer): Promise<PreviewResponseDto> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      raw: true,
      defval: null,
    });

    if (!rows.length) {
      throw new BadRequestException('Excel file has no rows');
    }

    const [roles, users, departments, costCenters] = await Promise.all([
      this.rolesRepo.find({ order: { name: 'ASC' } }),
      this.repo.find({ select: ['employeeNumber'] }),
      this.departmentRepo.find({ relations: { cost_center: true } }),
      this.costCenterRepo.find(),
    ]);

    const existingUsers = new Set(
      users
        .map((u) => this.normalizeCellValue(u.employeeNumber))
        .filter((v): v is string => !!v),
    );

    const cecoToDepartment = new Map<string, Department>();
    for (const department of departments) {
      if (department.cost_center?.key) {
        cecoToDepartment.set(
          this.normalizeCellValue(department.cost_center.key) ?? '',
          department,
        );
      }
    }

    for (const costCenter of costCenters) {
      const key = this.normalizeCellValue(costCenter.key);
      if (!key || cecoToDepartment.has(key)) {
        continue;
      }

      const fallbackDepartment = departments.find(
        (dept) => dept.cost_center?.id === costCenter.id,
      );
      if (fallbackDepartment) {
        cecoToDepartment.set(key, fallbackDepartment);
      }
    }

    const employees: PreviewEmployeeDto[] = rows.map((row, index) => {
      const validationErrors: string[] = [];

      const employeeNumber = this.normalizeCellValue(row.NoEmpleado) ?? '';
      const fullName = this.normalizeCellValue(row.Nombre) ?? '';
      const username = this.normalizeNullableCellValue(row.Usuario);
      const email = this.normalizeNullableCellValue(row.Email);
      const supplierNumber = this.normalizeNullableCellValue(row.Proveedor);
      const ceco = this.normalizeCellValue(row.Ceco) ?? '';
      const bossEmployeeNumber = this.normalizeNullableCellValue(
        row['Jefe Inmediato'],
      );

      const { name, lastName } = this.splitName(fullName);
      const department = ceco ? cecoToDepartment.get(ceco) : undefined;

      if (!employeeNumber) {
        validationErrors.push('NoEmpleado is required');
      }
      if (!name) {
        validationErrors.push('Nombre is required');
      }
      if (ceco && !department) {
        validationErrors.push(`No department found for CeCo ${ceco}`);
      }
      if (!ceco) {
        validationErrors.push('Ceco is required');
      }

      const statusRaw = this.normalizeCellValue(row.status)?.toUpperCase() ?? 'A';
      const availabilityStatus = statusRaw === 'A' ? 'active' : 'inactive';

      return {
        row: index + 2,
        employeeNumber,
        name,
        lastName,
        username,
        email,
        supplierNumber,
        departmentId: department?.id ?? null,
        departmentName: department?.name ?? null,
        bossEmployeeNumber,
        availabilityStatus,
        signupDate: this.excelValueToIsoString(row.FechaAlta),
        lastchangeDate: this.excelValueToIsoString(row.FechaCambio),
        isUpdate: existingUsers.has(employeeNumber),
        validationErrors,
      };
    });

    const errorRows = employees.filter((e) => e.validationErrors.length > 0).length;

    return {
      employees,
      availableRoles: roles.map((r) => ({ id: r.id, name: r.name })),
      totalRows: employees.length,
      validRows: employees.length - errorRows,
      errorRows,
    };
  }

  /**
   * Step 2: Persist the confirmed employees with admin-assigned role.
   */
  async confirmImport(data: ConfirmImportDto): Promise<ImportResultDto> {
    if (!data.employees?.length) {
      throw new BadRequestException('No employees provided for import');
    }

    const result: ImportResultDto = {
      created: 0,
      updated: 0,
      errors: [],
    };

    const employeeNumbers = data.employees
      .map((e) => this.normalizeCellValue(e.employeeNumber))
      .filter((v): v is string => !!v);

    const existingUsers = await this.repo.find({
      where: { employeeNumber: In(employeeNumbers) },
      select: ['id', 'employeeNumber'],
    });
    const existingUserMap = new Map(
      existingUsers.map((u) => [u.employeeNumber, u.id]),
    );

    const roleIds = [...new Set(data.employees.map((e) => e.idRole))];
    const validRoles = await this.rolesRepo.find({
      where: { id: In(roleIds) },
      select: ['id'],
    });
    const validRoleSet = new Set(validRoles.map((r) => r.id));

    const departmentIds = [
      ...new Set(data.employees.map((e) => e.departmentId).filter(Boolean)),
    ];
    const validDepartments = await this.departmentRepo.find({
      where: { id: In(departmentIds) },
      select: ['id'],
    });
    const validDepartmentSet = new Set(validDepartments.map((d) => d.id));

    const usersToSave: Array<Partial<User>> = [];

    for (const employee of data.employees) {
      const employeeNumber = this.normalizeCellValue(employee.employeeNumber);
      if (!employeeNumber) {
        result.errors.push({
          employeeNumber: '',
          message: 'employeeNumber is required',
        });
        continue;
      }

      if (!validRoleSet.has(employee.idRole)) {
        result.errors.push({
          employeeNumber,
          message: `Role ${employee.idRole} does not exist`,
        });
        continue;
      }

      if (!validDepartmentSet.has(employee.departmentId)) {
        result.errors.push({
          employeeNumber,
          message: `Department ${employee.departmentId} does not exist`,
        });
        continue;
      }

      const basePassword = `${employee.username ?? ''}${(employee.name ?? '').replace(/\s+/g, '')}${(employee.lastName ?? '').replace(/\s+/g, '')}`;
      const hashedPassword = await bcrypt.hash(basePassword, 10);
      const existingId = existingUserMap.get(employeeNumber);

      const entity: Partial<User> = {
        ...(existingId ? { id: existingId } : {}),
        employeeNumber,
        name: employee.name,
        lastName: employee.lastName,
        username: employee.username ?? null,
        email: employee.email ?? null,
        supplierNumber: employee.supplierNumber ?? undefined,
        idDepartment: employee.departmentId,
        idRole: employee.idRole,
        availabilityStatus: employee.availabilityStatus,
        employeeStatus: employee.availabilityStatus,
        password: hashedPassword,
        idManager: null,
      };

      usersToSave.push(entity);
      if (existingId) {
        result.updated += 1;
      } else {
        result.created += 1;
      }
    }

    if (usersToSave.length > 0) {
      await this.repo.save(usersToSave);
    }

    const usersAfterSave = await this.repo.find({
      where: {
        employeeNumber: In(
          usersToSave
            .map((u) => u.employeeNumber)
            .filter((v): v is string => !!v),
        ),
      },
      select: ['id', 'employeeNumber'],
    });
    const usersByEmployeeNumber = new Map(
      usersAfterSave.map((u) => [u.employeeNumber, u]),
    );

    const managerEmployeeNumbers = data.employees
      .map((e) => this.normalizeNullableCellValue(e.bossEmployeeNumber))
      .filter((v): v is string => !!v);

    const managerCandidates = managerEmployeeNumbers.length
      ? await this.repo.find({
          where: { employeeNumber: In([...new Set(managerEmployeeNumbers)]) },
          select: ['id', 'employeeNumber'],
        })
      : [];
    const managersByEmployeeNumber = new Map(
      managerCandidates.map((m) => [m.employeeNumber, m.id]),
    );

    const managerUpdates: Partial<User>[] = [];

    for (const employee of data.employees) {
      const employeeNumber = this.normalizeCellValue(employee.employeeNumber);
      const bossEmployeeNumber = this.normalizeNullableCellValue(
        employee.bossEmployeeNumber,
      );

      if (!employeeNumber) continue;

      const savedUser = usersByEmployeeNumber.get(employeeNumber);
      if (!savedUser) continue;

      if (!bossEmployeeNumber) {
        managerUpdates.push({ id: savedUser.id, idManager: null });
        continue;
      }

      const managerId = managersByEmployeeNumber.get(bossEmployeeNumber);
      if (!managerId) {
        result.errors.push({
          employeeNumber,
          message: `Manager not found for employee_number ${bossEmployeeNumber}`,
        });
        continue;
      }

      managerUpdates.push({ id: savedUser.id, idManager: managerId });
    }

    if (managerUpdates.length > 0) {
      await this.repo.save(managerUpdates);
    }

    this.logger.log(
      `Excel import completed. created=${result.created}, updated=${result.updated}, errors=${result.errors.length}`,
    );

    return result;
  }

  private async validateCompanyRoleInvariant(
    idRole: string,
    idDepartment?: string,
  ): Promise<void> {
    const role = await this.rolesRepo.findOne({ where: { id: idRole } });
    if (!role) {
      throw new BadRequestException(`Role ${idRole} not found`);
    }

    const roleName = role.name.toLowerCase();

    const isSuperAdmin = [
      'superadmin',
      'super admin',
      'superadministrador',
      'super administrador',
    ].includes(roleName);

    const isCompanyAdmin = [
      'companyadmin',
      'company admin',
      'administrador de empresa',
      'admin empresa',
    ].includes(roleName);

    if (isSuperAdmin && idDepartment) {
      throw new BadRequestException(
        'SuperAdmin users must not be assigned to any department.',
      );
    }

    if (isCompanyAdmin && !idDepartment) {
      throw new BadRequestException(
        'CompanyAdmin users must be assigned to a department.',
      );
    }
  }

  private normalizeCellValue(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
      return Number.isInteger(value) ? String(value) : String(value);
    }

    const text = String(value).trim();
    if (!text) return null;

    if (/^\d+\.0$/.test(text)) {
      return text.slice(0, -2);
    }

    return text;
  }

  private normalizeNullableCellValue(value: unknown): string | null {
    return this.normalizeCellValue(value);
  }

  private splitName(fullName: string): { name: string; lastName: string } {
    const normalized = fullName.trim();
    if (!normalized) return { name: '', lastName: '' };

    const [name, ...rest] = normalized.split(/\s+/);
    return {
      name,
      lastName: rest.join(' '),
    };
  }

  private excelValueToIsoString(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;

      const date = new Date(
        Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S),
      );
      return date.toISOString();
    }

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }
}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
- 2026-04-15 | Excel Import | Added previewExcel() and confirmImport() methods for 2-step employee import.
*/
