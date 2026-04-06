/**
 * File: role-permission-module.dto.ts
 * Description: Permission bundle per module for roles API request/response bodies.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional } from 'class-validator';

export class RolePermissionModuleDto {
  @ApiProperty({ example: 'mod_travel' })
  @IsString()
  moduleId: string;

  @ApiProperty({ example: 'Solicitudes de Viaje', required: false })
  @IsString()
  @IsOptional()
  moduleName?: string;

  @ApiProperty({ example: ['create', 'read', 'update', 'delete', 'approve'] })
  @IsArray()
  @IsString({ each: true })
  allowedActions: string[];
}
