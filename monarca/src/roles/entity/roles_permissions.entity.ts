/**
 * File: roles_permissions.entity.ts
 * Description: TypeORM join entity for role-permission many-to-many relationship.
 */

import { Entity, ManyToOne, JoinColumn, PrimaryColumn, Column } from 'typeorm';
import { Roles } from './roles.entity';
import { Permission } from './permissions.entity';

@Entity('roles_permissions')
export class RolePermission {
  @PrimaryColumn()
  id_role: string;

  @PrimaryColumn()
  id_permission: string;

  /**
   * When set, this assignment is ignored after this instant (UTC).
   * Null means the assignment does not expire.
   */
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

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
 * - 2026-03-27 | Efren | Added expires_at for time-bound permission assignments (P1).
 */
