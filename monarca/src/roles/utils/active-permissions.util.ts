/**
 * File: active-permissions.util.ts
 * Description: Helpers to determine which permission assignments on a role are still valid (not past expires_at).
 */

import { Roles } from '../entity/roles.entity';
import { Permission } from '../entity/permissions.entity';
import { RolePermission } from '../entity/roles_permissions.entity';

/**
 * Returns true when the assignment has no expiry or the expiry is still in the future.
 * @param expiresAt Optional timestamp after which the assignment must not be honored.
 */
export function isRolePermissionAssignmentActive(
  expiresAt: Date | null | undefined,
): boolean {
  if (expiresAt == null) {
    return true;
  }
  return new Date(expiresAt).getTime() > Date.now();
}

/**
 * Collects distinct permission names from non-expired role-permission rows.
 * @param role Role with `rolePermissions` and nested `permission` loaded.
 */
export function activePermissionNamesFromRole(
  role: Roles | null | undefined,
): string[] {
  if (!role?.rolePermissions?.length) {
    return [];
  }
  const names: string[] = [];
  for (const row of role.rolePermissions) {
    if (!isRolePermissionAssignmentActive(row.expiresAt)) {
      continue;
    }
    const permissionName = row.permission?.name;
    if (permissionName) {
      names.push(permissionName);
    }
  }
  return [...new Set(names)];
}

/**
 * Returns Permission entities for assignments that are still active (for API responses).
 * @param role Role with `rolePermissions` and nested `permission` loaded.
 */
export function getActivePermissionsForRole(
  role: Roles | null | undefined,
): Permission[] {
  if (!role?.rolePermissions?.length) {
    return [];
  }
  const seen = new Set<string>();
  const result: Permission[] = [];
  for (const row of role.rolePermissions) {
    if (!isRolePermissionAssignmentActive(row.expiresAt) || !row.permission) {
      continue;
    }
    const id = String(row.permission.id);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(row.permission);
  }
  return result;
}

/**
 * Filters role-permission rows to those that are still valid.
 * @param rows Join rows (optional relation graph).
 */
export function filterActiveRolePermissions(
  rows: RolePermission[] | null | undefined,
): RolePermission[] {
  if (!rows?.length) {
    return [];
  }
  return rows.filter((row) => isRolePermissionAssignmentActive(row.expiresAt));
}

/*
Modification History:
- 2026-03-27 | Efren | Added helpers for time-bound role-permission checks (P1 permissions guard).
*/
