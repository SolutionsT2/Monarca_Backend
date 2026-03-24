/**
 * File: roles_permissions.entity.ts
 * Description: TypeORM join entity for role-permission many-to-many relationship.
 */

import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Roles } from './roles.entity';
import { Permission } from './permissions.entity';

@Entity('roles_permissions')
export class RolePermission {
  @PrimaryColumn()
  // id_role: string;
  id: string;

  @PrimaryColumn()
  id_permission: string;

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

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
