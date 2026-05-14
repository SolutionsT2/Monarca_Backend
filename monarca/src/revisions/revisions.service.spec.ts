/**
 * File: revisions.service.spec.ts
 * Description: Unit tests for RevisionsService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RevisionsService } from './revisions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Revision } from './entities/revision.entity';
import { RequestsService } from 'src/requests/requests.service';
import { RequestsChecks } from 'src/requests/requests.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserChecks } from 'src/users/user.checks.service';

describe('RevisionsService', () => {
  let service: RevisionsService;
  let revisionRepo: { create: jest.Mock; save: jest.Mock };
  let requestService: {
    getRequestById: jest.Mock;
    updateStatus: jest.Mock;
    buildRequestSummaryHtml: jest.Mock;
    getLoginUrl: jest.Mock;
  };
  let requestChecks: {
    requestExists: jest.Mock;
    isRequestsAdmin: jest.Mock;
    getRequestStatus: jest.Mock;
  };
  let notificationsService: { notifyOrWarn: jest.Mock };
  let userChecks: { getUserById: jest.Mock };

  beforeEach(async () => {
    revisionRepo = {
      create: jest.fn((payload) => payload),
      save: jest.fn().mockResolvedValue({ id: 'rev-1' }),
    };
    requestService = {
      getRequestById: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue({ id: 'req-1' }),
      buildRequestSummaryHtml: jest.fn().mockReturnValue('<p>SUMMARY</p>'),
      getLoginUrl: jest.fn().mockReturnValue('http://app.local/dashboard'),
    };
    requestChecks = {
      requestExists: jest.fn().mockResolvedValue(true),
      isRequestsAdmin: jest.fn().mockResolvedValue(true),
      getRequestStatus: jest.fn().mockResolvedValue('Pending Review'),
    };
    notificationsService = { notifyOrWarn: jest.fn().mockResolvedValue(null) };
    userChecks = {
      getUserById: jest.fn().mockResolvedValue({
        id: 'admin-1',
        name: 'Approver',
        email: 'admin@corp.com',
        role: { name: 'Approver' },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevisionsService,
        { provide: getRepositoryToken(Revision), useValue: revisionRepo },
        { provide: RequestsService, useValue: requestService },
        { provide: RequestsChecks, useValue: requestChecks },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: UserChecks, useValue: userChecks },
      ],
    }).compile();

    service = module.get<RevisionsService>(RevisionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should notify requester with summary and login link', async () => {
    requestService.getRequestById.mockResolvedValue({
      id: 'req-1',
      title: 'Viaje',
      user: { name: 'Requester', email: 'req@corp.com' },
    });

    await service.create(
      { sessionInfo: { id: 'admin-1' } } as any,
      { id_request: 'req-1', comment: 'Falta evidencia' } as any,
    );

    expect(notificationsService.notifyOrWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'req@corp.com',
        subject: 'Solicitud con cambios necesarios',
        html: expect.stringContaining('SUMMARY'),
      }),
    );
    expect(requestService.updateStatus).toHaveBeenCalledWith(
      'req-1',
      'Changes Needed',
    );
    expect(revisionRepo.save).toHaveBeenCalled();
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-04-15: Santiago Arista | Refactored providers for testing
 */
