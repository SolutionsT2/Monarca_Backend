import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

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
}