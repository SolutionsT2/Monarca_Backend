/**
 * File: update-destination.dto.ts
 * Description: Data transfer object for partial updates of destinations.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateDestinationDto } from './create-destination.dto';

export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
