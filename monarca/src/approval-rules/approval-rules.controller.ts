/**
 * File: approval-rules.controller.ts
 * Description: REST controller exposing CRUD and approver-resolution endpoints
 * for approval rules. All endpoints require a valid JWT session and PermissionsGuard.
 * Mutating operations additionally require the manage_approval_rules permission.
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
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApprovalRulesService } from './approval-rules.service';
import {
  CreateApprovalRuleDto,
  UpdateApprovalRuleDto,
  ResolveApproversDto,
} from './dto/approval-rules.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from 'src/guards/decorators/permission.decorator';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('approval-rules')
export class ApprovalRulesController {
  constructor(private readonly approvalRulesService: ApprovalRulesService) {}

  /**
   * Returns all approval rules for the requesting user's company.
   */
  @Get()
  findAll(@Request() req: RequestInterface) {
    return this.approvalRulesService.findAll(this.resolveDepartmentId(req));
  }

  /**
   * Returns a single approval rule by its UUID, scoped to the user's company.
   * @param id Rule UUID.
   */
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: RequestInterface,
  ) {
    return this.approvalRulesService.findOne(id, this.resolveDepartmentId(req));
  }

  /**
   * Creates a new approval rule for the requesting user's company.
   */
  @Post()
  @Permissions('manage_approval_rules')
  create(@Body() dto: CreateApprovalRuleDto, @Request() req: RequestInterface) {
    return this.approvalRulesService.create(dto, this.resolveDepartmentId(req));
  }

  /**
   * Updates an existing approval rule. Replaces conditions and steps entirely.
   * @param id Rule UUID to update.
   */
  @Patch(':id')
  @Permissions('manage_approval_rules')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApprovalRuleDto,
    @Request() req: RequestInterface,
  ) {
    return this.approvalRulesService.update(
      id,
      dto,
      this.resolveDepartmentId(req),
    );
  }

  /**
   * Deletes an approval rule by ID, scoped to the user's company.
   * @param id Rule UUID to delete.
   */
  @Delete(':id')
  @Permissions('manage_approval_rules')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: RequestInterface,
  ) {
    return this.approvalRulesService.remove(id, this.resolveDepartmentId(req));
  }

  /**
   * Resolves who would approve a request matching the given context,
   * scoped to the requesting user's company.
   */
  @Post('resolve-approvers')
  @Permissions('manage_approval_rules')
  async resolveApprovers(
    @Body() dto: ResolveApproversDto,
    @Request() req: RequestInterface,
  ) {
    const companyId = await this.approvalRulesService.resolveCompanyId(
      this.resolveDepartmentId(req),
    );
    return this.approvalRulesService.resolveApprovers(dto, companyId);
  }

  /**
   * Extracts and validates the department ID from the request session.
   * Throws BadRequestException if the user has no department assigned.
   * @param req Authenticated request with userInfo populated by PermissionsGuard.
   */
  private resolveDepartmentId(req: RequestInterface): string {
    const departmentId = req.userInfo.id_department;
    if (!departmentId) {
      throw new BadRequestException(
        'User must belong to a company department to manage approval rules.',
      );
    }
    return departmentId;
  }
}

/*
 * Modification History:
 * - 2026-05-12 | Juan de Dios Gastélum | Initial file creation.
 * - 2026-05-26 | Juan de Dios Gastélum | Added PermissionsGuard and manage_approval_rules permission check. Scoped all operations to the requesting user's company.
 */
