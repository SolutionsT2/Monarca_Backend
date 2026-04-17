/**
 * File: permissions.entity.ts
 * Description: TypeORM entity for permissions; linked to roles via RolePermission and to AuthModuleEntity.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RolePermission } from './roles_permissions.entity';
import { AuthModuleEntity } from './auth-module.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  module?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  action?: string;

  @ManyToOne(() => AuthModuleEntity, (m) => m.permissions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_auth_module' })
  authModule?: AuthModuleEntity;

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
 * - 2026-04-16:
 *   - Added ManyToOne relation to AuthModuleEntity.
 *   - Made module and action nullable to support authModule-based permissions.
 */
