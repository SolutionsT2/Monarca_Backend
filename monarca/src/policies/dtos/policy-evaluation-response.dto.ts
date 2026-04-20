/**
 * File: policy-evaluation-response.dto.ts
 * Description: DTO for policy evaluation API response.
 */

import { PolicyEvaluationResult } from '../types/policy.types';

export class PolicyEvaluationResponseDto {
  can_submit: boolean;
  total_rules: number;
  passed: number;
  failed: number;
  blocking_violations: number;
  violations: PolicyEvaluationResult[];
}
