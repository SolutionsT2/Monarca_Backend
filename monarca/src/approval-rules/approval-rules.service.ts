/**
 * File: approval-rules.service.ts
 * Description: Business logic for CRUD of approval rules and runtime resolution
 * of approvers based on matching conditions and step type (role or hierarchy).
 * All operations are scoped to the company of the requesting user.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApprovalRule } from './entities/approval-rule.entity';
import { ApprovalRuleCondition } from './entities/approval-rule-condition.entity';
import { ApprovalRuleStep } from './entities/approval-rule-step.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { Department } from 'src/departments/entity/department.entity';
import { User } from 'src/users/entities/user.entity';
import {
  CreateApprovalRuleDto,
  UpdateApprovalRuleDto,
  ResolveApproversDto,
} from './dto/approval-rules.dto';
import {
  HierarchyResolverService,
  ResolvedManager,
} from 'src/users/hierarchy-resolver.service';

export interface ResolvedStep {
  order: number;
  stepType: 'role' | 'hierarchy';
  minApprovals: number;
  roleId?: string | null;
  resolvedManagers?: ResolvedManager[];
  warning?: string;
}

export interface ResolveApproversResult {
  ruleId: string;
  ruleName: string;
  steps: ResolvedStep[];
}

@Injectable()
export class ApprovalRulesService {
  constructor(
    @InjectRepository(ApprovalRule)
    private readonly rulesRepo: Repository<ApprovalRule>,
    @InjectRepository(ApprovalRuleCondition)
    private readonly conditionsRepo: Repository<ApprovalRuleCondition>,
    @InjectRepository(ApprovalRuleStep)
    private readonly stepsRepo: Repository<ApprovalRuleStep>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Roles)
    private readonly rolesRepo: Repository<Roles>,
    private readonly hierarchyResolver: HierarchyResolverService,
  ) {}

  /**
   * Resolves the company ID from a department ID.
   * @param departmentId User's department UUID.
   */
  async resolveCompanyId(departmentId: string): Promise<string> {
    const dept = await this.departmentRepo.findOne({
      where: { id: departmentId },
      select: ['id', 'id_company'],
    });
    if (!dept?.id_company) {
      throw new BadRequestException('Company context not found for user.');
    }
    return dept.id_company;
  }

  /**
   * Returns all approval rules for the user's company.
   * @param departmentId User's department UUID.
   */
  async findAll(departmentId: string): Promise<ApprovalRule[]> {
    const companyId = await this.resolveCompanyId(departmentId);
    return this.rulesRepo.find({
      where: { idCompany: companyId },
      relations: ['conditions', 'steps', 'steps.role'],
      order: { priority: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Returns a single approval rule by ID, scoped to the user's company.
   * @param id Rule UUID.
   * @param departmentId User's department UUID.
   */
  async findOne(id: string, departmentId: string): Promise<ApprovalRule> {
    const companyId = await this.resolveCompanyId(departmentId);
    const rule = await this.rulesRepo.findOne({
      where: { id, idCompany: companyId },
      relations: ['conditions', 'steps', 'steps.role'],
    });
    if (!rule) throw new NotFoundException(`Approval rule ${id} not found`);
    return rule;
  }

  /**
   * Creates a new approval rule scoped to the user's company.
   * @param dto Validated creation payload.
   * @param departmentId User's department UUID.
   */
  async create(
    dto: CreateApprovalRuleDto,
    departmentId: string,
  ): Promise<ApprovalRule> {
    const companyId = await this.resolveCompanyId(departmentId);
    this.validateStepFields(dto.steps);
    this.validateConditionLogic(dto.conditions);
    await this.assertNameUnique(dto.name, companyId);

    const maxResult = await this.rulesRepo
      .createQueryBuilder('rule')
      .select('MAX(rule.priority)', 'max')
      .where('rule.idCompany = :companyId', { companyId })
      .getRawOne<{ max: number | null }>();
    const nextPriority = (maxResult?.max ?? -1) + 1;

    const rule = this.rulesRepo.create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
      priority: dto.priority ?? nextPriority,
      idCompany: companyId,
      conditions: dto.conditions.map((c) => this.conditionsRepo.create(c)),
      steps: dto.steps.map((s) =>
        this.stepsRepo.create({
          order: s.order,
          stepType: s.stepType,
          idRole: s.idRole ?? null,
          hierarchyLevel: s.hierarchyLevel ?? null,
          minApprovals: s.minApprovals,
        }),
      ),
    });

    return this.rulesRepo.save(rule);
  }

  /**
   * Replaces only the fields explicitly provided in the payload.
   * Conditions and steps are replaced only when included in the request;
   * omitting them preserves the existing values.
   * @param id Rule UUID.
   * @param dto Validated update payload.
   * @param departmentId User's department UUID.
   */
  async update(
    id: string,
    dto: UpdateApprovalRuleDto,
    departmentId: string,
  ): Promise<ApprovalRule> {
    const rule = await this.findOne(id, departmentId);

    if (dto.name !== undefined && dto.name !== rule.name && rule.idCompany) {
      await this.assertNameUnique(dto.name, rule.idCompany, id);
    }
    rule.name = dto.name ?? rule.name;
    rule.description = dto.description ?? rule.description;
    rule.isActive = dto.isActive ?? rule.isActive;
    rule.priority = dto.priority ?? rule.priority;

    if (dto.conditions !== undefined) {
      this.validateStepFields(dto.steps ?? []);
      this.validateConditionLogic(dto.conditions);
      await this.conditionsRepo.delete({ idRule: id });
      rule.conditions = dto.conditions.map((c) =>
        this.conditionsRepo.create({ ...c, idRule: id }),
      );
    }

    if (dto.steps !== undefined) {
      this.validateStepFields(dto.steps);
      await this.stepsRepo.delete({ idRule: id });
      rule.steps = dto.steps.map((s) =>
        this.stepsRepo.create({
          idRule: id,
          order: s.order,
          stepType: s.stepType,
          idRole: s.idRole ?? null,
          hierarchyLevel: s.hierarchyLevel ?? null,
          minApprovals: s.minApprovals,
        }),
      );
    }

    return this.rulesRepo.save(rule);
  }

  /**
   * Deletes an approval rule, scoped to the user's company.
   * @param id Rule UUID.
   * @param departmentId User's department UUID.
   */
  async remove(id: string, departmentId: string): Promise<void> {
    const rule = await this.findOne(id, departmentId);
    await this.rulesRepo.remove(rule);
  }

  /**
   * Finds the first active rule for the given company whose conditions match,
   * then resolves each step. Returns null when no rule matches.
   * - hierarchy steps: walks the manager chain up to hierarchyLevel levels.
   * - role steps: finds all users in the company that hold the specified role.
   * @param dto Request context: userId + optional tripType, cost, priority.
   * @param companyId Company to scope rule lookup.
   */
  async resolveApprovers(
    dto: ResolveApproversDto,
    companyId: string,
  ): Promise<ResolveApproversResult | null> {
    const rules = await this.rulesRepo.find({
      where: { isActive: true, idCompany: companyId },
      relations: ['conditions', 'steps'],
      order: { priority: 'ASC', createdAt: 'ASC' },
    });

    const matchingRule = rules.find((r) =>
      this.evaluateConditions(r.conditions, dto),
    );
    if (!matchingRule) return null;

    const sortedSteps = [...matchingRule.steps].sort(
      (a, b) => a.order - b.order,
    );

    const resolvedSteps: ResolvedStep[] = await Promise.all(
      sortedSteps.map(async (step): Promise<ResolvedStep> => {
        if (step.stepType === 'role') {
          return this.resolveRoleStep(step, companyId);
        }

        const levels = step.hierarchyLevel ?? 0;

        const aprobadorRole = await this.rolesRepo.findOne({
          where: { name: 'Aprobador' },
          select: ['id'],
        });

        const managers = await this.hierarchyResolver.resolveManagerChain(
          dto.userId,
          levels,
          aprobadorRole?.id,
        );

        const warning =
          managers.length < levels
            ? `Hierarchy chain has only ${managers.length} level(s); ${levels} requested`
            : undefined;

        return {
          order: step.order,
          stepType: 'hierarchy',
          minApprovals: step.minApprovals,
          resolvedManagers: managers,
          warning,
        };
      }),
    );

    return {
      ruleId: matchingRule.id,
      ruleName: matchingRule.name,
      steps: resolvedSteps,
    };
  }

  /**
   * Resolves a role-type step by finding all active users in the company
   * that hold the specified role.
   * @param step The approval rule step with stepType === 'role'.
   * @param companyId Company scope for user lookup.
   */
  private async resolveRoleStep(
    step: ApprovalRuleStep,
    companyId: string,
  ): Promise<ResolvedStep> {
    const depts = await this.departmentRepo.find({
      where: { id_company: companyId },
      select: ['id'],
    });

    const deptIds = depts.map((d) => d.id);

    if (deptIds.length === 0) {
      return {
        order: step.order,
        stepType: 'role',
        minApprovals: step.minApprovals,
        roleId: step.idRole,
        resolvedManagers: [],
        warning: 'No departments found for this company.',
      };
    }

    const roleUsers = await this.userRepo.find({
      where: { idRole: step.idRole ?? undefined, idDepartment: In(deptIds) },
      select: ['id', 'name', 'lastName', 'email'],
    });

    const warning =
      roleUsers.length === 0
        ? `No users found with role ${step.idRole} in this company.`
        : roleUsers.length < step.minApprovals
          ? `Only ${roleUsers.length} user(s) found with role ${step.idRole}; ${step.minApprovals} required.`
          : undefined;

    return {
      order: step.order,
      stepType: 'role',
      minApprovals: step.minApprovals,
      roleId: step.idRole,
      resolvedManagers: roleUsers.map((u, index) => ({
        level: index + 1,
        userId: u.id,
        name: u.name,
        lastName: u.lastName,
        email: u.email ?? '',
      })),
      warning,
    };
  }

  /**
   * Evaluates all conditions of a rule against the request data (AND logic).
   * A rule matches only when every condition is satisfied.
   */
  private evaluateConditions(
    conditions: ApprovalRuleCondition[],
    data: ResolveApproversDto,
  ): boolean {
    return conditions.every((c) => {
      if (c.field === 'trip_type') return data.tripType === c.value;
      if (c.field === 'priority') return data.priority === c.value;
      if (c.field === 'cost' && data.cost !== undefined) {
        const threshold = parseFloat(c.value);
        if (isNaN(threshold)) return false;
        switch (c.operator) {
          case 'gt':
            return data.cost > threshold;
          case 'gte':
            return data.cost >= threshold;
          case 'lt':
            return data.cost < threshold;
          case 'lte':
            return data.cost <= threshold;
          case 'eq':
            return data.cost === threshold;
        }
      }
      return false;
    });
  }

  /**
   * Validates that each step carries the fields required by its stepType,
   * and that no two steps share the same order value within the rule.
   * Throws BadRequestException on the first violation found.
   */
  private validateStepFields(steps: CreateApprovalRuleDto['steps']): void {
    const orders = steps.map((s) => s.order);
    if (new Set(orders).size !== orders.length) {
      throw new BadRequestException(
        'Step order values must be unique within a rule.',
      );
    }
    for (const s of steps) {
      if (s.stepType === 'role' && !s.idRole) {
        throw new BadRequestException(
          `Step order ${s.order}: role steps require idRole`,
        );
      }
      if (s.stepType === 'hierarchy' && !s.hierarchyLevel) {
        throw new BadRequestException(
          `Step order ${s.order}: hierarchy steps require hierarchyLevel`,
        );
      }
    }
  }
  /**
   * Validates that a set of conditions is logically satisfiable under AND semantics.
   * Rejects categorical contradictions and unsatisfiable cost ranges.
   * @param conditions Conditions to validate.
   */
  private validateConditionLogic(
    conditions: CreateApprovalRuleDto['conditions'],
  ): void {
    for (const field of ['trip_type', 'priority'] as const) {
      const fieldConditions = conditions.filter((c) => c.field === field);
      if (fieldConditions.length < 2) continue;
      const uniqueValues = [
        ...new Set(fieldConditions.map((c) => String(c.value))),
      ];
      if (uniqueValues.length > 1) {
        throw new BadRequestException(
          `Contradictory conditions for "${field}": a request cannot match multiple values simultaneously.`,
        );
      }
    }

    const costConditions = conditions.filter((c) => c.field === 'cost');
    if (costConditions.length < 2) return;

    let lowerBound = -Infinity;
    let lowerInclusive = true;
    let upperBound = Infinity;
    let upperInclusive = true;
    const eqValues: number[] = [];

    for (const c of costConditions) {
      const val = Number(c.value);
      if (isNaN(val)) continue;

      switch (c.operator) {
        case 'gt':
          if (val > lowerBound || (val === lowerBound && lowerInclusive)) {
            lowerBound = val;
            lowerInclusive = false;
          }
          break;
        case 'gte':
          if (val > lowerBound) {
            lowerBound = val;
            lowerInclusive = true;
          }
          break;
        case 'lt':
          if (val < upperBound || (val === upperBound && upperInclusive)) {
            upperBound = val;
            upperInclusive = false;
          }
          break;
        case 'lte':
          if (val < upperBound) {
            upperBound = val;
            upperInclusive = true;
          }
          break;
        case 'eq':
          eqValues.push(val);
          break;
      }
    }

    if (eqValues.length > 0) {
      const allInvalid = eqValues.every((eqVal) => {
        const aboveLower = lowerInclusive
          ? eqVal >= lowerBound
          : eqVal > lowerBound;
        const belowUpper = upperInclusive
          ? eqVal <= upperBound
          : eqVal < upperBound;
        return !(aboveLower && belowUpper);
      });
      if (allInvalid) {
        throw new BadRequestException(
          'Contradictory cost conditions: no amount can satisfy all conditions simultaneously.',
        );
      }
    } else {
      const rangeIsEmpty =
        lowerBound > upperBound ||
        (lowerBound === upperBound && (!lowerInclusive || !upperInclusive));
      if (rangeIsEmpty) {
        throw new BadRequestException(
          'Contradictory cost conditions: no amount can satisfy all conditions simultaneously.',
        );
      }
    }
  }
  /**
   * Throws BadRequestException if another rule in the same company already uses the given name.
   * @param name Rule name to check.
   * @param companyId Company scope.
   * @param excludeId Rule ID to exclude from the check; used during updates to allow keeping the same name.
   */
  private async assertNameUnique(
    name: string,
    companyId: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.rulesRepo.findOne({
      where: { name, idCompany: companyId },
      select: ['id'],
    });
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException(
        `A rule named "${name}" already exists for this company.`,
      );
    }
  }
}

/*
 * Modification History:
 * - 2026-05-12 | Juan de Dios Gastélum | Initial file creation.
 * - 2026-05-26 | Juan de Dios Gastélum | Added multi-tenant isolation: all operations scoped to the requesting user's company via idCompany. Fixed isActive ignored on create.
 */
