/**
 * File: approval-rules.controller.ts
 * Description: REST controller exposing CRUD and approver-resolution endpoints
 * for approval rules. All endpoints require a valid JWT session.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApprovalRulesService } from './approval-rules.service';
import {
  CreateApprovalRuleDto,
  UpdateApprovalRuleDto,
  ResolveApproversDto,
} from './dto/approval-rules.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('approval-rules')
export class ApprovalRulesController {
  constructor(private readonly approvalRulesService: ApprovalRulesService) {}

  /**
   * Returns all approval rules with their conditions and steps.
   */
  @Get()
  findAll() {
    return this.approvalRulesService.findAll();
  }

  /**
   * Returns a single approval rule by its UUID.
   * @param id Rule UUID.
   */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.approvalRulesService.findOne(id);
  }

  /**
   * Creates a new approval rule with conditions and steps.
   */
  @Post()
  create(@Body() dto: CreateApprovalRuleDto) {
    return this.approvalRulesService.create(dto);
  }

  /**
   * Updates an existing approval rule. Replaces conditions and steps entirely.
   * @param id Rule UUID to update.
   */
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApprovalRuleDto,
  ) {
    return this.approvalRulesService.update(id, dto);
  }

  /**
   * Deletes an approval rule by ID.
   * @param id Rule UUID to delete.
   */
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.approvalRulesService.remove(id);
  }

  /**
   * Resolves who would approve a request matching the given context.
   * Finds the first active rule whose conditions match, then resolves each step:
   * role steps return the roleId; hierarchy steps return the resolved manager chain.
   * Returns null when no rule matches.
   */
  @Post('resolve-approvers')
  resolveApprovers(@Body() dto: ResolveApproversDto) {
    return this.approvalRulesService.resolveApprovers(dto);
  }
}

/*
 * Modification History:
 * - 2026-05-12 | Juan de Dios Gastélum | Initial file creation.
 */
