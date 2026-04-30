/**
 * File: email-action.service.ts
 * Description: Generates and verifies short-lived JWT tokens embedded in email action links.
 * Used to allow SOI to approve requests directly from email without logging in.
 */

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type EmailActionPayload = {
  requestId: string;
  action: 'soi-approve';
  userId: string;
};

@Injectable()
export class EmailActionService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generates a signed JWT token for an email action link.
   * Expires in 24 hours.
   */
  generateActionToken(payload: EmailActionPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '24h' });
  }

  /**
   * Verifies and decodes an email action token.
   * Returns null if invalid or expired.
   */
  verifyActionToken(token: string): EmailActionPayload | null {
    try {
      return this.jwtService.verify<EmailActionPayload>(token);
    } catch {
      return null;
    }
  }
}

