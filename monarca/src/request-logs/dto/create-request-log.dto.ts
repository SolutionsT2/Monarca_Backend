/*
 * create-requestlog.dto.ts
 *
 * Data Transfer Object used for creating a new request log entry.
 * Defines validation rules and API documentation metadata
 * for request status change tracking.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsDateString, IsOptional } from 'class-validator';

/**
 * DTO for creating a request log entry.
 * Used to validate and document incoming data when
 * registering a status change for a request.
 */
export class CreateRequestLogDto {
  @ApiProperty({
    description: 'Request being logged',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  id_request: string;

  @ApiProperty({
    description: 'User who made the change',
    example: 'user-uuid-666',
  })
  @IsUUID()
  id_user: string;

  @ApiProperty({
    description: 'Descriptive report of the change (e.g., "Editó")',
    example: 'Editó',
    required: false,
  })
  @IsOptional()
  @IsString()
  report?: string;

  @ApiProperty({
    description: 'Status after the change',
    example: 'approved',
  })
  @IsString()
  new_status: string;

  @ApiProperty({
    description: 'Date and time when the change occurred',
    example: '2025-04-17T22:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  change_date?: string;
}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added documentation header, class JSDoc, and standardized example values to English.
*/
