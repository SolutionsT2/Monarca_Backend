/**
 * File: create-substitute.dto.ts
 * Description: Payload to register a person-to-person substitute assignment.
 * originalUserId is the approver delegating their authority.
 */

import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateSubstituteDto {
  @IsUUID()
  originalUserId: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsUUID()
  targetUserId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/*
Modification History:
- 2026-03-27 | Efren | Initial implementation.
- 2026-05-12 | Juan de Dios Gastélum | Added originalUserId, made roleId optional.
*/
