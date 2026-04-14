/**
 * File: roles-admin.service.ts
 * Description: CRUD for roles, permission matrix sync, auth module catalog seed, and XML import.
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Equal } from 'typeorm';
import { XMLParser } from 'fast-xml-parser';
import { Roles } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';
import { RolePermission } from './entity/roles_permissions.entity';
import { AuthModuleEntity } from './entity/auth-module.entity';
import { AuthorizationSubstitute } from './entity/authorization-substitute.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolePermissionModuleDto } from './dto/role-permission-module.dto';
import { CreateSubstituteDto } from './dto/create-substitute.dto';
import { DEFAULT_AUTH_MODULES } from './constants/default-auth-modules';
import { buildPermissionKey } from './utils/permission-key.util';
import { getActivePermissionsForRole } from './utils/active-permissions.util';

export interface RolePermissionModuleResponse {
  moduleId: string;
  moduleName: string;
  allowedActions: string[];
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissions: RolePermissionModuleResponse[];
}

export interface SubstituteResponse {
  id: string;
  roleId: string;
  targetUserId: string;
  startDate: string;
  endDate: string;
  notes: string;
}

@Injectable()
export class RolesAdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepo: Repository<Roles>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(AuthModuleEntity)
    private readonly authModuleRepo: Repository<AuthModuleEntity>,
    @InjectRepository(AuthorizationSubstitute)
    private readonly substituteRepo: Repository<AuthorizationSubstitute>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Ensures catalog modules exist for UI and imports.
   */
  async onModuleInit(): Promise<void> {
    for (const row of DEFAULT_AUTH_MODULES) {
      const existing = await this.authModuleRepo.findOne({
        where: { id: row.id },
      });
      if (!existing) {
        await this.authModuleRepo.save(
          this.authModuleRepo.create({ id: row.id, name: row.name }),
        );
      }
    }
  }

  /**
   * Returns the static module list for permission pickers.
   */
  getAvailableModules(): { id: string; name: string }[] {
    return [...DEFAULT_AUTH_MODULES];
  }

  /**
   * Lists all roles with their effective (non-expired) permission matrix.
   */
  async findAllRoles(): Promise<RoleResponse[]> {
    const roles = await this.rolesRepo.find({
      relations: [
        'rolePermissions',
        'rolePermissions.permission',
        'rolePermissions.permission.authModule',
      ],
      order: { name: 'ASC' },
    });
    return roles.map((r) => this.toRoleResponse(r));
  }

  /**
   * Returns a single role by id.
   */
  async findRoleById(id: string): Promise<RoleResponse> {
    const role = await this.loadRoleOrThrow(id);
    return this.toRoleResponse(role);
  }

  /**
   * Returns only the permission matrix for a role.
   */
  async getRolePermissions(id: string): Promise<RolePermissionModuleResponse[]> {
    const role = await this.loadRoleOrThrow(id);
    return this.groupPermissionsForApi(
      getActivePermissionsForRole(role),
    );
  }

  /**
   * Creates a role and attaches permissions.
   */
  async createRole(dto: CreateRoleDto): Promise<RoleResponse> {
    const role = this.rolesRepo.create({
      name: dto.name.trim(),
      description: dto.description?.trim() ?? null,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.rolesRepo.save(role);
    await this.syncRolePermissions(String(saved.id), dto.permissions ?? []);
    const reloaded = await this.loadRoleOrThrow(String(saved.id));
    return this.toRoleResponse(reloaded);
  }

  /**
   * Updates role fields and optionally replaces permissions.
   */
  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleResponse> {
    const role = await this.loadRoleOrThrow(id);
    if (dto.name !== undefined) {
      role.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      role.description = dto.description?.trim() ?? null;
    }
    if (dto.isActive !== undefined) {
      role.isActive = dto.isActive;
    }
    await this.rolesRepo.save(role);
    if (dto.permissions !== undefined) {
      await this.syncRolePermissions(id, dto.permissions);
    }
    const reloaded = await this.loadRoleOrThrow(id);
    return this.toRoleResponse(reloaded);
  }

  /**
   * Replaces all permissions for a role.
   */
  async patchRolePermissions(
    id: string,
    permissions: RolePermissionModuleDto[],
  ): Promise<RolePermissionModuleResponse[]> {
    await this.loadRoleOrThrow(id);
    await this.syncRolePermissions(id, permissions);
    return this.getRolePermissions(id);
  }

  /**
   * Deletes a role when no user references it.
   */
  async deleteRole(id: string): Promise<void> {
    await this.loadRoleOrThrow(id);
    const usersCount = await this.userRepo.count({
      where: { idRole: id },
    });
    if (usersCount > 0) {
      throw new ConflictException(
        'Cannot delete role while users are assigned to it',
      );
    }
    await this.rolesRepo.delete(id);
  }

  /**
   * Parses roles-import XML and upserts roles by name.
   */
  async importRolesFromXml(xml: string): Promise<{ created: number; updated: number }> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: true,
    });
    let parsed: unknown;
    try {
      parsed = parser.parse(xml);
    } catch {
      throw new BadRequestException('Invalid XML payload');
    }
    const root = parsed as Record<string, unknown>;
    const container = (root.rolesImport ?? root.RolesImport) as
      | Record<string, unknown>
      | undefined;
    if (!container || typeof container !== 'object') {
      throw new BadRequestException(
        'XML root must be <rolesImport> (see docs/roles-import.example.xml)',
      );
    }
    const rawRoles = container.role ?? container.Role;
    const roleList = Array.isArray(rawRoles)
      ? rawRoles
      : rawRoles
        ? [rawRoles]
        : [];
    if (roleList.length === 0) {
      throw new BadRequestException('No <role> entries found in XML');
    }

    let created = 0;
    let updated = 0;

    for (const raw of roleList) {
      const row = raw as Record<string, unknown>;
      const name = String(row['@_name'] ?? row.name ?? '').trim();
      if (!name) {
        throw new BadRequestException('Each role must have a name attribute');
      }
      const description = String(
        row['@_description'] ?? row.description ?? '',
      ).trim();
      const isActiveAttr = row['@_isActive'] ?? row['@_is_active'] ?? true;
      const isActive =
        isActiveAttr === false ||
        String(isActiveAttr).toLowerCase() === 'false'
          ? false
          : true;

      const permissions = this.parseXmlPermissions(row);

      const existing = await this.rolesRepo.findOne({ where: { name } });
      if (existing) {
        existing.description = description || null;
        existing.isActive = isActive;
        await this.rolesRepo.save(existing);
        await this.syncRolePermissions(String(existing.id), permissions);
        updated += 1;
      } else {
        const role = this.rolesRepo.create({
          name,
          description: description || null,
          isActive,
        });
        const saved = await this.rolesRepo.save(role);
        await this.syncRolePermissions(String(saved.id), permissions);
        created += 1;
      }
    }

    return { created, updated };
  }

  // --- Substitutes ---

  async findAllSubstitutes(): Promise<SubstituteResponse[]> {
    const rows = await this.substituteRepo.find({
      order: { startDate: 'DESC' },
    });
    return rows.map((s) => this.toSubstituteResponse(s));
  }

  async createSubstitute(dto: CreateSubstituteDto): Promise<SubstituteResponse> {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
    await this.loadRoleOrThrow(dto.roleId);
    const target = await this.userRepo.findOne({
      where: { id: dto.targetUserId },
    });
    if (!target) {
      throw new NotFoundException('Target user not found');
    }
    const entity = this.substituteRepo.create({
      roleId: dto.roleId,
      targetUserId: dto.targetUserId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      notes: dto.notes?.trim() ?? null,
    });
    const saved = await this.substituteRepo.save(entity);
    return this.toSubstituteResponse(saved);
  }

  async deleteSubstitute(id: string): Promise<void> {
    const res = await this.substituteRepo.delete(id);
    if (!res.affected) {
      throw new NotFoundException('Substitute not found');
    }
  }

  // --- Internals ---

  private parseXmlPermissions(
    row: Record<string, unknown>,
  ): RolePermissionModuleDto[] {
    const permBlock = row.permissions ?? row.Permissions;
    const block = permBlock as Record<string, unknown> | undefined;
    const rawPerm = block?.permission ?? block?.Permission ?? row.permission;
    const list = Array.isArray(rawPerm)
      ? rawPerm
      : rawPerm
        ? [rawPerm]
        : [];
    const result: RolePermissionModuleDto[] = [];
    for (const p of list) {
      const o = p as Record<string, unknown>;
      const moduleId = String(o['@_moduleId'] ?? o['@_moduleid'] ?? '').trim();
      const moduleName = String(o['@_moduleName'] ?? '').trim();
      const actionsStr = String(o['@_actions'] ?? '').trim();
      if (!moduleId || !actionsStr) {
        throw new BadRequestException(
          'Each <permission> requires moduleId and actions attributes',
        );
      }
      const allowedActions = actionsStr
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);
      result.push({ moduleId, moduleName: moduleName || undefined, allowedActions });
    }
    return result;
  }

  private async loadRoleOrThrow(id: string): Promise<Roles> {
    const role = await this.rolesRepo.findOne({
      where: { id: Equal(id) },
      relations: [
        'rolePermissions',
        'rolePermissions.permission',
        'rolePermissions.permission.authModule',
      ],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  private toRoleResponse(role: Roles): RoleResponse {
    const perms = getActivePermissionsForRole(role);
    return {
      id: String(role.id),
      name: role.name,
      description: role.description ?? '',
      isActive: role.isActive,
      permissions: this.groupPermissionsForApi(perms),
    };
  }

  /**
   * Groups flat permission rows into module buckets for the API.
   */
  private groupPermissionsForApi(
    permissions: Permission[],
  ): RolePermissionModuleResponse[] {
    const map = new Map<
      string,
      { moduleId: string; moduleName: string; actions: Set<string> }
    >();
    for (const p of permissions) {
      let moduleId = p.authModule?.id ?? null;
      let moduleName = p.authModule?.name ?? null;
      let action = p.action;
      if (!moduleId && p.name?.includes(':')) {
        const idx = p.name.indexOf(':');
        moduleId = p.name.slice(0, idx);
        action = action ?? p.name.slice(idx + 1);
        moduleName = moduleName ?? moduleId;
      }
      if (!moduleId) {
        moduleId = 'legacy';
        moduleName = moduleName ?? 'Legacy';
      }
      if (!map.has(moduleId)) {
        map.set(moduleId, {
          moduleId,
          moduleName: moduleName ?? moduleId,
          actions: new Set<string>(),
        });
      }
      if (action) {
        map.get(moduleId)!.actions.add(action);
      }
    }
    return Array.from(map.values()).map((v) => ({
      moduleId: v.moduleId,
      moduleName: v.moduleName,
      allowedActions: [...v.actions].sort(),
    }));
  }

  /**
   * Replaces join rows and ensures Permission + AuthModule rows exist.
   */
  private async syncRolePermissions(
    roleId: string,
    modules: RolePermissionModuleDto[],
  ): Promise<void> {
    await this.rolePermissionRepo.delete({ idRole: roleId });

    for (const mod of modules) {
      await this.ensureAuthModule(mod.moduleId, mod.moduleName);
      const actions = mod.allowedActions?.length
        ? mod.allowedActions
        : [];
      for (const rawAction of actions) {
        const action = rawAction.trim().toLowerCase();
        if (!action) {
          continue;
        }
        const name = buildPermissionKey(mod.moduleId, action);
        let perm = await this.permissionRepo.findOne({ where: { name } });
        if (!perm) {
          const authMod = await this.authModuleRepo.findOne({
            where: { id: mod.moduleId },
          });
          perm = this.permissionRepo.create({
            name,
            action,
            authModule: authMod ?? undefined,
          });
          await this.permissionRepo.save(perm);
        } else if (!perm.action) {
          perm.action = action;
          await this.permissionRepo.save(perm);
        }

        await this.rolePermissionRepo.save(
          this.rolePermissionRepo.create({
            idRole: roleId,
            idPermission: perm.id,
            expiresAt: null,
          }),
        );
      }
    }
  }

  /**
   * Upserts an auth module row used as FK for permissions.
   */
  private async ensureAuthModule(
    id: string,
    displayName?: string,
  ): Promise<void> {
    let mod = await this.authModuleRepo.findOne({ where: { id } });
    const fallback =
      displayName?.trim() ||
      DEFAULT_AUTH_MODULES.find((m) => m.id === id)?.name ||
      id;
    if (!mod) {
      await this.authModuleRepo.save(
        this.authModuleRepo.create({ id, name: fallback }),
      );
      return;
    }
    if (displayName?.trim() && mod.name !== displayName.trim()) {
      mod.name = displayName.trim();
      await this.authModuleRepo.save(mod);
    }
  }

  private toSubstituteResponse(
    s: AuthorizationSubstitute,
  ): SubstituteResponse {
    return {
      id: s.id,
      roleId: s.roleId,
      targetUserId: s.targetUserId,
      startDate: this.formatDateOnly(s.startDate),
      endDate: this.formatDateOnly(s.endDate),
      notes: s.notes ?? '',
    };
  }

  private formatDateOnly(value: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
  }
}
