/**
 * File: roles.module.ts
 * Description: Roles domain: entities, admin API, and substitute assignments.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';
import { RolePermission } from './entity/roles_permissions.entity';
import { AuthModuleEntity } from './entity/auth-module.entity';
import { AuthorizationSubstitute } from './entity/authorization-substitute.entity';
import { User } from 'src/users/entities/user.entity';
import { GuardsModule } from 'src/guards/guards.module';
import { RolesAdminService } from './roles-admin.service';
import { RolesAdminController } from './roles-admin.controller';
import { SubstitutesController } from './substitutes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Roles,
      Permission,
      RolePermission,
      AuthModuleEntity,
      AuthorizationSubstitute,
      User,
    ]),
    GuardsModule,
  ],
  controllers: [RolesAdminController, SubstitutesController],
  providers: [RolesAdminService],
  exports: [TypeOrmModule],
})
export class RolesModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-03-27 | Efren | Wired admin controllers, substitutes, and TypeORM feature set.
 */
