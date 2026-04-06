/**
 * File: create-substitute.dto.ts
 * Description: Payload to register a temporary permission overlay for a user from another role.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class CreateSubstituteDto {
  @ApiProperty()
  @IsUUID()
  roleId: string;

  @ApiProperty()
  @IsUUID()
  targetUserId: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @ApiProperty({ example: '2026-01-20' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(0)
  notes?: string;
}
