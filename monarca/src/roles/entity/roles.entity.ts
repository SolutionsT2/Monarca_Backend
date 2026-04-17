/**
 * File: roles.entity.ts
 * Description: TypeORM entity for roles; related to permissions via roles_permissions join entity.
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './roles_permissions.entity';

@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-03-23:
 *   - Updated id type to string for UUID compatibility.
 *   - Fixed OneToMany relation to correctly reference RolePermission.role.
 * - 2026-03-24:
 *   - Removed direct ManyToMany relation with Permission to rely on RolePermission join entity with metadata.
 */
