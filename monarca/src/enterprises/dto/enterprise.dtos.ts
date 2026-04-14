import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Enterprise } from '../entities/enterprise.entity';

export class CreateEnterpriseDepartmentDto {
  @ApiProperty({ example: 'Sistemas' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 102 })
  @IsInt()
  cost_center_id!: number;
}

export class CreateEnterpriseDto {
  @ApiProperty({ example: 'Monarca Corp' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'MXN' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ type: [CreateEnterpriseDepartmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateEnterpriseDepartmentDto)
  departments!: CreateEnterpriseDepartmentDto[];
}

export class UpdateEnterpriseDto extends PartialType(CreateEnterpriseDto) {}

export class EnterpriseDto extends OmitType(Enterprise, []) {}
