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

  // ---------------------------------------------------------------------------
  // Excel Import -- Step 1: Preview
  // ---------------------------------------------------------------------------

  async previewExcel(buffer: Buffer): Promise<PreviewResponseDto> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('The Excel file contains no sheets');
    }

    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { raw: true },
    );

    if (rows.length === 0) {
      throw new BadRequestException('The Excel sheet is empty');
    }

    const departments = await this.departmentRepo.find({
      relations: { cost_center: true },
    });
    const roles = await this.rolesRepo.find();

    const cecoToDepartment = new Map<string, Department>();
    for (const dept of departments) {
      if (dept.cost_center?.key) {
        cecoToDepartment.set(String(dept.cost_center.key), dept);
      }
    }

    const employeeNumbers = rows
      .map((r) => String(r['NoEmpleado'] ?? '').trim())
      .filter(Boolean);

    const existingUsers =
      employeeNumbers.length > 0
        ? await this.repo.find({
            where: { employeeNumber: In(employeeNumbers) },
            select: ['id', 'employeeNumber'],
          })
        : [];

    const existingSet = new Set(existingUsers.map((u) => u.employeeNumber));

    const employees: PreviewEmployeeDto[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];

      const empNum = String(row['NoEmpleado'] ?? '').trim();
      if (!empNum) errors.push('NoEmpleado is required');

      const fullName = String(row['Nombre'] ?? '').trim();
      const nameParts = fullName.split(/\s+/);
      const name = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      if (!fullName) errors.push('Nombre is required');

      const username = row['Usuario']
        ? String(row['Usuario']).trim() || null
        : null;

      const email = row['Email']
        ? String(row['Email']).trim() || null
        : null;

      const supplierNumber = row['Proveedor']
        ? String(row['Proveedor']).trim() || null
        : null;

      const cecoRaw = row['Ceco'] != null ? String(row['Ceco']).trim() : '';
      const dept = cecoToDepartment.get(cecoRaw);
      if (cecoRaw && !dept) {
        errors.push(`Unknown CeCo: ${cecoRaw}`);
      }

      const bossRaw = row['Jefe Inmediato']
        ? String(row['Jefe Inmediato']).trim() || null
        : null;

      const statusRaw = row['status']
        ? String(row['status']).trim().toUpperCase()
        : 'A';
      const availabilityStatus = statusRaw === 'A' ? 'active' : 'inactive';

      const signupDate = this.excelSerialToIso(row['FechaAlta']);
      const lastchangeDate = this.excelSerialToIso(row['FechaCambio']);

      employees.push({
        row: i + 2, // Excel row (1-indexed header + data)
        employeeNumber: empNum,
        name,
        lastName,
        username,
        email,
        supplierNumber,
        departmentId: dept?.id ?? null,
        departmentName: dept?.name ?? null,
        bossEmployeeNumber: bossRaw,
        availabilityStatus,
        signupDate,
        lastchangeDate,
        isUpdate: existingSet.has(empNum),
        validationErrors: errors,
      });
    }

    const errorRows = employees.filter((e) => e.validationErrors.length > 0).length;

    return {
      employees,
      availableRoles: roles.map((r) => ({ id: r.id, name: r.name })),
      totalRows: employees.length,
      validRows: employees.length - errorRows,
      errorRows,
    };
  }

  // ---------------------------------------------------------------------------
  // Excel Import -- Step 2: Confirm
  // ---------------------------------------------------------------------------

  async confirmImport(data: ConfirmImportDto): Promise<ImportResultDto> {
    const { employees } = data;
    if (!employees || employees.length === 0) {
      throw new BadRequestException('No employees to import');
    }

    const result: ImportResultDto = { created: 0, updated: 0, errors: [] };

    // Pre-fetch existing users by employee_number for upsert detection
    const empNumbers = employees.map((e) => e.employeeNumber);
    const existingUsers = await this.repo.find({
      where: { employeeNumber: In(empNumbers) },
    });
    const existingMap = new Map(
      existingUsers.map((u) => [u.employeeNumber, u]),
    );

    // Pass 1: Batch upsert all users (idManager = null initially)
    const entitiesToSave: Partial<User>[] = [];

    for (const emp of employees) {
      try {
        const rawPassword =
          (emp.username ?? '') +
          (emp.name + emp.lastName).replace(/\s/g, '');
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const existing = existingMap.get(emp.employeeNumber);

        const entity: Partial<User> = {
          ...(existing ? { id: existing.id } : {}),
          employeeNumber: emp.employeeNumber,
          name: emp.name,
          lastName: emp.lastName,
          username: emp.username ?? undefined,
          email: emp.email ?? undefined,
          supplierNumber: emp.supplierNumber ?? undefined,
          idDepartment: emp.departmentId,
          idRole: emp.idRole,
          password: hashedPassword,
          availabilityStatus: emp.availabilityStatus,
          employeeStatus: emp.availabilityStatus,
          idManager: undefined,
          ...(emp.signupDate ? { signupDate: new Date(emp.signupDate) } : {}),
          ...(emp.lastchangeDate
            ? { lastchangeDate: new Date(emp.lastchangeDate) }
            : {}),
        };

        entitiesToSave.push(entity);

        if (existing) {
          result.updated++;
        } else {
          result.created++;
        }
      } catch (err) {
        result.errors.push({
          employeeNumber: emp.employeeNumber,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Batch save (TypeORM save handles insert-or-update when id is present)
    if (entitiesToSave.length > 0) {
      await this.repo.save(entitiesToSave as User[]);
    }

    // Pass 2: Resolve manager hierarchy (Jefe Inmediato -> idManager)
    const bossLinks = employees.filter((e) => e.bossEmployeeNumber);
    if (bossLinks.length > 0) {
      const allBossNumbers = [
        ...new Set(bossLinks.map((e) => e.bossEmployeeNumber!)),
      ];
      const bossUsers = await this.repo.find({
        where: { employeeNumber: In(allBossNumbers) },
        select: ['id', 'employeeNumber'],
      });
      const bossMap = new Map(
        bossUsers.map((u) => [u.employeeNumber, u.id]),
      );

      const managerUpdates: Partial<User>[] = [];
      for (const emp of bossLinks) {
        const managerId = bossMap.get(emp.bossEmployeeNumber!);
        if (!managerId) {
          result.errors.push({
            employeeNumber: emp.employeeNumber,
            message: `Manager not found for employee_number: ${emp.bossEmployeeNumber}`,
          });
          continue;
        }

        const user = await this.repo.findOne({
          where: { employeeNumber: emp.employeeNumber },
          select: ['id'],
        });
        if (user) {
          managerUpdates.push({ id: user.id, idManager: managerId });
        }
      }

      if (managerUpdates.length > 0) {
        await this.repo.save(managerUpdates as User[]);
      }
    }

    this.logger.log(
      `Import complete: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`,
    );

    return result;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Converts an Excel serial date number to an ISO string.
   * Returns null if the value is not a valid serial number.
   */
  private excelSerialToIso(value: any): string | null {
    if (value == null || value === '') return null;
    const serial = Number(value);
    if (isNaN(serial) || serial < 1) return null;
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString();
  }
}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
- 2026-04-15 | Excel Import | Added previewExcel() and confirmImport() methods for 2-step employee import.
*/