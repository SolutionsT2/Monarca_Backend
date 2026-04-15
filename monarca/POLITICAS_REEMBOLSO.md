# Reimbursement Policies In Monarca

## Objective
This document explains how the reimbursement policy module works in the backend, which entities compose it, how they are loaded from seeds, and how they affect the voucher submission flow.

## Main Components
- Policy: defines a general policy that can be active or inactive.
- PolicyRule: defines specific rules by expense class and operator.
- PolicyViolation: records each violation detected during evaluation.

## General Flow
1. Base policies are created in the policies table.
2. Rules are created in policy_rules linked by id_policy.
3. During voucher evaluation or request submission, the engine checks active rules.
4. If a rule fails:
   - it is added to summary.violations
   - it may create a record in policy_violations (if it is blocking and applicable)
   - it may mark vouchers as POLICY_VIOLATION
5. The final result determines whether the request can be submitted (can_submit).

## Policy Seeding
The seeder loads policies in this order:
1. policies.json
2. policy-rules.json
3. policy-violations.json

This order matters because of foreign keys:
- policy_rules.id_policy depends on policies.id
- policy_violations.id_policy_rule depends on policy_rules.id
- policy_violations.id_voucher depends on vouchers.id

## Supported Operators
Voucher-level rules:
- MISSING_XML: fails when XML is missing
- MISSING_PDF: fails when PDF is missing
- MISSING_FILE: fails when both PDF and XML are missing
- LT, LTE, GT, GTE: compare voucher amount against threshold_value

Request-level rules:
- TOTAL_LTE_ADVANCE
- TOTAL_VOUCHERS_LIMIT
- TOTAL_VOUCHERS_LTE_ADVANCE
- DAYS_EXCEEDED
- TIME_LIMIT
- VOUCHER_DATE_WITHIN_TRIP_WINDOW

## Severity And Consequence
- Severity:
  - BLOCKING: prevents submission when the rule fails
  - WARNING: only notifies
- Consequence:
  - POLICY_VIOLATION
  - REIMBURSEMENT_CANCELLED

## Evaluation Response Structure
The engine returns a summary with:
- total_rules
- passed
- failed
- blocking_violations
- can_submit
- violations[]

Each violations item contains:
- policy_id
- policy_code
- passed
- message
- severity
- consequence
- can_override
- evaluated_value (optional)

## Frontend Integration
For the frontend to display policies correctly:
- read can_submit to enable or block submission
- display violations with message, severity, and consequence
- use evaluated_value for technical detail

## Troubleshooting Checklist
If something does not appear in the frontend or does not block as expected:
1. Confirm records exist in policies and policy_rules.
2. Verify rules are active (is_active = true).
3. Confirm the rule expense_class matches the voucher class (or global class).
4. Check that threshold_value is set when required by the operator.
5. Validate that the request includes advance_money and valid dates for time-based rules.
6. Check policy_violations to confirm violations are being persisted.

## Technical Note
If you notice unexpected behavior in LT/LTE/GT/GTE rules, validate the comparison logic in the policy-engine service with boundary-value tests. This helps avoid incorrect blocks or approvals.

## Recommendations
- Keep the operator catalog documented and stable.
- Add unit tests per operator, including boundary cases.
- Version policy changes with traceability (who, when, and why).
- Avoid seeding policy_violations in production environments; they are usually generated at runtime.
