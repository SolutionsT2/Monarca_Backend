/**
 * File: approval-rules.dto.ts
 * Description: DTOs for creating, updating, and resolving approval rules.
 */

import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsIn,
  IsNumber,
  IsUUID,
  Min,
  Max,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateConditionDto {
  @IsString()
  @IsIn(['trip_type', 'cost', 'priority'])
  field: string;

  @IsString()
  @IsIn(['gt', 'lt', 'gte', 'lte', 'eq'])
  @IsOptional()
  operator?: string;

  @IsString()
  value: string;
}

export class CreateStepDto {
  @IsNumber()
  @Min(1)
  order: number;

  @IsString()
  @IsIn(['role', 'hierarchy'])
  stepType: 'role' | 'hierarchy';

  // Required when stepType === 'role'
  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => o.stepType === 'role')
  idRole?: string;

  // Required when stepType === 'hierarchy'; capped at 10 levels
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  @ValidateIf((o) => o.stepType === 'hierarchy')
  hierarchyLevel?: number;

  @IsNumber()
  @Min(1)
  minApprovals: number;
}

export class CreateApprovalRuleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConditionDto)
  conditions: CreateConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  steps: CreateStepDto[];
}

export class UpdateApprovalRuleDto extends PartialType(CreateApprovalRuleDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Payload for resolving who would approve a request given the request context.
 */
export class ResolveApproversDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  tripType?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  priority?: string;
}

/*
 * Modification History:
 * - 2026-05-12 | Juan de Dios Gastélum | Initial file creation.
 */
