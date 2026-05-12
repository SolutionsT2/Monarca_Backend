/**
 * File: import-result.dto.ts
 * Description: DTO for the final result of the Excel import confirmation (Step 2 response).
 */

import { ApiProperty } from '@nestjs/swagger';

export class ImportErrorDto {
  @ApiProperty({ example: 'Emp003' })
  employeeNumber: string;

  @ApiProperty({ example: 'Department not found' })
  message: string;
}

export class ImportResultDto {
  @ApiProperty({ example: 8 })
  created: number;

  @ApiProperty({ example: 2 })
  updated: number;

  @ApiProperty({ type: [ImportErrorDto] })
  errors: ImportErrorDto[];
}
