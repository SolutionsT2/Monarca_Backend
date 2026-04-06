/**
 * File: patch-role-permissions.dto.ts
 * Description: Body for PATCH /roles/:id/permissions — replaces the role permission matrix.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RolePermissionModuleDto } from './role-permission-module.dto';

export class PatchRolePermissionsDto {
  @ApiProperty({ type: [RolePermissionModuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionModuleDto)
  permissions: RolePermissionModuleDto[];
}
