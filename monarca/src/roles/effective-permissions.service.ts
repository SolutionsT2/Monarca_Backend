/**
 * File: effective-permissions.service.ts
 * Description: Computes permission names for a user from their role plus active substitute overlays.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { AuthorizationSubstitute } from './entity/authorization-substitute.entity';
import { getActivePermissionsForRole } from './utils/active-permissions.util';
import { Permission } from './entity/permissions.entity';

@Injectable()
export class EffectivePermissionsService {
  constructor(
    @InjectRepository(AuthorizationSubstitute)
    private readonly substituteRepo: Repository<AuthorizationSubstitute>,
  ) {}

  /**
   * Returns distinct permission keys (permissions.name) for guards and APIs.
   */
  async getEffectivePermissionNames(user: User): Promise<string[]> {
    const merged = await this.getActivePermissionsForUser(user);
    return [...new Set(merged.map((p) => p.name))];
  }

  /**
   * Returns Permission rows that are effective for the user right now (role + active substitutes).
   */
  async getActivePermissionsForUser(user: User): Promise<Permission[]> {
    const base = getActivePermissionsForRole(user.role);
    const byId = new Map<string, Permission>();
    for (const p of base) {
      byId.set(String(p.id), p);
    }

    if (!user.id) {
      return [...byId.values()];
    }

    const subs = await this.substituteRepo.find({
      where: { targetUserId: user.id },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
        'role.rolePermissions.permission.authModule',
      ],
    });

    const today = new Date().toISOString().slice(0, 10);
    for (const sub of subs) {
      const start = this.toDateString(sub.startDate);
      const end = this.toDateString(sub.endDate);
      if (start > today || end < today) {
        continue;
      }
      for (const p of getActivePermissionsForRole(sub.role)) {
        byId.set(String(p.id), p);
      }
    }

    return [...byId.values()];
  }

  private toDateString(value: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
  }
}

/*
Modification History:
- 2026-03-27 | Efren | Initial creation for PermissionsGuard and profile parity.
*/
