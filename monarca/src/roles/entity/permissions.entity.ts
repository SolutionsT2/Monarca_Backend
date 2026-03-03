/**
 * File: permissions.entity.ts
 * Description: TypeORM entity for permissions (e.g. action names); linked to roles via RolePermission.
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './roles_permissions.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  name: string;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
