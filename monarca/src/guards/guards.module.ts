/**
 * File: guards.module.ts
 * Description: Nest module that registers AuthGuard, PermissionsGuard, JWT config and User repository for route protection.
 */

import { Module } from '@nestjs/common';
import { JwtConfigModule } from 'src/jwt/jwt.config.module';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { RolesCoreModule } from 'src/roles/roles-core.module';

@Module({
  imports: [
    JwtConfigModule,
    RolesCoreModule,
    TypeOrmModule.forFeature([User]),
  ],
  providers: [AuthGuard, PermissionsGuard],
  exports: [
    AuthGuard,
    PermissionsGuard,
    JwtConfigModule,
    RolesCoreModule,
    TypeOrmModule.forFeature([User]),
  ],
})
export class GuardsModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-03-27 | Efren | Import RolesCoreModule for EffectivePermissionsService.
 */
