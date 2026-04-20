import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRefundPolicyRuleDto {
  @ApiProperty({ example: 'ALIF' })
  @IsString()
  @IsNotEmpty()
  expense_class!: string;

  @ApiProperty({ example: 'MISSING_XML' })
  @IsString()
  @IsNotEmpty()
  operator!: string;

  @ApiProperty({ example: 5000, required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  threshold_value?: number | null;

  @ApiProperty({ example: 'MXN', required: false, nullable: true })
  @IsOptional()
  @IsString()
  threshold_unit?: string | null;

  @ApiProperty({ example: 'POLICY_VIOLATION', required: false, default: 'POLICY_VIOLATION' })
  @IsOptional()
  @IsString()
  consequence?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateRefundPolicyDto {
  @ApiProperty({ example: 'Politica de Reembolso Hotel' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Reglas para comprobacion de hospedaje', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    example: '9f4e4bfa-8e0d-4f2b-a3f1-4ef0d2db4a11',
    required: false,
    description: 'Required for SuperAdmin. Ignored for CompanyAdmin.',
  })
  @IsOptional()
  @IsUUID()
  id_company?: string;

  @ApiProperty({ type: [CreateRefundPolicyRuleDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRefundPolicyRuleDto)
  rules?: CreateRefundPolicyRuleDto[];
}

export class UpdateRefundPolicyDto extends PartialType(CreateRefundPolicyDto) {}
