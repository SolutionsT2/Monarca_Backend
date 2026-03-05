/**
<<<<<<< Updated upstream
 * File: guards.module.ts
 * Description: Nest module that registers AuthGuard, PermissionsGuard, JWT config and User repository for route protection.
 */

=======
 * Guards Module
 * 
 * Module for authentication and permission guard implementations.
 * Exports: AuthGuard, PermissionsGuard
 */
>>>>>>> Stashed changes
import { Module } from '@nestjs/common';
import { JwtConfigModule } from 'src/jwt/jwt.config.module';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([User])],
  providers: [AuthGuard, PermissionsGuard],
  exports: [
    AuthGuard,
    PermissionsGuard,
    JwtConfigModule,
    TypeOrmModule.forFeature([User]),
  ],
})
export class GuardsModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
