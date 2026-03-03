/**
 * File: create-revision.dto.ts
 * Description: DTO for creating a revision (request id and comment), with Swagger and validation.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsInt,
  IsDateString,
  ValidateNested,
} from 'class-validator';

export class CreateRevisionDto {
  @ApiProperty({
    description: 'Request id',
    example: 'request-uuid-000',
  })
  @IsUUID()
  id_request: string;

  @ApiProperty({
    description: 'Comments on the request',
    example: 'Change the last destination to LA.',
  })
  @IsString()
  comment: string;
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
