/**
 * File: policy-export.entity.ts
 * Description: TypeORM entity tracking accounting policy exports
 * generated from approved requests for Ditta Consulting ERP integration.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { Company } from 'src/companies/entity/company.entity';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'policy_exports' })
export class PolicyExport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_request', type: 'uuid' })
  id_request: string;

  @Column({ name: 'id_company', type: 'uuid' })
  id_company: string;

  @Column({ name: 'exported_by', type: 'uuid' })
  exported_by: string;

  @Column({ name: 'export_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  export_date: Date;

  @Column({ name: 'file_url', type: 'varchar', length: 500, nullable: true })
  file_url: string | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Request, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_request' })
  request: Request;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'id_company' })
  company: Company;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'exported_by' })
  exporter: User;
}

/*
Modification History:
- 2026-04-13 | Diego Vergara | Initial file creation. Entity for policy export audit trail (Module 1 - Fiscal Automation).
*/
