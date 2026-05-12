/**
 * File: users.module.ts
 * Description: Module configuration for the users feature, managing imports, controllers, and service providers.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserChecks } from './user.checks.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DepartmentsModule } from 'src/departments/departments.module';
import { RolesModule } from 'src/roles/roles.module';
import { Roles } from 'src/roles/entity/roles.entity';
import { CostCentersModule } from 'src/cost-centers/cost-centers.module';
import { GuardsModule } from 'src/guards/guards.module';

/**
 * UsersModule bundles everything related to user management and verification.
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
  providers: [UserChecks, UsersService],
  exports: [UserChecks, UsersService],
})
export class UsersModule {}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
*/
