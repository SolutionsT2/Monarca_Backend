import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { User } from 'src/users/entities/user.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [
    GuardsModule,
    TypeOrmModule.forFeature([Company, Department, CostCenter, User, Roles]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
