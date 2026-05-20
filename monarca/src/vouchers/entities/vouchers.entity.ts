/**
 * File: vouchers.entity.ts
 * Description: TypeORM entity for vouchers (request, class, amount, tax, currency, date, PDF/XML URLs, status, approver); linked to Request.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';
import { AccountingAccount } from 'src/accounting-accounts/entity/accounting-account.entity';

@Entity({ name: 'vouchers' })
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_request', type: 'uuid' })
  id_request: string;

  @Column({ name: 'class', type: 'varchar' })
  class: string;

  @Column({ name: 'amount', type: 'float' })
  amount: number;

  @Column({ name: 'taxt_type', type: 'varchar' })
  tax_type: string;

  @Column({ name: 'currency', type: 'varchar' })
  currency: string;

  @Column({ name: 'amount_mxn', type: 'float', nullable: true })
  amount_mxn: number | null;

  @Column({ name: 'date', type: 'timestamptz' })
  date: Date;

  @Column({ name: 'file_url_pdf', type: 'varchar', nullable: true })
  file_url_pdf: string | null;

  @Column({ name: 'file_url_xml', type: 'varchar', nullable: true })
  file_url_xml: string | null;

  @Column({ name: 'is_foreign', type: 'boolean', default: false })
  is_foreign: boolean;

  @Column({ name: 'status', type: 'varchar' })
  status: string;

  @Column({ name: 'policy_status', type: 'varchar', default: 'PENDING', nullable: true })
  policy_status: string; // new column to track policy evaluation status

  @Column({ name: 'id_approver', type: 'uuid' })
  id_approver: string;

  // ---- Ditta Consulting integration fields ----

  @Column({ name: 'id_document_class', type: 'uuid', nullable: true })
  id_document_class?: string;

  @Column({ name: 'id_accounting_account', type: 'uuid', nullable: true })
  id_accounting_account?: string;

  // ---- Relationships ----

  @ManyToOne(() => Request, (requests) => requests.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_request' })
  requests: Request;

  @ManyToOne(() => DocumentClass, (dc) => dc.vouchers, { nullable: true })
  @JoinColumn({ name: 'id_document_class' })
  document_class?: DocumentClass;

  @ManyToOne(() => AccountingAccount, (acc) => acc.vouchers, { nullable: true })
  @JoinColumn({ name: 'id_accounting_account' })
  accounting_account?: AccountingAccount;
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-04-13 | Diego Vergara | Added Ditta Consulting fields: id_document_class, id_accounting_account with relationships to DocumentClass and AccountingAccount.
 */
