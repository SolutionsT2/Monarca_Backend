/**
 * File: permissions.helper.ts
 * Description: Helper functions to check if the current request has specific permissions (used after PermissionsGuard).
 */

/**
 * Returns whether the request has the given permission.
 */
export function hasPermission(req: any, permissionName: string): boolean {
  return req.userPermissions?.includes(permissionName) || false;
}

/**
 * Returns whether the request has at least one of the given permissions.
 */
export function hasAnyPermission(req: any, permissionNames: string[]): boolean {
  if (!req.userPermissions) return false;
  return permissionNames.some((perm) => req.userPermissions.includes(perm));
}

/**
 * Returns whether the request has all of the given permissions.
 */
export function hasAllPermissions(
  req: any,
  permissionNames: string[],
): boolean {
  if (!req.userPermissions) return false;
  return permissionNames.every((perm) => req.userPermissions.includes(perm));
}

/**
 * Returns whether the request does not have the given permission.
 */
export function lacksPermission(req: any, permissionName: string): boolean {
  return !hasPermission(req, permissionName);
}

/**
 * Modification History:
 * - 2026-03-02: Added file header; translated comments and descriptions to English.
 */
