/**
 * File: permissions.entity.ts
 * Description: TypeORM entity for permissions (e.g. action names); linked to roles via RolePermission.
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './roles_permissions.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  // id: number;
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  module: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  action: string;

  // @OneToMany(() => RolePermission, (rp) => rp.role)
  // rolePermissions: RolePermission[];
  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-03-23:
 *    - Added description, module, and action fields; fixed UUID type and relation mapping.
 *    - Fixed OneToMany relation to correctly reference RolePermission.permission.
 */
