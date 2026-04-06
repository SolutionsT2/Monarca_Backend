/**
 * File: permissions.guard.ts
 * Description: Guard that loads the current user, computes effective (non-expired) permissions for their role, and enforces @Permissions metadata on the route.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators/permission.decorator';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestInterface } from './interfaces/request.interface';
import { EffectivePermissionsService } from 'src/roles/effective-permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly effectivePermissions: EffectivePermissionsService,
  ) {}

  /**
   * Allows the request when the user has every required permission and each assignment is not expired.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestInterface>();

    const userId = request.sessionInfo?.id;
    if (!userId) {
      throw new ForbiddenException('User session not found');
    }

    const user = await this.findById(userId);
    if (!user?.role) {
      throw new ForbiddenException('User or permissions not found');
    }

    request.sessionInfo.id = user.id;
    request.userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      last_name: user.lastName,
      status: user.status,
      id_department: user.idDepartment,
      id_role: user.idRole,
      id_travel_agency: user.idTravelAgency,
    };

    const userPermissions =
      await this.effectivePermissions.getEffectivePermissionNames(user);
    request.userPermissions = userPermissions;

    const permissionsRequired =
      this.reflector.getAllAndMerge<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (permissionsRequired.length === 0) {
      return true;
    }

    const requiredUnique = [...new Set(permissionsRequired)];
    const hasEveryPermission = requiredUnique.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasEveryPermission) {
      throw new ForbiddenException('Permission denied');
    }

    return true;
  }

  /**
   * Loads the user and role with join rows needed to evaluate expiry per permission.
   */
  private async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user;
  }
}

/*
Modification History:
- 2026-03-02: Added file header; removed commented debug code.
- 2026-03-27 | Efren | Permission-only checks via rolePermissions + expires_at; Reflector getAllAndMerge; rename repository.
- 2026-03-27 | Efren | Merge substitute role permissions via EffectivePermissionsService.
*/
