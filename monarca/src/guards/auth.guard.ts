/**
 * File: auth.guard.ts
 * Description: Guard that validates the JWT session cookie and attaches the session payload to the request.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { SessionInfoInterface } from './interfaces/sessionInfo.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request & {
      sessionInfo: SessionInfo;
    };

    const token = request.cookies['sessionInfo'];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.sessionInfo = payload as SessionInfo;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header; removed commented debug code; use SessionInfoInterface for request typing.
 */
