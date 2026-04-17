/**
 * File: auth-module.entity.ts
 * Description: Registry of functional modules used to group granular permissions (e.g. travel requests, refunds).
 */

import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Permission } from './permissions.entity';

@Entity('auth_modules')
export class AuthModuleEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany(() => Permission, (p) => p.authModule)
  permissions: Permission[];
}

/*
Modification History:
- 2026-03-27 | Efren | Initial creation for granular roles API (P1).
*/
