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

    let hasBlockingViolation = false;

    for (const rule of rules) {
      const operator = this.normalizeOperator(rule.operator);
      if (
        this.isGlobalExpenseClass(rule.expense_class) &&
        this.hasSpecificRuleForOperator(rules, operator, voucher.class)
      ) {
        continue;
      }

      const violated = this.evaluateRule(rule, voucher);
      if (violated) {
        const severity = this.resolveSeverity(rule); // Guardamos la severidad real

        if (severity === PolicySeverity.BLOCKING) {
          hasBlockingViolation = true;
        }
        console.warn(
          `[${this.contextLabel}][VOUCHER_EVALUATION] Policy violated`,
          JSON.stringify(
            {
              voucher_id: voucher.id,
              policy_rule_id: rule.id,
              severity: severity
            },
            null,
            2,
          ),
        );

        const violation = this.policyViolationRepo.create({
          id_voucher: voucher.id,
          id_policy_rule: rule.id,
          detail: `ERROR: El comprobante incumple la política de montos. Se requiere ${this.getOperatorDescription(operator)} (${rule.threshold_value}).`,
        });
        const savedViolation = await this.policyViolationRepo.save(violation);

        // 2. IMPORTANTE: Solo agregamos al array de retorno si es un BLOQUEO
        // Esto evitará que el servicio que llama a esta función dispare el error 422
        if (severity === PolicySeverity.BLOCKING) {
          violations.push(savedViolation);
        }
      }
    }

    const policy_status = hasBlockingViolation ? 'POLICY_VIOLATION' : 'APPROVED';
    await this.voucherRepo.update(voucher.id, { policy_status });

    return violations;
  }

  async evaluateRequestSubmission(
    requestContext: RequestPolicyContext,
    vouchers: VoucherPolicyContext[],
    options?: { persist?: boolean },
  ): Promise<PolicyValidationSummary> {
    const uniqueVouchers = Array.from(
      new Map(vouchers.map((voucher) => [voucher.id, voucher])).values(),
    );
    const shouldPersist = options?.persist ?? true;
    const voucherRowById = new Map(
      uniqueVouchers.map((voucher, index) => [voucher.id, index + 1]),
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
        const evaluation = this.evaluateRequestLevelRule(
          rule,
          operator,
          requestContext,
          uniqueVouchers,
        );

        if (operator === 'VOUCHER_DATE_WITHIN_TRIP_WINDOW') {
          evaluations.push(
            ...this.expandTripWindowEvaluations(evaluation, voucherRowById),
          );
          continue;
        }

        evaluations.push(evaluation);
        continue;
      }

      for (const voucher of uniqueVouchers) {
        if (
          this.isGlobalExpenseClass(rule.expense_class) &&
          this.hasSpecificRuleForOperator(activeRules, operator, voucher.class)
        ) {
          continue;
        }

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
    if (shouldPersist) {
      await this.persistViolations(evaluations);
      await this.updateVoucherPolicyStatus(uniqueVouchers, evaluations);
    }

    return summary;
  }

  private normalizeOperator(operator: string): string {
    return operator.trim().toUpperCase();
  }

  private isGlobalExpenseClass(expenseClass: string): boolean {
    const normalizedClass = normalizeVoucherSpendClass(expenseClass);
    return GLOBAL_EXPENSE_CLASSES.has(normalizedClass);
  }

  private hasSpecificRuleForOperator(
    rules: PolicyRule[],
    operator: string,
    voucherClass: string,
  ): boolean {
    const normalizedVoucherClass = normalizeVoucherSpendClass(voucherClass);
    return rules.some((rule) => {
      const ruleOperator = this.normalizeOperator(rule.operator);
      if (ruleOperator !== operator) {
        return false;
      }

      const ruleClass = normalizeVoucherSpendClass(rule.expense_class);
      return !GLOBAL_EXPENSE_CLASSES.has(ruleClass) && ruleClass === normalizedVoucherClass;
    });
  }

  private getOperatorDescription(operator: string): string {
    switch (operator) {
      case 'LT':
        return 'Monto menor que el umbral';
      case 'LTE':
        return 'Monto menor o igual al umbral';
      case 'GT':
        return 'Monto mayor que el umbral';
      case 'GTE':
        return 'Monto mayor o igual al umbral';
      default:
        return operator;
    }
  }

  private expandTripWindowEvaluations(
    evaluation: EvaluatedRuleResult,
    voucherRowById: Map<string, number>,
  ): EvaluatedRuleResult[] {
    if (evaluation.passed) {
      return [evaluation];
    }

    const outOfWindowIds = this.extractOutOfWindowVoucherIds(evaluation);
    if (!outOfWindowIds.length) {
      return [evaluation];
    }

    const tripWindowLabel = this.formatTripWindowLabel(evaluation);
    const rangeSuffix = tripWindowLabel ? ` (rango permitido: ${tripWindowLabel})` : '';

    return outOfWindowIds.map((voucherId) => {
      const row = voucherRowById.get(voucherId);
      const rowLabel = row ? `fila ${row}` : 'fila desconocida';
      return {
        ...evaluation,
        voucher_id: voucherId,
        message: `ERROR: La fecha del comprobante en ${rowLabel} está fuera de la ventana del viaje permitida.${rangeSuffix}`,
      };
    });
  }

  private allowPreTripVoucherDatesForTesting(): boolean {
    return process.env.ALLOW_PRETRIP_VOUCHER_DATES_FOR_TESTS?.toLowerCase() === 'true';
  }

  private allowVoucherAmountThresholdBypassForTesting(): boolean {
    return process.env.ALLOW_VOUCHER_AMOUNT_RULE_BYPASS_FOR_TESTS?.toLowerCase() === 'true';
  }

  private formatDateForMessage(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private toUtcDateKey(date: Date): number {
    return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  }

  private formatTripWindowLabel(evaluation: EvaluatedRuleResult): string | null {
    const evaluatedValue = evaluation.evaluated_value as
      | { trip_start_date?: unknown; trip_end_date?: unknown }
      | undefined;

    if (!evaluatedValue?.trip_start_date || !evaluatedValue?.trip_end_date) {
      return null;
    }

    const start = new Date(String(evaluatedValue.trip_start_date));
    const end = new Date(String(evaluatedValue.trip_end_date));

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }

    return `${this.formatDateForMessage(start)} - ${this.formatDateForMessage(end)}`;
  }

  private resolvePolicyAmount(voucher: {
    amount: number;
    amount_mxn?: number | null;
    currency?: string | null;
  }): { amount: number; currency: string } {
    const normalizedAmountMxn =
      typeof voucher.amount_mxn === 'number' && Number.isFinite(voucher.amount_mxn)
        ? voucher.amount_mxn
        : null;

    if (normalizedAmountMxn !== null) {
      return { amount: normalizedAmountMxn, currency: 'MXN' };
    }

    const normalizedAmount = Number(voucher.amount);
    return {
      amount: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
      currency: voucher.currency || 'MXN',
    };
  }

  private resolveSeverity(_rule: PolicyRule): PolicySeverity {
    return PolicySeverity.WARNING;
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
      const warningBase = {
        ...base,
        severity: PolicySeverity.WARNING,
      };

      const totalVouchers = vouchers.reduce((sum, voucher) => {
        const { amount } = this.resolvePolicyAmount(voucher);
        return sum + amount;
      }, 0);
      const passed = totalVouchers <= requestContext.advance_money;

      return {
        ...warningBase,
        passed,
        message: passed
          ? `El monto total de los comprobantes (${totalVouchers}) está dentro del anticipo permitido (${requestContext.advance_money}).`
          : `ADVERTENCIA: El monto total de los comprobantes (${totalVouchers}) excede el anticipo asignado (${requestContext.advance_money}). Esto será revisado durante el procesamiento del reembolso.`,
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
          ? `La solicitud se envió dentro del plazo permitido de ${limit} día(s).`
          : `ERROR: La solicitud ha excedido el plazo máximo de ${limit} día(s) permitidos.`,
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
          message: 'La validación de fechas de comprobantes dentro de la ventana del viaje ha sido omitida en modo de prueba.',
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
          message: 'No hay fechas definidas para la ventana del viaje. La validación de fechas de comprobantes ha sido omitida.',
          evaluated_value: {
            trip_start_date: requestContext.trip_start_date ?? null,
            trip_end_date: requestContext.trip_end_date ?? null,
          },
        };
      }

      const tripStartKey = this.toUtcDateKey(tripStart);
      const tripEndKey = this.toUtcDateKey(tripEnd);

      const outOfWindowVouchers = vouchers.filter((voucher) => {
        const voucherDate = new Date(voucher.date);
        if (Number.isNaN(voucherDate.getTime())) {
          return true;
        }

        const voucherKey = this.toUtcDateKey(voucherDate);
        return voucherKey < tripStartKey || voucherKey > tripEndKey;
      });

      const passed = outOfWindowVouchers.length === 0;
      const tripWindowLabel = `${this.formatDateForMessage(tripStart)} - ${this.formatDateForMessage(tripEnd)}`;

      return {
        ...base,
        passed,
        message: passed
          ? `Todas las fechas de los comprobantes están dentro de la ventana del viaje (${tripWindowLabel}).`
          : `ERROR: Una o más fechas de comprobantes se encuentran fuera de la ventana del viaje permitida (${tripWindowLabel}).`,
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
      message: 'El operador de esta regla aún no ha sido implementado en el sistema.',
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
      const passed = Boolean(voucher.is_foreign) || !!voucher.file_url_xml;
      return {
        ...base,
        voucher_id: voucher.id,
        passed,
        message: passed ? 'El comprobante contiene el archivo XML requerido.' : 'ERROR: El comprobante no tiene el archivo XML. Este es obligatorio.',
      };
    }

    if (operator === 'MISSING_PDF') {
      const passed = !!voucher.file_url_pdf;
      return {
        ...base,
        voucher_id: voucher.id,
        passed,
        message: passed ? 'El comprobante contiene el archivo PDF requerido.' : 'ERROR: El comprobante no tiene el archivo PDF. Este es obligatorio.',
      };
    }

    if (operator === 'MISSING_FILE') {
      const passed = !!voucher.file_url_pdf || !!voucher.file_url_xml;
      return {
        ...base,
        voucher_id: voucher.id,
        passed,
        message: passed
          ? 'El comprobante contiene al menos uno de los archivos requeridos (PDF o XML).'
          : 'ERROR: El comprobante no tiene ni PDF ni XML. Se requiere al menos uno de estos archivos.',
      };
    }

    if (threshold === null) {
      return {
        ...base,
        voucher_id: voucher.id,
        passed: true,
        message: 'El umbral de esta regla no está configurado en el sistema.',
      };
    }

    if (
      this.allowVoucherAmountThresholdBypassForTesting() &&
      ['LT', 'LTE', 'GT', 'GTE'].includes(operator)
    ) {
      const { amount, currency } = this.resolvePolicyAmount(voucher);
      return {
        ...base,
        voucher_id: voucher.id,
        passed: true,
        message: `La validación de montos ha sido omitida en modo de prueba (${this.getOperatorDescription(operator)}).`,
        evaluated_value: {
          amount,
          operator,
          threshold,
          currency,
          bypass_amount_rule_for_tests: true,
        },
      };
    }

    const { amount, currency } = this.resolvePolicyAmount(voucher);
    let passed = true;
    let comparisonDescription = '';
    if (operator === 'LT') {
      passed = amount >= threshold;
      comparisonDescription = `debe ser mayor que ${threshold}`;
    } else if (operator === 'LTE') {
      passed = amount > threshold;
      comparisonDescription = `debe ser mayor o igual que ${threshold}`;
    } else if (operator === 'GT') {
      passed = amount <= threshold;
      comparisonDescription = `debe ser menor que ${threshold}`;
    } else if (operator === 'GTE') {
      passed = amount < threshold;
      comparisonDescription = `debe ser menor o igual que ${threshold}`;
    }

    return {
      ...base,
      voucher_id: voucher.id,
      passed,
      message: passed
        ? `El monto del comprobante (${amount}) cumple con la política: ${comparisonDescription}.`
        : `ERROR: El monto del comprobante (${amount} ) incumple la política: ${comparisonDescription}.`,
      evaluated_value: {
        amount,
        operator,
        threshold,
        currency,
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

  private async persistViolations(
    evaluations: EvaluatedRuleResult[],
  ): Promise<void> {
    const violationsToPersist = evaluations.filter(
      (evaluation) => !evaluation.passed,
    );

    if (!violationsToPersist.length) {
      return;
    }

    const persistedKeys = new Set<string>();

    for (const evaluation of violationsToPersist) {
      const voucherIds = evaluation.voucher_id
        ? [evaluation.voucher_id]
        : this.extractOutOfWindowVoucherIds(evaluation);

      if (!voucherIds.length) {
        continue;
      }

      for (const voucherId of voucherIds) {
        const violationKey = `${voucherId}:${evaluation.policy_id}`;
        if (persistedKeys.has(violationKey)) {
          continue;
        }

        const existingViolation = await this.policyViolationRepo.findOne({
          where: {
            id_voucher: voucherId,
            id_policy_rule: evaluation.policy_id,
          },
        });
        if (existingViolation) {
          persistedKeys.add(violationKey);
          continue;
        }

        const violation = this.policyViolationRepo.create({
          id_voucher: voucherId,
          id_policy_rule: evaluation.policy_id,
          detail: evaluation.message,
        });
        await this.policyViolationRepo.save(violation);
        persistedKeys.add(violationKey);
      }
    }
  }

  private extractOutOfWindowVoucherIds(evaluation: EvaluatedRuleResult): string[] {
    const evaluatedValue = evaluation.evaluated_value as
      | { out_of_window_voucher_ids?: unknown }
      | undefined;
    if (!evaluatedValue?.out_of_window_voucher_ids) {
      return [];
    }

    return Array.isArray(evaluatedValue.out_of_window_voucher_ids)
      ? evaluatedValue.out_of_window_voucher_ids.filter(
          (voucherId): voucherId is string => typeof voucherId === 'string',
        )
      : [];
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
        return typeof threshold === 'number'
          ? this.resolvePolicyAmount(voucher).amount < threshold
          : false;
      case 'MISSING_XML':
        return !voucher.is_foreign && !voucher.file_url_xml;
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