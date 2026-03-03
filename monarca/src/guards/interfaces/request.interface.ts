/**
 * File: request.interface.ts
 * Description: Extended Express Request type with session, user info and permissions set by auth/permission guards.
 */

import { Request } from 'express';
import { SessionInfoInterface } from './sessionInfo.interface';
import { UserInfoInterface } from './userInfo.interface';

export type RequestInterface = Request & {
  sessionInfo: SessionInfoInterface;
  userPermissions?: string[];
  userInfo: UserInfoInterface;
};

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
