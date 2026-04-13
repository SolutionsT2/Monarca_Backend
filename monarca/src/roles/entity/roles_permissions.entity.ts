/**
 * File: roles_permissions.entity.ts
 * Description: TypeORM join entity for role-permission many-to-many relationship.
 */

import { Entity, ManyToOne, JoinColumn, PrimaryColumn, Column } from 'typeorm';
import { Roles } from './roles.entity';
import { Permission } from './permissions.entity';

@Entity('roles_permissions')
export class RolePermission {
  @PrimaryColumn({ name: 'id_role', type: 'uuid' })
  idRole: string;

  @PrimaryColumn({ name: 'id_permission', type: 'uuid' })
  idPermission: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @ManyToOne(() => Roles, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_role' })
  role: Roles;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_permission' })
  permission: Permission;
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-03-23:
 *   - Added expires_at field to support temporary permission assignments.
 *   - Explicitly defined composite primary keys (id_role, id_permission).
 *   - Ensured proper ManyToOne relationships with Roles and Permission entities.
 * - 2026-03-24:
 *   - Renamed entity properties to idRole and idPermission for consistency with database columns.
 */
