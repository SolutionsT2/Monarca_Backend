import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyExportsService } from './policy-exports.service';
import { PolicyExportsController } from './policy-exports.controller';
import { Request } from 'src/requests/entities/request.entity';
import { Company } from 'src/companies/entity/company.entity';
import { PolicyExport } from './entity/policy-export.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Request, Company, PolicyExport])],
  controllers: [PolicyExportsController],
  providers: [PolicyExportsService],
})
export class PolicyExportsModule {}
