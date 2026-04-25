/**
 * File: document-class.entity.ts
 * Description: TypeORM entity representing a document class
 * (Clases de Documento) from Ditta Consulting. AV (Anticipo de Viaje) or GV (Gasto de Viaje).
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';

@Entity({ name: 'document_classes' })
export class DocumentClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'key', type: 'varchar', length: 5, unique: true })
  key: string;

  @Column({ name: 'description', type: 'varchar' })
  description: string;

  @OneToMany(() => Request, (request) => request.document_class)
  requests: Request[];

  @OneToMany(() => Voucher, (voucher) => voucher.document_class)
  vouchers: Voucher[];
}

/*
Modification History:
- 2026-04-13 | Diego Vergara | Initial file creation. Entity for Ditta Consulting Clases de Documento catalog.
*/
