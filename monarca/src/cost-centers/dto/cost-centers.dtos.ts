import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateCostCenterDto {
  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  numericId?: number;

  @ApiProperty({ example: '100', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  key?: string;

  @ApiProperty({ example: 'Mercadeo' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateCostCenterDto extends PartialType(CreateCostCenterDto) {}
