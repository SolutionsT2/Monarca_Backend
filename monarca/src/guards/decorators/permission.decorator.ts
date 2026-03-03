/**
 * File: permission.decorator.ts
 * Description: Decorator to attach required permission names to a route handler; used by PermissionsGuard.
 */

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
