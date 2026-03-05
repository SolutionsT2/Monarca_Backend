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

interface SessionInfo {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * AuthGuard
 * 
 * Guard for validating JWT tokens from HTTP cookies.
 * Verifies token authenticity and attaches session information to requests.
 * 
 * @implements CanActivate
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request & {
      sessionInfo: SessionInfoInterface;
    };

    const token = request.cookies['sessionInfo'];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
<<<<<<< Updated upstream
      request.sessionInfo = payload as SessionInfoInterface;
=======
      request.sessionInfo = payload; // Attach user to the request
>>>>>>> Stashed changes
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
