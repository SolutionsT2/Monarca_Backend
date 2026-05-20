import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import {
  normalizeIdentifierInput,
  normalizeTextInput,
} from '../bank-account-identifier';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'Main Treasury Account' })
  @IsString()
  @Length(2, 100)
  @Transform(({ value }) => normalizeTextInput(value))
  name!: string;

  @ApiProperty({ example: 'Mexico' })
  @IsString()
  @Length(2, 100)
  @Transform(({ value }) => normalizeTextInput(value))
  country!: string;

  @ApiProperty({ example: 'North America' })
  @IsString()
  @Length(2, 100)
  @Transform(({ value }) => normalizeTextInput(value))
  region!: string;

  @ApiProperty({ example: 'Custom Region', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Transform(({ value }) => normalizeTextInput(value))
  regionOther?: string;

  @ApiProperty({ example: 'GB82WEST12345698765432' })
  @IsString()
  @Length(4, 100)
  @Transform(({ value }) => normalizeIdentifierInput(value))
  iban!: string;
}

export class UpdateBankAccountDto extends PartialType(CreateBankAccountDto) {}
