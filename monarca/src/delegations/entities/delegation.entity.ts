/**
 * File: delegation.entity.ts
 * Description: Entity representing the delegations table in the database, 
 * capturing user delegation relationships, validity periods, and reasons.
 */

import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Delegation entity mapping to the "delegations" table.
 * Handles substitute assignments for users during absences.
 */
@Index(['idDelegator', 'isActive'])
@Entity({ name: 'delegations' })
export class Delegation {
  @ApiProperty({ example: '5932b459-a3ea-46a1-8482-d56bfda8c866' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '5932b459-a3ea-46a1-8482-d56bfda8c866' })
  @Column({ name: 'id_delegator', type: 'uuid' })
  idDelegator: string;

  @ApiProperty({ example: '7528d97a-02d1-4c55-9477-8b368acc09f0' })
  @Column({ name: 'id_delegate', type: 'uuid' })
  idDelegate: string;

  @ApiProperty({ example: '2026-04-05T22:00:00Z' })
  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @ApiProperty({ example: '2026-04-15T22:00:00Z' })
  @Column({ name: 'end_date', type: 'timestamptz' })
  endDate: Date;

  @ApiProperty({ example: 'Absence due to medical leave' })
  @Column({ type: 'text', nullable: true })
  reason?: string;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_delegator' })
  delegator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_delegate' })
  delegate: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/*
Modification History:
- 2026-03-24:
    - Created entity to support temporary delegation of approvals between users.
*/
