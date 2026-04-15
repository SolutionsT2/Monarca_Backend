/**
 * File: cfdi.entity.ts
 * Description:
 */

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cfdi' })
export class Cfdi {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  uuid: string;

  @Column()
  issuerRfc: string;

  @Column()
  receiverRfc: string;

  @Column('decimal')
  total: number;

  @Column({
    type: 'enum',
    enum: ['PENDIENTE', 'APROBADO', 'NO_APROBADO'],
    default: 'PENDIENTE',
  })
  status: 'PENDIENTE' | 'APROBADO' | 'NO_APROBADO';

  @Column({ type: 'varchar', length: 512, nullable: true })
  filePath: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

/**
 * Modification History:
 * - 2026-02-26:
 */
