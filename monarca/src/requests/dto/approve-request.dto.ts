/*
 * approve-request.dto.ts
 *
 * Data Transfer Object used to approve a request
 * by assigning a travel agency.
 * Includes validation and API documentation metadata.
 */

import { ApiProperty } from '@nestjs/swagger';

import { IsUUID } from 'class-validator';

/**
 * DTO for approving a request.
 * Requires the identifier of the assigned travel agency.
 */
export class ApproveRequestDTO {
  @ApiProperty({
    description: 'Travel Agency Id',
    example: 'travel-agency-uuid-000',
  })
  @IsUUID()
  id_travel_agency: string;
}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added documentation header and class JSDoc.
*/
