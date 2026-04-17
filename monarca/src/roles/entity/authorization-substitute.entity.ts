/**
 * File: authorization-substitute.entity.ts
 * Description: Temporary assignment so targetUserId receives effective permissions of roleId between start and end dates.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Roles } from './roles.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('authorization_substitutes')
export class AuthorizationSubstitute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Roles;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;
}

/*
Modification History:
- 2026-03-27 | Efren | Initial creation for substitute approver API (P1).
*/
