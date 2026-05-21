import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PreviewCostCenterRowDto {
  @ApiProperty({ example: 2, nullable: true })
  row: number;

  @ApiProperty({ example: 100, nullable: true })
  numericId?: number | null;

  @ApiProperty({ example: '100', nullable: true })
  key?: string | null;

  @ApiProperty({ example: 'Mercadeo' })
  name: string;

  @ApiProperty({ example: false })
  isUpdate: boolean;

  @ApiProperty({ example: [], type: [String] })
  validationErrors: string[];
}

export class PreviewCostCentersResponseDto {
  @ApiProperty({ type: [PreviewCostCenterRowDto] })
  costCenters: PreviewCostCenterRowDto[];

  @ApiProperty({ example: 12 })
  totalRows: number;

  @ApiProperty({ example: 10 })
  validRows: number;

  @ApiProperty({ example: 2 })
  errorRows: number;
}

export class ConfirmCostCenterRowDto {
  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsInt()
  row?: number;

  @ApiProperty({ example: 100, required: false, nullable: true })
  @IsOptional()
  numericId?: number | null;

  @ApiProperty({ example: '100', required: false, nullable: true })
  @IsOptional()
  @IsString()
  key?: string | null;

  @ApiProperty({ example: 'Mercadeo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isUpdate?: boolean;

  @ApiProperty({ example: [], type: [String], required: false })
  @IsOptional()
  validationErrors?: string[];
}

export class ConfirmCostCentersDto {
  @ApiProperty({ type: [ConfirmCostCenterRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmCostCenterRowDto)
  costCenters: ConfirmCostCenterRowDto[];
}
