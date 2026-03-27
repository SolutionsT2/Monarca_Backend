/**
 * File: policy-repository.interface.ts
 * Description: Repository abstraction for policy retrieval.
 */

import { PolicyAppliesOn, PolicyRule } from '../types/policy.types';

export interface IPolicyRepository {
  getAllActivePolicies(): Promise<PolicyRule[]>;
  getPoliciesForContext(
    expenseClass: string,
    appliesOn: PolicyAppliesOn,
  ): Promise<PolicyRule[]>;
}
