import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyRule } from './entities/policy-rule.entity';
import { PolicyViolation } from './entities/policy-violation.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
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
  'VOUCHER_DATE_WITHIN_TRIP_WINDOW',
]);

@Injectable()
export class PolicyEngineService {
  private readonly contextLabel = 'PolicyEngineService';

  constructor(
    @InjectRepository(PolicyRule)
    private readonly policyRuleRepo: Repository<PolicyRule>,
    @InjectRepository(PolicyViolation)
    private readonly policyViolationRepo: Repository<PolicyViolation>,
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(Request)
    private readonly requestRepo: Repository<Request>,
  ) {}

  async evaluate(voucher: Voucher): Promise<PolicyViolation[]> {
    const request = await this.requestRepo.findOne({
      where: { id: voucher.id_request },
      select: ['id', 'id_company'],
    });

    const companyId = request?.id_company;
    if (!companyId) {
      await this.voucherRepo.update(voucher.id, { policy_status: 'PENDING' });
      return [];
    }

    const rules = await this.policyRuleRepo
      .createQueryBuilder('rule')
      .innerJoinAndSelect('rule.policy', 'policy')
      .where('rule.is_active = :ruleActive', { ruleActive: true })
      .andWhere('policy.is_active = :policyActive', { policyActive: true })
      .andWhere('policy.id_company = :companyId', { companyId })
      .andWhere('UPPER(rule.expense_class) IN (:...expenseClasses)', {
        expenseClasses: [voucher.class.toUpperCase(), 'TODAS', 'ALL'],
      })
      .getMany();

    const violations: PolicyViolation[] = [];

    for (const rule of rules) {
      const violated = this.evaluateRule(rule, voucher);
      if (violated) {
        // eslint-disable-next-line no-console
        console.warn(
          `[${this.contextLabel}][VOUCHER_EVALUATION] Policy violated`,
          JSON.stringify(
            {
              voucher_id: voucher.id,
              expense_class: voucher.class,
              policy_rule_id: rule.id,
              operator: rule.operator,
              threshold_value: rule.threshold_value,
              threshold_unit: rule.threshold_unit,
            },
            null,
            2,
          ),
        );

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
    const uniqueVouchers = Array.from(
      new Map(vouchers.map((voucher) => [voucher.id, voucher])).values(),
    );

    const activeRules = await this.policyRuleRepo
      .createQueryBuilder('rule')
      .innerJoinAndSelect('rule.policy', 'policy')
      .where('rule.is_active = :ruleActive', { ruleActive: true })
      .andWhere('policy.is_active = :policyActive', { policyActive: true })
      .andWhere('policy.id_company = :companyId', {
        companyId: requestContext.id_company,
      })
      .getMany();
    const evaluations: EvaluatedRuleResult[] = [];

    for (const rule of activeRules) {
      const operator = this.normalizeOperator(rule.operator);

      if (REQUEST_LEVEL_OPERATORS.has(operator)) {
        evaluations.push(
          this.evaluateRequestLevelRule(
            rule,
            operator,
            requestContext,
            uniqueVouchers,
          ),
        );
        continue;
      }

      for (const voucher of uniqueVouchers) {
        if (!this.ruleAppliesToVoucher(rule, voucher.class)) {
          continue;
        }

        evaluations.push(this.evaluateVoucherLevelRule(rule, operator, voucher));
      }
    }

    const summary = this.buildSummary(evaluations);
    this.logViolationsToConsole('REQUEST_SUBMISSION', {
      requestId: requestContext.id,
      totalRules: summary.total_rules,
      failedRules: summary.failed,
      blockingViolations: summary.blocking_violations,
      violations: summary.violations,
    });
    await this.persistBlockingViolations(evaluations);
    await this.updateVoucherPolicyStatus(uniqueVouchers, evaluations);

    return summary;
  }

  private normalizeOperator(operator: string): string {
    return operator.trim().toUpperCase();
  }

  private allowPreTripVoucherDatesForTesting(): boolean {
    return process.env.ALLOW_PRETRIP_VOUCHER_DATES_FOR_TESTS?.toLowerCase() === 'true';
  }

  private allowVoucherAmountThresholdBypassForTesting(): boolean {
    return process.env.ALLOW_VOUCHER_AMOUNT_RULE_BYPASS_FOR_TESTS?.toLowerCase() === 'true';
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
      const totalVouchers = vouchers.reduce((sum, voucher) => {
        const amount = Number(voucher.amount);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);
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

    if (operator === 'VOUCHER_DATE_WITHIN_TRIP_WINDOW') {
      const allowPreTripDates = this.allowPreTripVoucherDatesForTesting();

      // In test mode, bypass trip-window validation entirely.
      if (allowPreTripDates) {
        return {
          ...base,
          passed: true,
          message: 'Voucher-date trip-window rule bypassed in testing mode.',
          evaluated_value: {
            allow_pretrip_voucher_dates_for_tests: true,
            bypass_trip_window_rule_for_tests: true,
          },
        };
      }

      const tripStart = requestContext.trip_start_date
        ? new Date(requestContext.trip_start_date)
        : null;
      const tripEnd = requestContext.trip_end_date
        ? new Date(requestContext.trip_end_date)
        : null;

      if (!tripStart || !tripEnd || Number.isNaN(tripStart.getTime()) || Number.isNaN(tripEnd.getTime())) {
        return {
          ...base,
          passed: true,
          message: 'Trip window is not available; voucher-date rule skipped.',
          evaluated_value: {
            trip_start_date: requestContext.trip_start_date ?? null,
            trip_end_date: requestContext.trip_end_date ?? null,
          },
        };
      }

      const outOfWindowVouchers = vouchers.filter((voucher) => {
        const voucherDate = new Date(voucher.date);
        if (Number.isNaN(voucherDate.getTime())) {
          return true;
        }

        return voucherDate < tripStart || voucherDate > tripEnd;
      });

      const passed = outOfWindowVouchers.length === 0;

      return {
        ...base,
        passed,
        message: passed
          ? 'All voucher dates are within the trip window.'
          : 'One or more voucher dates are outside the trip window.',
        evaluated_value: {
          trip_start_date: tripStart.toISOString(),
          trip_end_date: tripEnd.toISOString(),
          allow_pretrip_voucher_dates_for_tests: false,
          out_of_window_voucher_ids: outOfWindowVouchers.map((voucher) => voucher.id),
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

    if (
      this.allowVoucherAmountThresholdBypassForTesting() &&
      ['LT', 'LTE', 'GT', 'GTE'].includes(operator)
    ) {
      return {
        ...base,
        voucher_id: voucher.id,
        passed: true,
        message: `Amount rule ${operator} bypassed in testing mode.`,
        evaluated_value: {
          amount: voucher.amount,
          operator,
          threshold,
          currency: voucher.currency,
          bypass_amount_rule_for_tests: true,
        },
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
        if (this.allowVoucherAmountThresholdBypassForTesting()) {
          return false;
        }
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

  private logViolationsToConsole(
    stage: 'REQUEST_SUBMISSION' | 'VOUCHER_EVALUATION',
    context: {
      requestId?: string;
      voucherId?: string;
      totalRules: number;
      failedRules: number;
      blockingViolations: number;
      violations: PolicyEvaluationResult[];
    },
  ): void {
    if (!context.violations.length) {
      return;
    }

    const stageLabel = `[${this.contextLabel}][${stage}]`;

    // eslint-disable-next-line no-console
    console.warn(
      `${stageLabel} Policy validation failed`,
      JSON.stringify(
        {
          request_id: context.requestId,
          voucher_id: context.voucherId,
          total_rules: context.totalRules,
          failed_rules: context.failedRules,
          blocking_violations: context.blockingViolations,
        },
        null,
        2,
      ),
    );

    context.violations.forEach((violation, index) => {
      // eslint-disable-next-line no-console
      console.warn(
        `${stageLabel} Violation #${index + 1}`,
        JSON.stringify(
          {
            policy_rule_id: violation.policy_id,
            severity: violation.severity,
            consequence: violation.consequence,
            message: violation.message,
            evaluated_value: violation.evaluated_value ?? null,
          },
          null,
          2,
        ),
      );
    });
  }
}