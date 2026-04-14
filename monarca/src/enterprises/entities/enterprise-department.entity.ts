import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Enterprise } from './enterprise.entity';

@Entity({ name: 'enterprise_departments' })
export class EnterpriseDepartment {
  @ApiProperty({ example: '35a8b529-bfbe-44ca-a8f0-9ddd6d6d7f07' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Mercadeo' })
  @Column({ name: 'name' })
  name: string;

  @ApiProperty({ example: 101 })
  @Column({ name: 'cost_center_id', type: 'int' })
  cost_center_id: number;

  @Column({ name: 'id_enterprise', type: 'uuid' })
  id_enterprise: string;

  @ManyToOne(() => Enterprise, (enterprise) => enterprise.departments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_enterprise' })
  enterprise: Enterprise;
}
