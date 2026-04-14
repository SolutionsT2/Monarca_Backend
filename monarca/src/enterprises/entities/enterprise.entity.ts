import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EnterpriseDepartment } from './enterprise-department.entity';

@Entity({ name: 'enterprises' })
export class Enterprise {
  @ApiProperty({ example: '83cc36a2-8b98-4e48-af13-cdb61a45e8dc' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Monarca Corp' })
  @Column({ name: 'name' })
  name: string;

  @ApiProperty({ example: 'MXN' })
  @Column({ name: 'currency' })
  currency: string;

  @OneToMany(() => EnterpriseDepartment, (department) => department.enterprise, {
    cascade: true,
  })
  departments: EnterpriseDepartment[];
}
