/**
 * File: approver-substitute.middleware.ts
 * Description: Middleware that applies approver substitution for request approval routes.
 */

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { ApproverSubstituteService } from '../services/approver-substitute.service';

type SessionPayload = {
  id?: string;
};

@Injectable()
export class ApproverSubstituteMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApproverSubstituteMiddleware.name);

  constructor(
    private readonly substituteService: ApproverSubstituteService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      // For list endpoint, pre-reconcile requests to make them visible to the substitute approver.
      if (req.method === 'GET') {
        const userId = await this.extractUserIdFromCookie(req);
        if (userId) {
          await this.substituteService.reassignPendingForSubstituteUser(userId);
        }
      }

      // For action endpoints, ensure the specific request has current approver resolved.
      const requestId = req.params?.id;
      if (requestId) {
        await this.substituteService.reassignRequestIfNeeded(requestId);
      }
    } catch (error) {
      this.logger.error(
        'Approver substitution middleware failed. Continuing request processing.',
        error instanceof Error ? error.stack : undefined,
      );
    }

    next();
  }

  private async extractUserIdFromCookie(req: Request): Promise<string | null> {
    const token = (req as any).cookies?.sessionInfo as string | undefined;
    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<SessionPayload>(token);
      return payload?.id ?? null;
    } catch {
      return null;
    }
  }
}

/*
Modification History:
- 2026-04-16 | AI Assistant | Initial middleware for request approver substitution.
*/
