/**
 * File: jwt.config.module.ts
 * Description: Nest module that configures JWT (secret and token expiry) for use by AuthGuard and login/register services.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
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
