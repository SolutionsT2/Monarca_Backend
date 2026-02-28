/**
 * File: users.module.ts
 * Description: Module configuration for the users feature, managing imports, controllers, and service providers.
 */
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserChecks } from './user.checks.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DepartmentsModule } from 'src/departments/departments.module';
import { RolesModule } from 'src/roles/roles.module';

/**
 * UsersModule bundles everything related to user management and verification.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), DepartmentsModule, RolesModule],
  controllers: [UsersController],
  providers: [UserChecks, UsersService],
  exports: [UserChecks, UsersService],
})
export class UsersModule {}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
*/