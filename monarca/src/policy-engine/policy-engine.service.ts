import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './policy-engine/entities/policy.entity';
import { PolicyRule } from './entities/policy-rule.entity';
import { PolicyViolation } from './entities/policy-violation.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';

@Injectable()
export class PolicyEngineService {
  constructor(
    @InjectRepository(PolicyRule)
    private readonly policyRuleRepo: Repository<PolicyRule>,
    @InjectRepository(PolicyViolation)
    private readonly policyViolationRepo: Repository<PolicyViolation>,
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
  ) {}

  async evaluate(voucher: Voucher): Promise<PolicyViolation[]> {
    const rules = await this.policyRuleRepo.find({
      where: [
        { expense_class: voucher.class, is_active: true },
        { expense_class: 'Todas', is_active: true },
      ],
    });

    const violations: PolicyViolation[] = [];

    for (const rule of rules) {
      const violated = this.evaluateRule(rule, voucher);
      if (violated) {
        const violation = this.policyViolationRepo.create({
          id_voucher: voucher.id,
          id_policy_rule: rule.id,
          detail: `Regla violada: ${rule.operator} con valor ${rule.threshold_value}`,
        });
        violations.push(await this.policyViolationRepo.save(violation));
      }
    }

    const policy_status = violations.length > 0 ? 'POLICY_VIOLATION' : 'APPROVED';
    await this.voucherRepo.update(voucher.id, { policy_status });

    return violations;
  }

  private evaluateRule(rule: PolicyRule, voucher: Voucher): boolean {
    switch (rule.operator) {
      case 'LT':
        return voucher.amount < rule.threshold_value;
      case 'MISSING_XML':
        return !voucher.file_url_xml;
      case 'MISSING_PDF':
        return !voucher.file_url_pdf;
      case 'MISSING_FILE':
        return !voucher.file_url_pdf && !voucher.file_url_xml;
      default:
        return false;
    }
  }
}