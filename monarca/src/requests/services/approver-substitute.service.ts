/**
 * File: approver-substitute.service.ts
 * Description: Resolves and applies approver substitutions when original approver is inactive.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Request as RequestEntity } from '../entities/request.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthorizationSubstitute } from 'src/roles/entity/authorization-substitute.entity';

@Injectable()
export class ApproverSubstituteService {
  private readonly logger = new Logger(ApproverSubstituteService.name);

  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(AuthorizationSubstitute)
    private readonly substituteRepo: Repository<AuthorizationSubstitute>,
  ) {}

  /**
   * Returns the active substitute for the role on the given date.
   * If there are multiple matches, the most recent startDate is selected.
   */
  async getActiveSubstituteByRole(
    roleId: string,
    today?: string,
  ): Promise<AuthorizationSubstitute | null> {
    const currentDate = today ?? this.getTodayDateString();

    const substitute = await this.substituteRepo
      .createQueryBuilder('sub')
      .where('sub.role_id = :roleId', { roleId })
      .andWhere('sub.start_date <= :currentDate', { currentDate })
      .andWhere('sub.end_date >= :currentDate', { currentDate })
      .orderBy('sub.start_date', 'DESC')
      .addOrderBy('sub.end_date', 'DESC')
      .getOne();

    return substitute ?? null;
  }

  /**
   * Resolves the effective approver id. If the original approver is inactive,
   * it tries to find an active substitute by role.
   */
  async resolveApprover(adminId: string): Promise<string> {
    const admin = await this.usersRepo.findOne({
      where: { id: adminId },
      select: ['id', 'idRole', 'availabilityStatus'],
    });

    if (!admin) {
      return adminId;
    }

    if (admin.availabilityStatus === 'active') {
      return adminId;
    }

    if (!admin.idRole) {
      return adminId;
    }

    const substitute = await this.getActiveSubstituteByRole(admin.idRole);
    if (!substitute || !substitute.targetUserId) {
      return adminId;
    }

    if (substitute.targetUserId === adminId) {
      return adminId;
    }

    return substitute.targetUserId;
  }

  /**
   * Reassigns request.id_admin when substitution is required.
   * Returns the updated request or null if request is not found.
   */
  async reassignRequestIfNeeded(
    requestId: string,
  ): Promise<RequestEntity | null> {
    const request = await this.requestsRepo.findOne({
      where: { id: requestId },
      select: ['id', 'id_admin', 'status'],
    });

    if (!request) {
      return null;
    }

    const resolvedApproverId = await this.resolveApprover(request.id_admin);
    if (resolvedApproverId === request.id_admin) {
      return request;
    }

    await this.requestsRepo.update(
      { id: request.id },
      { id_admin: resolvedApproverId },
    );

    this.logger.log(
      `Request ${request.id} reassigned from ${request.id_admin} to ${resolvedApproverId}`,
    );

    return this.requestsRepo.findOne({ where: { id: request.id } });
  }

  /**
   * Reassigns pending requests that should now belong to the substitute user.
   * Returns number of updated rows.
   */
  async reassignPendingForSubstituteUser(userId: string): Promise<number> {
    const requests = await this.requestsRepo.find({
      where: { status: In(['Pending Review', 'Pending Vouchers Approval']) },
      select: ['id', 'id_admin'],
    });

    let updates = 0;

    for (const req of requests) {
      const resolvedApproverId = await this.resolveApprover(req.id_admin);
      if (
        resolvedApproverId !== userId ||
        resolvedApproverId === req.id_admin
      ) {
        continue;
      }

      await this.requestsRepo.update(
        { id: req.id },
        { id_admin: resolvedApproverId },
      );
      updates += 1;

      this.logger.log(
        `Request ${req.id} reassigned from ${req.id_admin} to ${resolvedApproverId}`,
      );
    }

    return updates;
  }

  /**
   * Returns the active substitute assigned BY the given originalUserId for today.
   */
  async getActiveSubstituteByOriginalUser(
    originalUserId: string,
  ): Promise<AuthorizationSubstitute | null> {
    const today = this.getTodayDateString();
    const result = await this.substituteRepo
      .createQueryBuilder('sub')
      .where('sub.original_user_id = :originalUserId', { originalUserId })
      .andWhere('sub.start_date <= :today', { today })
      .andWhere('sub.end_date >= :today', { today })
      .orderBy('sub.start_date', 'DESC')
      .getOne();
    return result ?? null;
  }

  /**
   * Returns the IDs of all users for whom userId is currently an active substitute.
   */
  async getOriginalApproverIdsForSubstitute(
    substituteUserId: string,
  ): Promise<string[]> {
    const today = this.getTodayDateString();
    const rows = await this.substituteRepo
      .createQueryBuilder('sub')
      .select('sub.original_user_id', 'originalUserId')
      .where('sub.target_user_id = :substituteUserId', { substituteUserId })
      .andWhere('sub.start_date <= :today', { today })
      .andWhere('sub.end_date >= :today', { today })
      .getRawMany<{ originalUserId: string }>();
    return rows.map((r) => r.originalUserId);
  }

  /**
   * Returns true if userId is authorized to approve on behalf of approverId.
   * True when userId === approverId OR userId is an active substitute for approverId.
   */
  async isAuthorizedToApprove(
    approverId: string,
    userId: string,
  ): Promise<boolean> {
    if (userId === approverId) return true;
    const substitute = await this.getActiveSubstituteByOriginalUser(approverId);
    return substitute?.targetUserId === userId;
  }

  private getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

/*
Modification History:
- 2026-04-16 | AI Assistant | Initial service for approver substitution by active authorization_substitutes.
*/
