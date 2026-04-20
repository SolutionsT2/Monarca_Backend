/**
 * File: jwt.config.module.ts
 * Description: Nest module that configures JWT (secret and token expiry) for use by AuthGuard and login/register services.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/** Dev-only default so login does not 500 when .env was copied from .env.example with an empty JWT_SECRET. */
const jwtSecret =
  process.env.JWT_SECRET?.trim() || 'monarca-dev-jwt-secret-not-for-production';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
