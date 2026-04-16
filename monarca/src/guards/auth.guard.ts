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
import { JwtService } from '@nestjs/jwt';
import { SessionInfoInterface } from './interfaces/sessionInfo.interface';
import { RequestInterface } from './interfaces/request.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestInterface>();

    const token = request.cookies?.sessionInfo as string | undefined;
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<SessionInfoInterface>(token);
      request.sessionInfo = payload as SessionInfoInterface;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header; removed commented debug code; use SessionInfoInterface for request typing.
 */
