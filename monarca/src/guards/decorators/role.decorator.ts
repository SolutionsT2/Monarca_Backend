/**
 * File: role.decorator.ts
 * Description: Decorator to attach required role names to a route handler for role-based access.
 */

import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
