/**
 * File: import-confirm.dto.ts
 * Description: DTOs for the Excel import confirmation step (Step 2). Admin sends back employees with assigned roles.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ConfirmEmployeeDto {
  @ApiProperty({ example: 'Emp001' })
  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @ApiProperty({ example: 'Gabriela' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Peniche' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'gpeniche', nullable: true })
  @IsOptional()
  @IsString()
  username: string | null;

  @ApiProperty({ example: null, nullable: true })
  @IsOptional()
  @IsString()
  email: string | null;

  @ApiProperty({ example: '20000000008', nullable: true })
  @IsOptional()
  @IsString()
  supplierNumber: string | null;

  @ApiProperty()
  @IsUUID()
  departmentId: string;

  @ApiProperty({ example: 'Emp001', nullable: true })
  @IsOptional()
  @IsString()
  bossEmployeeNumber: string | null;

  @ApiProperty({ example: 'active' })
  @IsString()
  @IsNotEmpty()
  availabilityStatus: string;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsString()
  signupDate: string | null;

  @ApiProperty({ example: '2026-04-10T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsString()
  lastchangeDate: string | null;

  @ApiProperty({ description: 'Admin-assigned role UUID' })
  @IsUUID()
  idRole: string;
}

export class ConfirmImportDto {
  @ApiProperty({ type: [ConfirmEmployeeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmEmployeeDto)
  employees: ConfirmEmployeeDto[];
}
