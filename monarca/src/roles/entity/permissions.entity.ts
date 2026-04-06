/**
 * File: permissions.entity.ts
 * Description: TypeORM entity for permissions; linked to roles via RolePermission.
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './roles_permissions.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 80 })
  module: string;

  @Column({ type: 'varchar', length: 80 })
  action: string;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-03-23:
 *   - Added description, module, and action fields.
 *   - Fixed OneToMany relation to correctly reference RolePermission.permission.
 * - 2026-03-24:
 *   - Marked permission name as unique.
 *   - Set module and action as required fields.
 */
