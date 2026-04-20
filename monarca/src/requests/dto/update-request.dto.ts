/*
 * update-request.dto.ts
 *
 * Data Transfer Object used for updating an existing request.
 * Extends CreateRequestDto making all properties optional.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateRequestDto } from './create-request.dto';

/**
 * DTO for updating a request.
 * All properties are optional.
 */
export class UpdateRequestDto extends CreateRequestDto {}

/**
 * DTO for updating a request.
 * All properties are optional.
 */
