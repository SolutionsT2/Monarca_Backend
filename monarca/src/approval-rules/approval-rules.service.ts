/**
 * File: approval-rules.service.ts
 * Description: Business logic for CRUD of approval rules and runtime resolution
 * of approvers based on matching conditions and step type (role or hierarchy).
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalRule } from './entities/approval-rule.entity';
import { ApprovalRuleCondition } from './entities/approval-rule-condition.entity';
import { ApprovalRuleStep } from './entities/approval-rule-step.entity';
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
    private readonly hierarchyResolver: HierarchyResolverService,
  ) {}

  /**
   * Returns all approval rules with their conditions and steps.
   */
  async findAll(): Promise<ApprovalRule[]> {
    return this.rulesRepo.find({
      relations: ['conditions', 'steps', 'steps.role'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns a single approval rule by ID, including conditions and steps.
   * @param id Rule UUID.
   */
  async findOne(id: string): Promise<ApprovalRule> {
    const rule = await this.rulesRepo.findOne({
      where: { id },
      relations: ['conditions', 'steps', 'steps.role'],
    });
    if (!rule) throw new NotFoundException(`Approval rule ${id} not found`);
    return rule;
  }

  /**
   * Creates a new approval rule with its conditions and steps.
   * @param dto Validated creation payload.
   */
  async create(dto: CreateApprovalRuleDto): Promise<ApprovalRule> {
    this.validateStepFields(dto.steps);

    const rule = this.rulesRepo.create({
      name: dto.name,
      description: dto.description,
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
   * Replaces conditions and steps of an existing rule entirely.
   * @param id Rule UUID.
   * @param dto Validated update payload.
   */
  async update(id: string, dto: UpdateApprovalRuleDto): Promise<ApprovalRule> {
    const rule = await this.findOne(id);

    if (dto.steps) this.validateStepFields(dto.steps);

    // Remove old children; cascade does not apply on partial updates
    await this.conditionsRepo.delete({ idRule: id });
    await this.stepsRepo.delete({ idRule: id });

    Object.assign(rule, {
      name: dto.name ?? rule.name,
      description: dto.description ?? rule.description,
      isActive: dto.isActive ?? rule.isActive,
      conditions: (dto.conditions ?? []).map((c) =>
        this.conditionsRepo.create({ ...c, idRule: id }),
      ),
      steps: (dto.steps ?? []).map((s) =>
        this.stepsRepo.create({
          idRule: id,
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
   * Deletes an approval rule (conditions and steps are removed by CASCADE).
   * @param id Rule UUID.
   */
  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.rulesRepo.remove(rule);
  }

  /**
   * Finds the first active rule whose conditions match the request payload,
   * then resolves each step: role steps return the roleId,
   * hierarchy steps walk the manager chain and return the resolved managers.
   * Returns null when no rule matches (caller should fall back to default logic).
   * @param dto Request context: userId + optional tripType, cost, priority.
   */
  async resolveApprovers(
    dto: ResolveApproversDto,
  ): Promise<ResolveApproversResult | null> {
    const rules = await this.rulesRepo.find({
      where: { isActive: true },
      relations: ['conditions', 'steps'],
      order: { createdAt: 'ASC' },
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
          return {
            order: step.order,
            stepType: 'role',
            minApprovals: step.minApprovals,
            roleId: step.idRole,
          };
        }

        const levels = step.hierarchyLevel ?? 0;
        const managers = await this.hierarchyResolver.resolveManagerChain(
          dto.userId,
          levels,
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
   * Validates that each step carries the fields required by its stepType.
   * Throws BadRequestException on the first invalid step found.
   */
  private validateStepFields(steps: CreateApprovalRuleDto['steps']): void {
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
}

/*
 * Modification History:
 * - 2026-05-12 | Juan de Dios Gastélum | Initial file creation.
 */
