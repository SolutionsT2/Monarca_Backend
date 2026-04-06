/**
 * File: roles-core.module.ts
 * Description: Shared TypeORM registrations and EffectivePermissionsService (no HTTP surface).
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationSubstitute } from './entity/authorization-substitute.entity';
import { EffectivePermissionsService } from './effective-permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorizationSubstitute])],
  providers: [EffectivePermissionsService],
  exports: [TypeOrmModule, EffectivePermissionsService],
})
export class RolesCoreModule {}

/*
Modification History:
- 2026-03-27 | Efren | Initial creation to avoid circular imports between guards and admin API.
*/
