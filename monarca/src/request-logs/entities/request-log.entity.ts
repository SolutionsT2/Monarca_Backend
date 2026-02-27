/*
 * request-log.entity.ts
 *
 * TypeORM entity representing the request_logs table.
 * Stores historical records of status changes applied
 * to requests within the system.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';

/**
 * Entity representing a request log entry.
 * Tracks status changes and related metadata
 * for a given request.
 */
@Entity({ name: 'request_logs' })
export class RequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_request' })
  id_request: string;

  @Column({ name: 'id_user' })
  id_user: string;

  @Column({
    name: 'report',
    type: 'varchar',
    nullable: true,
  })
  report: string | null;

  @Column({ name: 'new_status' })
  new_status: string;

  @Column({
    name: 'change_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  change_date: string;

  // Defines relationship with the parent Request entity.
  @ManyToOne(() => Request, (request) => request.requestLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_request' })
  request: Request;
}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added entity documentation, class JSDoc, and standardized comments.
*/