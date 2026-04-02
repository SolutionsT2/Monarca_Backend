/**
 * File: in-memory-policy.repository.ts
 * Description: Temporary in-memory policy source for MVP.
 */

import { Injectable } from '@nestjs/common';
import { IPolicyRepository } from '../services/policy-repository.interface';
import {
  PolicyAppliesOn,
  PolicyConsequence,
  PolicyRule,
  PolicyRuleType,
  PolicySeverity,
} from '../types/policy.types';
import { normalizeVoucherSpendClass } from 'src/vouchers/types/voucher-spend.types';

@Injectable()
export class InMemoryPolicyRepository implements IPolicyRepository {
  private readonly policies: PolicyRule[] = [
    {
      id: 'policy-1',
      code: 'ALL_TOTAL_LTE_ADVANCE',
      name: 'Total comprobado no excede anticipo',
      expense_class: 'ALL',
      applies_on: PolicyAppliesOn.REQUEST,
      rule_type: PolicyRuleType.TOTAL_VOUCHERS_LIMIT,
      params: {},
      consequence: PolicyConsequence.POLICY_VIOLATION,
      severity: PolicySeverity.BLOCKING,
      is_active: true,
      allow_override: true,
      override_permission: 'reimbursement.policy.override',
    },
    {
      id: 'policy-2',
      code: 'TRAINING_REQUIRES_XML',
      name: 'Capacitacion requiere XML',
      expense_class: 'CAPA',
      applies_on: PolicyAppliesOn.VOUCHER,
      rule_type: PolicyRuleType.FILE_REQUIRED,
      params: { required_files: ['XML'] },
      consequence: PolicyConsequence.POLICY_VIOLATION,
      severity: PolicySeverity.BLOCKING,
      is_active: true,
      allow_override: false,
    },
    {
      id: 'policy-3',
      code: 'FOOD_MAX_50',
      name: 'Alimentacion maximo 50 MXN',
      expense_class: 'ALIF',
      applies_on: PolicyAppliesOn.VOUCHER,
      rule_type: PolicyRuleType.AMOUNT_LIMIT,
      params: { max_amount: 50, currency: 'MXN' },
      consequence: PolicyConsequence.POLICY_VIOLATION,
      severity: PolicySeverity.BLOCKING,
      is_active: true,
      allow_override: true,
      override_permission: 'reimbursement.policy.override',
    },
    {
      id: 'policy-4',
      code: 'ALL_TIME_LIMIT_4W',
      name: 'Tiempo limite de entrega 4 semanas',
      expense_class: 'ALL',
      applies_on: PolicyAppliesOn.REQUEST,
      rule_type: PolicyRuleType.TIME_LIMIT,
      params: { max_weeks_after_trip_end: 4 },
      consequence: PolicyConsequence.REIMBURSEMENT_CANCELLED,
      severity: PolicySeverity.BLOCKING,
      is_active: true,
      allow_override: false,
    },
  ];

  getAllActivePolicies(): Promise<PolicyRule[]> {
    return Promise.resolve(this.policies.filter((p) => p.is_active));
  }

  getPoliciesForContext(
    expenseClass: string,
    appliesOn: PolicyAppliesOn,
  ): Promise<PolicyRule[]> {
    const normalizedExpenseClass = normalizeVoucherSpendClass(expenseClass);

    return Promise.resolve(
      this.policies.filter(
        (p) =>
          p.is_active &&
          p.applies_on === appliesOn &&
          (p.expense_class === 'ALL' ||
            p.expense_class === normalizedExpenseClass),
      ),
    );
  }
}
