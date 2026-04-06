/**
 * File: roles.entity.ts
 * Description: TypeORM entity for roles; many-to-many with Permission via roles_permissions join table.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { RolePermission } from './roles_permissions.entity';
import { Permission } from './permissions.entity';

@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'roles_permissions',
    joinColumn: { name: 'id_role', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_permission', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-03-27 | Efren | Fixed rolePermissions inverse side to RolePermission.role.
 * - 2026-03-27 | Efren | Added description and is_active for admin API.
 */
