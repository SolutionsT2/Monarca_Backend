import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Department, CostCenter])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
