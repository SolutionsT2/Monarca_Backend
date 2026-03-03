/**
 * File: user-logs.entity.ts
 * Description: TypeORM entity for user logs (user, date, ip, report); linked to User.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'user_logs' })
export class UserLogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  id_user: number;

  // To be updated when user entity relation is finalized
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'id_user' })
  user: User;

  @Column()
  date: Date;

  @Column()
  ip: string;

  @Column()
  report: string;
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history; translated comment to English.
 */
