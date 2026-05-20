import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { Transform, Expose } from 'class-transformer';

export class CreateAccountingAccountDto {
  @ApiProperty({ example: '1002' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  key: string;

  @ApiProperty({ example: 'Gasto de viaje' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: true, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiresCostCenter?: boolean;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', nullable: true })
  @IsOptional()
  @IsString()
  @Length(36, 36)
  idBankAccount?: string | null;
}

export class UpdateAccountingAccountDto extends PartialType(CreateAccountingAccountDto) {}