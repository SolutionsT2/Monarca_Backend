import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Request } from './request.entity';
import { User } from 'src/users/entities/user.entity';

export type RequestApprovalStepStatus = 'pending' | 'approved' | 'denied';

@Entity('request_approval_steps')
export class RequestApprovalStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_request', type: 'uuid' })
  idRequest: string;

  @Column({ name: 'id_approver', type: 'uuid' })
  idApprover: string;

  @Column({ name: 'id_approved_by', type: 'uuid', nullable: true })
  idApprovedBy?: string | null;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: RequestApprovalStepStatus;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date | null;

  @ManyToOne(() => Request, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_request' })
  request: Request;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_approver' })
  approver: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_approved_by' })
  approvedBy?: User | null;
}
