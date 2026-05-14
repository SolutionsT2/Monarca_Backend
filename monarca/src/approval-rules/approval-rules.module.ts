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
 */
