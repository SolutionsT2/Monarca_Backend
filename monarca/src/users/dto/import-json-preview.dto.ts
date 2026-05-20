/**
 * File: import-json-preview.dto.ts
 * Description: DTO for the JSON-based employee import preview (Step 1, JSON variant).
 *              The payload mirrors the columns expected in the Excel template so the
 *              same business validation pipeline can be reused.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ImportJsonEmployeeDto {
  @ApiProperty({ example: '001' })
  @IsString()
  noEmpleado: string;

  @ApiProperty({ example: 'María López' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'mlopez', required: false, nullable: true })
  @IsOptional()
  @IsString()
  usuario?: string | null;

  @ApiProperty({
    example: 'mlopez@empresa.com',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiProperty({ example: 'MKT-01' })
  @IsString()
  ceco: string;

  @ApiProperty({ example: '002', required: false, nullable: true })
  @IsOptional()
  @IsString()
  jefeInmediato?: string | null;

  @ApiProperty({ example: '20000000008', required: false, nullable: true })
  @IsOptional()
  @IsString()
  proveedor?: string | null;

  @ApiProperty({ example: 'A', required: false, nullable: true })
  @IsOptional()
  @IsString()
  status?: string | null;

  @ApiProperty({ example: '2026-01-15', required: false, nullable: true })
  @IsOptional()
  @IsString()
  fechaAlta?: string | null;

  @ApiProperty({ example: '2026-04-10', required: false, nullable: true })
  @IsOptional()
  @IsString()
  fechaCambio?: string | null;
}

export class ImportJsonPreviewDto {
  @ApiProperty({ type: [ImportJsonEmployeeDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportJsonEmployeeDto)
  employees: ImportJsonEmployeeDto[];
}
