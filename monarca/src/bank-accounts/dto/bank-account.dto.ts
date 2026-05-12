import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'Main Treasury Account' })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiProperty({ example: 'Mexico' })
  @IsString()
  @Length(2, 100)
  country!: string;

  @ApiProperty({ example: 'North America' })
  @IsString()
  @Length(2, 100)
  region!: string;

  @ApiProperty({ example: 'GB82WEST12345698765432' })
  @IsString()
  @Length(15, 34)
  @Matches(/^[A-Za-z0-9]+$/)
  iban!: string;
}

export class UpdateBankAccountDto extends PartialType(CreateBankAccountDto) {}
