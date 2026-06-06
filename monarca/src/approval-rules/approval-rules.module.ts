/**
 * File: approval-rules.module.ts
 * Description: Feature module that bundles approval rules management
 * and hierarchy resolution capabilities.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalRule } from './entities/approval-rule.entity';
import { ApprovalRuleCondition } from './entities/approval-rule-condition.entity';
import { ApprovalRuleStep } from './entities/approval-rule-step.entity';
import { User } from 'src/users/entities/user.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { ApprovalRulesService } from './approval-rules.service';
import { ApprovalRulesController } from './approval-rules.controller';
import { HierarchyResolverService } from 'src/users/hierarchy-resolver.service';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApprovalRule,
      ApprovalRuleCondition,
      ApprovalRuleStep,
      User,
      Department,
      Roles,
    ]),
    GuardsModule,
  ],
  providers: [ApprovalRulesService, HierarchyResolverService],
  controllers: [ApprovalRulesController],
  exports: [ApprovalRulesService, HierarchyResolverService],
})
export class ApprovalRulesModule {}

/*
 * Modification History:
 * - 2026-05-12 | Juan de Dios Gastélum | Initial file creation.
 * - 2026-05-26 | Juan de Dios Gastélum | Added Department entity for company resolution.
 * - 2026-06-06 | Juan de Dios Gastélum Flores | Added Roles entity for Aprobador role lookup in hierarchy resolution.
 */
