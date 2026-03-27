/**
 * File: policy.types.ts
 * Description: Core enums and interfaces for policy evaluation.
 */

export enum PolicyRuleType {
  TOTAL_VOUCHERS_LIMIT = 'TOTAL_VOUCHERS_LIMIT',
  FILE_REQUIRED = 'FILE_REQUIRED',
  AMOUNT_LIMIT = 'AMOUNT_LIMIT',
  TIME_LIMIT = 'TIME_LIMIT',
}

export enum PolicyAppliesOn {
  REQUEST = 'REQUEST',
  VOUCHER = 'VOUCHER',
}

export enum PolicySeverity {
  BLOCKING = 'BLOCKING',
  WARNING = 'WARNING',
}

export enum PolicyConsequence {
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  REIMBURSEMENT_CANCELLED = 'REIMBURSEMENT_CANCELLED',
}

export interface PolicyRule {
  id: string;
  code: string;
  name: string;
  expense_class: string;
  applies_on: PolicyAppliesOn;
  rule_type: PolicyRuleType;
  params: Record<string, unknown>;
  consequence: PolicyConsequence;
  severity: PolicySeverity;
  is_active: boolean;
  allow_override: boolean;
  override_permission?: string;
}

export interface RequestPolicyContext {
  id: string;
  advance_money: number;
  createdAt: Date;
}

export interface VoucherPolicyContext {
  id: string;
  id_request: string;
  class: string;
  amount: number;
  currency: string;
  file_url_pdf: string | null;
  file_url_xml: string | null;
  date: Date;
}

export interface PolicyEvaluationResult {
  policy_id: string;
  policy_code: string;
  passed: boolean;
  message: string;
  severity: PolicySeverity;
  consequence: PolicyConsequence;
  can_override: boolean;
  evaluated_value?: Record<string, any>;
}

export interface PolicyValidationSummary {
  total_rules: number;
  passed: number;
  failed: number;
  blocking_violations: number;
  can_submit: boolean;
  violations: PolicyEvaluationResult[];
}
