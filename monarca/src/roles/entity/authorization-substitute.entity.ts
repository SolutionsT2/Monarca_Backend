/**
 * File: authorization-substitute.entity.ts
 * Description: Person-to-person substitute assignment. originalUserId delegates
 * approval authority to targetUserId between start and end dates.
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

  @Column({ name: 'original_user_id', type: 'uuid' })
  originalUserId: string;

  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string | null;

  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'original_user_id' })
  originalUser: User;

  @ManyToOne(() => Roles, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Roles | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;
}

/*
Modification History:
- 2026-03-27 | Efren | Initial creation for substitute approver API (P1).
- 2026-05-12 | Juan de Dios Gastélum | Changed to person-to-person model: added originalUserId,
  made roleId nullable. Approver assigns their own substitute directly.
*/
