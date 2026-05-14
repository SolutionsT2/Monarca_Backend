/**
 * File: users.module.ts
 * Description: Module configuration for the users feature, managing imports,
 * controllers, and service providers.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserChecks } from './user.checks.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { HierarchyResolverService } from './hierarchy-resolver.service';
import { DepartmentsModule } from 'src/departments/departments.module';
import { RolesModule } from 'src/roles/roles.module';
import { Roles } from 'src/roles/entity/roles.entity';
import { CostCentersModule } from 'src/cost-centers/cost-centers.module';
import { GuardsModule } from 'src/guards/guards.module';

/**
 * UsersModule bundles everything related to user management,
 * verification, and organizational hierarchy resolution.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Roles]),
    DepartmentsModule,
    RolesModule,
    CostCentersModule,
    GuardsModule,
  ],
  controllers: [UsersController],
  providers: [UserChecks, UsersService, HierarchyResolverService],
  exports: [UserChecks, UsersService, HierarchyResolverService],
})
export class UsersModule {}

/*
 * Modification History:
 * - 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
 * - 2026-05-12 | Juan de Dios Gastélum | Added HierarchyResolverService for manager chain traversal.
 */