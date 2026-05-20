import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PreviewBankAccountRowDto {
  @ApiProperty({ example: 2 })
  row: number;

  @ApiProperty({ example: 'Treasury Account' })
  name: string;

  @ApiProperty({ example: 'Mexico' })
  country: string;

  @ApiProperty({ example: 'North America' })
  region: string;

  @ApiProperty({ example: 'Custom region', nullable: true, required: false })
  regionOther?: string | null;

  @ApiProperty({ example: 'GB82WEST12345698765432', nullable: true })
  iban: string;

  @ApiProperty({ example: 'IBAN', nullable: true })
  identifierType: string | null;

  @ApiProperty({ example: false })
  isUpdate: boolean;

  @ApiProperty({ example: [], type: [String] })
  validationErrors: string[];
}

export class PreviewBankAccountsResponseDto {
  @ApiProperty({ type: [PreviewBankAccountRowDto] })
  accounts: PreviewBankAccountRowDto[];

  @ApiProperty({ example: 12 })
  totalRows: number;

  @ApiProperty({ example: 10 })
  validRows: number;

  @ApiProperty({ example: 2 })
  errorRows: number;
}

export class ConfirmBankAccountRowDto {
  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  row?: number;

  @ApiProperty({ example: 'Treasury Account' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Mexico' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'North America' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({ example: 'Custom region', required: false, nullable: true })
  @IsOptional()
  @IsString()
  regionOther?: string | null;

  @ApiProperty({ example: 'GB82WEST12345698765432' })
  @IsString()
  @IsNotEmpty()
  iban: string;

  @ApiProperty({ example: 'IBAN', nullable: true, required: false })
  @IsOptional()
  identifierType?: string | null;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isUpdate?: boolean;

  @ApiProperty({ example: [], type: [String], required: false })
  @IsOptional()
  validationErrors?: string[];
}

export class ConfirmBankAccountsDto {
  @ApiProperty({ type: [ConfirmBankAccountRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmBankAccountRowDto)
  accounts: ConfirmBankAccountRowDto[];
}
