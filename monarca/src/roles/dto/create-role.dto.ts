/**
 * File: create-role.dto.ts
 * Description: Payload to create a role with granular permissions by module.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RolePermissionModuleDto } from './role-permission-module.dto';

export class CreateRoleDto {
  @ApiProperty({ example: 'Regional Approver' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [RolePermissionModuleDto], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionModuleDto)
  permissions?: RolePermissionModuleDto[];
}
