/**
 * File: import-preview.dto.ts
 * Description: DTOs for the Excel import preview step (Step 1). Returns parsed employee data and available roles.
 */

import { ApiProperty } from '@nestjs/swagger';

export class PreviewEmployeeDto {
  @ApiProperty({ example: 2 })
  row: number;

  @ApiProperty({ example: 'Emp001' })
  employeeNumber: string;

  @ApiProperty({ example: 'Gabriela' })
  name: string;

  @ApiProperty({ example: 'Peniche' })
  lastName: string;

  @ApiProperty({ example: 'gpeniche', nullable: true })
  username: string | null;

  @ApiProperty({ example: null, nullable: true })
  email: string | null;

  @ApiProperty({ example: '20000000008', nullable: true })
  supplierNumber: string | null;

  @ApiProperty({ nullable: true })
  departmentId: string | null;

  @ApiProperty({ example: 'Mercadeo', nullable: true })
  departmentName: string | null;

  @ApiProperty({ example: 'Emp001', nullable: true })
  bossEmployeeNumber: string | null;

  @ApiProperty({ example: 'active' })
  availabilityStatus: string;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z', nullable: true })
  signupDate: string | null;

  @ApiProperty({ example: '2026-04-10T00:00:00.000Z', nullable: true })
  lastchangeDate: string | null;

  @ApiProperty({ example: false })
  isUpdate: boolean;

  @ApiProperty({ example: [], type: [String] })
  validationErrors: string[];

  @ApiProperty({
    example: 'b0d4211d-457e-4d84-b8a4-320af380683f',
    nullable: true,
    description: 'Auto-suggested role UUID: Aprobador if this employee is a manager in the batch, otherwise Solicitante.',
  })
  suggestedRoleId: string | null;
}

export class PreviewResponseDto {
  @ApiProperty({ type: [PreviewEmployeeDto] })
  employees: PreviewEmployeeDto[];

  @ApiProperty({ example: [{ id: 'uuid', name: 'Solicitante' }] })
  availableRoles: { id: string; name: string }[];

  @ApiProperty({ example: 12 })
  totalRows: number;

  @ApiProperty({ example: 10 })
  validRows: number;

  @ApiProperty({ example: 2 })
  errorRows: number;
}
