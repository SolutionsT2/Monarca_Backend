/**
 * File: permissions.entity.ts
 * Description: Granular permission rows; name is the guard key (moduleId:action). Optional link to auth_modules.
 * Description: TypeORM entity for permissions; linked to roles via RolePermission.
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

  @Column({ type: 'varchar', length: 512, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  action: string | null;

  @ManyToOne(() => AuthModuleEntity, (m) => m.permissions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'module_id' })
  authModule: AuthModuleEntity | null;

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
 * - 2026-03-27:
 *   -Fixed rolePermissions inverse side to RolePermission.permission.
 *   - Added auth module relation, action, string id; name remains unique guard key.
 */
