import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyEngineService } from './policy-engine.service';
import { Policy } from './entities/policy.entity';
import { PolicyRule } from './entities/policy-rule.entity';
import { PolicyViolation } from './entities/policy-violation.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Policy, PolicyRule, PolicyViolation, Voucher]),
  ],
  providers: [PolicyEngineService],
  exports: [PolicyEngineService],
})
export class PolicyEngineModule {}