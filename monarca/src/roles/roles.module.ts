/**
<<<<<<< Updated upstream
 * File: roles.module.ts
 * Description: Nest module that registers Roles and Permission entities (no controllers/providers).
 */

=======
 * Roles Module
 * 
 * Module for managing user roles and permissions.
 * Exports: RolesService, Roles entity, Permissions entity
 */
>>>>>>> Stashed changes
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Roles, Permission])],
  providers: [],
  exports: [],
})
export class RolesModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
