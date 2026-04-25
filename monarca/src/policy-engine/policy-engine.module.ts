import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyEngineService } from './policy-engine.service';
import { Policy } from './entities/policy.entity';
import { PolicyRule } from './entities/policy-rule.entity';
import { PolicyViolation } from './entities/policy-violation.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { RefundPoliciesService } from './refund-policies.service';
import { RefundPoliciesController } from './refund-policies.controller';
import { Company } from 'src/companies/entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { Request } from 'src/requests/entities/request.entity';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [
    GuardsModule,
    TypeOrmModule.forFeature([
      Policy,
      PolicyRule,
      PolicyViolation,
      Voucher,
      Company,
      Department,
      Roles,
      Request,
    ]),
  ],
  providers: [PolicyEngineService, RefundPoliciesService],
  controllers: [RefundPoliciesController],
  exports: [PolicyEngineService, RefundPoliciesService],
})
export class PolicyEngineModule {}