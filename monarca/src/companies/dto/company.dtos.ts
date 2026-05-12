import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Company } from '../entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';

export class CreateCompanyAdminDto {
  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'One' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'secure-password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'admin.acme' })
  @IsString()
  username?: string;
}

export class CreateCompanyDto {
  @ApiProperty({ example: 'ACME' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  key!: string;

  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'MXN' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  localCurrency!: string;

  @ApiProperty({ type: CreateCompanyAdminDto })
  @ValidateNested()
  @Type(() => CreateCompanyAdminDto)
  admin!: CreateCompanyAdminDto;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CompanyDto extends OmitType(Company, []) {}

export class CreateCompanyDepartmentDto {
  @ApiProperty({ example: 'Sistemas' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  cost_center_id!: number;
}

export class UpdateCompanyDepartmentCostCenterDto {
  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  cost_center_id!: number;
}

export class CompanyDepartmentDto extends OmitType(Department, ['users']) {}
