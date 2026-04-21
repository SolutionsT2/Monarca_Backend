/**
 * File: login.dto.ts
 * Description: Data transfer object for login credentials.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LogInDTO {
  @ApiProperty({ example: 'juan@gmail.com' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(5)
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  password: string;
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
