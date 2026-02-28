/*
 * update-request-log.dto.ts
 *
 * Data Transfer Object used for updating an existing
 * request log entry. Extends CreateRequestLogDto
 * making all fields optional.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateRequestLogDto } from './create-request-log.dto';

/**
 * DTO for updating a request log entry.
 * All properties are optional.
 */
export class UpdateRequestLogDto extends PartialType(CreateRequestLogDto) {}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added file documentation and class JSDoc.
*/
