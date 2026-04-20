/**
 * File: roles.module.ts
 * Description: Nest module that registers Roles and Permission entities (no controllers/providers).
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Roles, Permission])],
  providers: [],
  exports: [TypeOrmModule],
})
export class RolesModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
