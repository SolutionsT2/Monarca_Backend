import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateCostCenterDto {
  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsInt({ message: 'El ID numérico debe ser un número entero' })
  @Min(1, { message: 'El ID numérico debe ser mayor a 0' })
  numericId?: number;

  @ApiProperty({ example: '100', required: false })
  @IsOptional()
  @IsString({ message: 'La clave debe ser texto' })
  @Length(1, 10, { message: 'La clave debe tener entre 1 y 10 caracteres' })
  key?: string;

  @ApiProperty({ example: 'Mercadeo' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del centro de costos es obligatorio' })
  name: string;
}

export class UpdateCostCenterDto extends PartialType(CreateCostCenterDto) {}

export class UpdateDepartmentCostCenterDto {
  @ApiProperty({ example: 100 })
  @IsInt({ message: 'El centro de costos debe ser un número entero' })
  @Min(1, { message: 'El centro de costos debe ser mayor a 0' })
  cost_center_id!: number;
}
