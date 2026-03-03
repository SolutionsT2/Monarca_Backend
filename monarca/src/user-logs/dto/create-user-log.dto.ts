/**
 * File: create-user-log.dto.ts
 * Description: DTO for creating a user log (user, date, ip, report), with Swagger.
 */

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserLogDto {
  @ApiProperty({ example: 1 })
  id_user: number;

  @ApiProperty({ example: '2023-12-01T10:00:00Z' })
  date: Date;

  @ApiProperty({ example: '192.168.1.1' })
  ip: string;

  @ApiProperty({ example: 'User accessed the dashboard' })
  report: string;
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
