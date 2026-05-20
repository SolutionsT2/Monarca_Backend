import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class PreviewAccountingAccountRowDto {
  @ApiProperty({ example: 2, nullable: true })
  row: number;

  @ApiProperty({ example: '1002', nullable: true })
  key?: string | null;

  @ApiProperty({ example: 'Gasto de viaje', nullable: true })
  description?: string | null;

  @ApiProperty({ example: false })
  requiresCostCenter?: boolean;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', nullable: true })
  idBankAccount?: string | null;

  @ApiProperty({ example: 'Cuenta principal MXN', nullable: true })
  bankAccountName?: string | null;

  @ApiProperty({ example: false })
  isUpdate: boolean;

  @ApiProperty({ example: [], type: [String] })
  validationErrors: string[];
}

export class PreviewAccountingAccountsResponseDto {
  @ApiProperty({ type: [PreviewAccountingAccountRowDto] })
  accounts: PreviewAccountingAccountRowDto[];

  @ApiProperty({ example: 12 })
  totalRows: number;

  @ApiProperty({ example: 10 })
  validRows: number;

  @ApiProperty({ example: 2 })
  errorRows: number;
}

export class ConfirmAccountingAccountRowDto {
  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsInt()
  row?: number;

  @ApiProperty({ example: '1002' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Gasto de viaje' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  requiresCostCenter?: boolean;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  idBankAccount?: string | null;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isUpdate?: boolean;

  @ApiProperty({ example: [], type: [String], required: false })
  @IsOptional()
  validationErrors?: string[];
}

export class ConfirmAccountingAccountsDto {
  @ApiProperty({ type: [ConfirmAccountingAccountRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmAccountingAccountRowDto)
  accounts: ConfirmAccountingAccountRowDto[];
}
