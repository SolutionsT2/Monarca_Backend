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

  private async validateCompanyRoleInvariant(
    idRole: string,
    idDepartment?: string,
  ): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id: idRole } });
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
}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
- 2026-04-15 | Excel Import | Added previewExcel() and confirmImport() methods for 2-step employee import.
*/
