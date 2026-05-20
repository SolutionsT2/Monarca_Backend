import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';

export class PreviewDepartmentRowDto {
  @ApiProperty({ example: 2 })
  row: number;

  @ApiProperty({ example: 'Sistemas' })
  name: string;

  @ApiProperty({ example: 100 })
  cost_center_id: number;

  @ApiProperty({ example: 'Mercadeo', nullable: true })
  costCenterName: string | null;

  @ApiProperty({ example: false })
  isUpdate: boolean;

  @ApiProperty({ example: [], type: [String] })
  validationErrors: string[];
}

export class PreviewDepartmentsResponseDto {
  @ApiProperty({ type: [PreviewDepartmentRowDto] })
  departments: PreviewDepartmentRowDto[];

  @ApiProperty({ example: 12 })
  totalRows: number;

  @ApiProperty({ example: 10 })
  validRows: number;

  @ApiProperty({ example: 2 })
  errorRows: number;
}

export class ConfirmDepartmentRowDto {
  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsInt()
  row?: number;

  @ApiProperty({ example: 'Sistemas' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  cost_center_id: number;

  @ApiProperty({ example: 'Mercadeo', nullable: true, required: false })
  @IsOptional()
  costCenterName?: string | null;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isUpdate?: boolean;

  @ApiProperty({ example: [], type: [String], required: false })
  @IsOptional()
  validationErrors?: string[];
}

export class ConfirmDepartmentsDto {
  @ApiProperty({ type: [ConfirmDepartmentRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmDepartmentRowDto)
  departments: ConfirmDepartmentRowDto[];
}
