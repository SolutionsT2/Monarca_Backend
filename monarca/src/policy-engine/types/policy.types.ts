/**
 * File: policy.types.ts
 * Description: Contract used by the DB-backed policy engine and submit flow.
 */

export enum PolicySeverity {
  BLOCKING = 'BLOCKING',
  WARNING = 'WARNING',
}

export enum PolicyConsequence {
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  REIMBURSEMENT_CANCELLED = 'REIMBURSEMENT_CANCELLED',
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
  evaluated_value?: Record<string, unknown>;
}

export interface PolicyValidationSummary {
  total_rules: number;
  passed: number;
  failed: number;
  blocking_violations: number;
  can_submit: boolean;
  violations: PolicyEvaluationResult[];
}
