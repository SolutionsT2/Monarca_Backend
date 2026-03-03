/**
 * File: update-user-log.dto.ts
 * Description: DTO for updating a user log (partial of create), with Swagger.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateUserLogDto } from './create-user-log.dto';

export class UpdateUserLogDto extends PartialType(CreateUserLogDto) {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
