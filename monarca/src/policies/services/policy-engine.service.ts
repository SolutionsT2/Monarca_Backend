/**
 * File: policy-engine.service.ts
 * Description: Evaluates request and voucher policies for reimbursement submission.
 */

import { Injectable, Inject } from '@nestjs/common';
import { IPolicyRepository } from './policy-repository.interface';
import {
  PolicyAppliesOn,
  PolicyEvaluationResult,
  PolicySeverity,
  PolicyRule,
  PolicyRuleType,
  PolicyValidationSummary,
  RequestPolicyContext,
  VoucherPolicyContext,
} from '../types/policy.types';

@Injectable()
export class PolicyEngineService {
  constructor(
    @Inject('IPolicyRepository')
    private readonly policyRepository: IPolicyRepository,
  ) {}

  async evaluateRequestSubmission(
    requestContext: RequestPolicyContext,
    vouchers: VoucherPolicyContext[],
  ): Promise<PolicyValidationSummary> {
    const evaluations: PolicyEvaluationResult[] = [];

    const requestPolicies = await this.policyRepository.getPoliciesForContext(
      'ALL',
      PolicyAppliesOn.REQUEST,
    );

    for (const policy of requestPolicies) {
      evaluations.push(
        this.evaluateRequestPolicy(policy, requestContext, vouchers),
      );
    }

    for (const voucher of vouchers) {
      const voucherPolicies = await this.policyRepository.getPoliciesForContext(
        voucher.class,
        PolicyAppliesOn.VOUCHER,
      );

      for (const policy of voucherPolicies) {
        evaluations.push(this.evaluateVoucherPolicy(policy, voucher));
      }
    }

    return this.buildSummary(evaluations);
  }

  private evaluateRequestPolicy(
    policy: PolicyRule,
    requestContext: RequestPolicyContext,
    vouchers: VoucherPolicyContext[],
  ): PolicyEvaluationResult {
    if (policy.rule_type === PolicyRuleType.TOTAL_VOUCHERS_LIMIT) {
      const totalVouchers = vouchers.reduce(
        (sum, voucher) => sum + voucher.amount,
        0,
      );
      const passed = totalVouchers <= requestContext.advance_money;

      return {
        policy_id: policy.id,
        policy_code: policy.code,
        passed,
        message: passed
          ? `Total vouchers (${totalVouchers}) is within advance (${requestContext.advance_money}).`
          : `Total vouchers (${totalVouchers}) exceeds advance (${requestContext.advance_money}).`,
        severity: policy.severity,
        consequence: policy.consequence,
        can_override: policy.allow_override,
        evaluated_value: {
          total_vouchers: totalVouchers,
          advance_money: requestContext.advance_money,
        },
      };
    }

    if (policy.rule_type === PolicyRuleType.TIME_LIMIT) {
      const maxWeeksValue = policy.params.max_weeks_after_trip_end;
      const maxWeeks =
        typeof maxWeeksValue === 'number'
          ? maxWeeksValue
          : Number(maxWeeksValue ?? 4);
      const now = new Date();
      const diffMs = now.getTime() - requestContext.createdAt.getTime();
      const weeksPassed = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
      const passed = weeksPassed <= maxWeeks;

      return {
        policy_id: policy.id,
        policy_code: policy.code,
        passed,
        message: passed
          ? `Submission is within ${maxWeeks} week(s).`
          : `Submission exceeded ${maxWeeks} week(s) limit.`,
        severity: policy.severity,
        consequence: policy.consequence,
        can_override: policy.allow_override,
        evaluated_value: {
          weeks_passed: weeksPassed,
          max_weeks: maxWeeks,
        },
      };
    }

    return {
      policy_id: policy.id,
      policy_code: policy.code,
      passed: true,
      message: 'Rule type not implemented yet.',
      severity: policy.severity,
      consequence: policy.consequence,
      can_override: policy.allow_override,
    };
  }

  private evaluateVoucherPolicy(
    policy: PolicyRule,
    voucher: VoucherPolicyContext,
  ): PolicyEvaluationResult {
    if (policy.rule_type === PolicyRuleType.FILE_REQUIRED) {
      const requiredValue: unknown = policy.params.required_files;
      const required = Array.isArray(requiredValue)
        ? (requiredValue as string[])
        : [];
      const hasPdf = !!voucher.file_url_pdf;
      const hasXml = !!voucher.file_url_xml;

      const passed = required.every((fileType: string) => {
        if (fileType === 'PDF') return hasPdf;
        if (fileType === 'XML') return hasXml;
        return false;
      });

      return {
        policy_id: policy.id,
        policy_code: policy.code,
        passed,
        message: passed
          ? 'Voucher has required files.'
          : `Voucher missing required file(s): ${required.join(', ')}.`,
        severity: policy.severity,
        consequence: policy.consequence,
        can_override: policy.allow_override,
        evaluated_value: {
          required_files: required,
          has_pdf: hasPdf,
          has_xml: hasXml,
        },
      };
    }

    if (policy.rule_type === PolicyRuleType.AMOUNT_LIMIT) {
      const maxAmountValue = policy.params.max_amount;
      const maxAmount =
        typeof maxAmountValue === 'number'
          ? maxAmountValue
          : Number(maxAmountValue ?? 0);
      const passed = voucher.amount <= maxAmount;

      return {
        policy_id: policy.id,
        policy_code: policy.code,
        passed,
        message: passed
          ? `Voucher amount (${voucher.amount}) is within limit (${maxAmount}).`
          : `Voucher amount (${voucher.amount}) exceeds limit (${maxAmount}).`,
        severity: policy.severity,
        consequence: policy.consequence,
        can_override: policy.allow_override,
        evaluated_value: {
          amount: voucher.amount,
          max_amount: maxAmount,
          currency: voucher.currency,
        },
      };
    }

    return {
      policy_id: policy.id,
      policy_code: policy.code,
      passed: true,
      message: 'Rule type not implemented yet.',
      severity: policy.severity,
      consequence: policy.consequence,
      can_override: policy.allow_override,
    };
  }

  private buildSummary(
    evaluations: PolicyEvaluationResult[],
  ): PolicyValidationSummary {
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
}
