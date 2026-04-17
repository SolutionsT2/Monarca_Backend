import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { Company } from '../entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';

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
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CompanyDto extends OmitType(Company, []) {}

export class CreateCompanyDepartmentDto {
  @ApiProperty({ example: 'Sistemas' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'a1f4e0e1-1b89-4ccf-9e57-43f4b3d1a001' })
  @IsUUID()
  cost_center_id!: string;
}

export class CompanyDepartmentDto extends OmitType(Department, ['users']) {}
