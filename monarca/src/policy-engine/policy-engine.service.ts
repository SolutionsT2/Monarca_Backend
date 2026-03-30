import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyRule } from './entities/policy-rule.entity';
import { PolicyViolation } from './entities/policy-violation.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import {
  PolicyConsequence,
  PolicyEvaluationResult,
  PolicySeverity,
  PolicyValidationSummary,
  RequestPolicyContext,
  VoucherPolicyContext,
} from './types/policy.types';
import { normalizeVoucherSpendClass } from 'src/vouchers/types/voucher-spend.types';

type EvaluatedRuleResult = PolicyEvaluationResult & {
  voucher_id?: string;
};

const GLOBAL_EXPENSE_CLASSES = new Set(['ALL', 'TODAS']);
const REQUEST_LEVEL_OPERATORS = new Set([
  'TOTAL_LTE_ADVANCE',
  'TOTAL_VOUCHERS_LIMIT',
  'TOTAL_VOUCHERS_LTE_ADVANCE',
  'DAYS_EXCEEDED',
  'TIME_LIMIT',
]);

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

  async evaluateRequestSubmission(
    requestContext: RequestPolicyContext,
    vouchers: VoucherPolicyContext[],
  ): Promise<PolicyValidationSummary> {
    const rules = await this.policyRuleRepo.find({
      where: { is_active: true },
      relations: ['policy'],
    });

    const activeRules = rules.filter((rule) => rule.policy?.is_active !== false);
    const evaluations: EvaluatedRuleResult[] = [];

    for (const rule of activeRules) {
      const operator = this.normalizeOperator(rule.operator);

      if (REQUEST_LEVEL_OPERATORS.has(operator)) {
        evaluations.push(this.evaluateRequestLevelRule(rule, operator, requestContext, vouchers));
        continue;
      }

      for (const voucher of vouchers) {
        if (!this.ruleAppliesToVoucher(rule, voucher.class)) {
          continue;
        }

        evaluations.push(this.evaluateVoucherLevelRule(rule, operator, voucher));
      }
    }

    const summary = this.buildSummary(evaluations);
    await this.persistBlockingViolations(evaluations);
    await this.updateVoucherPolicyStatus(vouchers, evaluations);

    return summary;
  }

  private normalizeOperator(operator: string): string {
    return operator.trim().toUpperCase();
  }

  private resolveSeverity(rule: PolicyRule): PolicySeverity {
    const consequence = rule.consequence?.trim().toUpperCase();
    return consequence === 'WARNING'
      ? PolicySeverity.WARNING
      : PolicySeverity.BLOCKING;
  }

  private resolveConsequence(rule: PolicyRule): PolicyConsequence {
    return rule.consequence?.trim().toUpperCase() === PolicyConsequence.REIMBURSEMENT_CANCELLED
      ? PolicyConsequence.REIMBURSEMENT_CANCELLED
      : PolicyConsequence.POLICY_VIOLATION;
  }

  private createEvaluationBase(rule: PolicyRule): Omit<EvaluatedRuleResult, 'passed' | 'message'> {
    return {
      policy_id: rule.id,
      policy_code: rule.id,
      severity: this.resolveSeverity(rule),
      consequence: this.resolveConsequence(rule),
      can_override: false,
    };
  }

  private evaluateRequestLevelRule(
    rule: PolicyRule,
    operator: string,
    requestContext: RequestPolicyContext,
    vouchers: VoucherPolicyContext[],
  ): EvaluatedRuleResult {
    const base = this.createEvaluationBase(rule);

    if (
      operator === 'TOTAL_LTE_ADVANCE' ||
      operator === 'TOTAL_VOUCHERS_LIMIT' ||
      operator === 'TOTAL_VOUCHERS_LTE_ADVANCE'
    ) {
      const totalVouchers = vouchers.reduce((sum, voucher) => sum + voucher.amount, 0);
      const passed = totalVouchers <= requestContext.advance_money;

      return {
        ...base,
        passed,
        message: passed
          ? `Total vouchers (${totalVouchers}) is within advance (${requestContext.advance_money}).`
          : `Total vouchers (${totalVouchers}) exceeds advance (${requestContext.advance_money}).`,
        evaluated_value: {
          total_vouchers: totalVouchers,
          advance_money: requestContext.advance_money,
        },
      };
    }

    if (operator === 'DAYS_EXCEEDED' || operator === 'TIME_LIMIT') {
      const limit = typeof rule.threshold_value === 'number' ? rule.threshold_value : 28;
      const elapsedMs = Date.now() - new Date(requestContext.createdAt).getTime();
      const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
      const passed = elapsedDays <= limit;

      return {
        ...base,
        passed,
        message: passed
          ? `Submission is within ${limit} day(s).`
          : `Submission exceeded ${limit} day(s) limit.`,
        evaluated_value: {
          elapsed_days: elapsedDays,
          max_days: limit,
        },
      };
    }

    return {
      ...base,
      passed: true,
      message: 'Rule operator not implemented yet.',
    };
  }

  private evaluateVoucherLevelRule(
    rule: PolicyRule,
    operator: string,
    voucher: VoucherPolicyContext,
  ): EvaluatedRuleResult {
    const base = this.createEvaluationBase(rule);
    const threshold = typeof rule.threshold_value === 'number' ? rule.threshold_value : null;

    if (operator === 'MISSING_XML') {
      const passed = !!voucher.file_url_xml;
      return {
        ...base,
        voucher_id: voucher.id,
        passed,
        message: passed ? 'Voucher has XML file.' : 'Voucher is missing XML file.',
      };
    }

    if (operator === 'MISSING_PDF') {
      const passed = !!voucher.file_url_pdf;
      return {
        ...base,
        voucher_id: voucher.id,
        passed,
        message: passed ? 'Voucher has PDF file.' : 'Voucher is missing PDF file.',
      };
    }

    if (operator === 'MISSING_FILE') {
      const passed = !!voucher.file_url_pdf || !!voucher.file_url_xml;
      return {
        ...base,
        voucher_id: voucher.id,
        passed,
        message: passed
          ? 'Voucher has at least one required file.'
          : 'Voucher is missing both PDF and XML files.',
      };
    }

    if (threshold === null) {
      return {
        ...base,
        voucher_id: voucher.id,
        passed: true,
        message: 'Rule threshold is not configured.',
      };
    }

    let passed = true;
    if (operator === 'LT') passed = voucher.amount >= threshold;
    else if (operator === 'LTE') passed = voucher.amount > threshold;
    else if (operator === 'GT') passed = voucher.amount <= threshold;
    else if (operator === 'GTE') passed = voucher.amount < threshold;

    return {
      ...base,
      voucher_id: voucher.id,
      passed,
      message: passed
        ? `Voucher amount (${voucher.amount}) passed ${operator} rule (${threshold}).`
        : `Voucher amount (${voucher.amount}) violated ${operator} rule (${threshold}).`,
      evaluated_value: {
        amount: voucher.amount,
        operator,
        threshold,
        currency: voucher.currency,
      },
    };
  }

  private ruleAppliesToVoucher(rule: PolicyRule, voucherClass: string): boolean {
    const ruleClass = normalizeVoucherSpendClass(rule.expense_class);
    const normalizedVoucherClass = normalizeVoucherSpendClass(voucherClass);
    return GLOBAL_EXPENSE_CLASSES.has(ruleClass) || ruleClass === normalizedVoucherClass;
  }

  private buildSummary(evaluations: EvaluatedRuleResult[]): PolicyValidationSummary {
    const failed = evaluations.filter((evaluation) => !evaluation.passed);
    const blockingViolations = failed.filter(
      (evaluation) => evaluation.severity === PolicySeverity.BLOCKING,
    );

    return {
      total_rules: evaluations.length,
      passed: evaluations.length - failed.length,
      failed: failed.length,
      blocking_violations: blockingViolations.length,
      can_submit: blockingViolations.length === 0,
      violations: failed,
    };
  }

  private async persistBlockingViolations(
    evaluations: EvaluatedRuleResult[],
  ): Promise<void> {
    const violationsToPersist = evaluations.filter(
      (evaluation) =>
        !evaluation.passed &&
        evaluation.severity === PolicySeverity.BLOCKING &&
        evaluation.voucher_id,
    );

    if (!violationsToPersist.length) {
      return;
    }

    for (const evaluation of violationsToPersist) {
      const violation = this.policyViolationRepo.create({
        id_voucher: evaluation.voucher_id!,
        id_policy_rule: evaluation.policy_id,
        detail: evaluation.message,
      });
      await this.policyViolationRepo.save(violation);
    }
  }

  private async updateVoucherPolicyStatus(
    vouchers: VoucherPolicyContext[],
    evaluations: EvaluatedRuleResult[],
  ): Promise<void> {
    if (!vouchers.length) {
      return;
    }

    const voucherIdsWithBlockingViolations = new Set(
      evaluations
        .filter(
          (evaluation) =>
            !evaluation.passed &&
            evaluation.severity === PolicySeverity.BLOCKING &&
            !!evaluation.voucher_id,
        )
        .map((evaluation) => evaluation.voucher_id!),
    );

    for (const voucher of vouchers) {
      const policy_status = voucherIdsWithBlockingViolations.has(voucher.id)
        ? 'POLICY_VIOLATION'
        : 'APPROVED';
      await this.voucherRepo.update(voucher.id, { policy_status });
    }
  }

  private evaluateRule(rule: PolicyRule, voucher: Voucher): boolean {
    const threshold = rule.threshold_value;
    switch (rule.operator) {
      case 'LT':
        return typeof threshold === 'number' ? voucher.amount < threshold : false;
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