/**
 * File: permission-key.util.ts
 * Description: Stable permission name used by PermissionsGuard and stored in permissions.name.
 */

/**
 * Builds the canonical permission key for a module action.
 * @param moduleId Module identifier (e.g. mod_travel).
 * @param action Action verb (e.g. create, approve).
 */
export function buildPermissionKey(moduleId: string, action: string): string {
  return `${moduleId}:${action.trim().toLowerCase()}`;
}

/*
Modification History:
- 2026-03-27 | Efren | Initial creation.
*/
