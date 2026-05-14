/**
 * File: requests.status.service.spec.ts
 * Description: Unit tests for RequestsStatusService notification flows.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestsStatusService } from './requests.status.service';
import { Request as RequestEntity } from './entities/request.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { Department } from 'src/departments/entity/department.entity';
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';
import { RequestsService } from './requests.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { TravelAgenciesChecks } from 'src/travel-agencies/travel-agencies.checks';
import { PolicyEngineService } from 'src/policy-engine/policy-engine.service';
import { ApproverSubstituteService } from './services/approver-substitute.service';
import { RequestApprovalStep } from './entities/request-approval-step.entity';

describe('RequestsStatusService', () => {
  let service: RequestsStatusService;
  let requestsRepo: { findOne: jest.Mock; update: jest.Mock };
  let vouchersRepo: { find: jest.Mock; delete: jest.Mock };
  let requestsService: {
    buildRequestSummaryHtml: jest.Mock;
    getLoginUrl: jest.Mock;
    updateStatus: jest.Mock;
  };
  let notificationsService: { notifyOrWarn: jest.Mock };
  let policyEngineService: { evaluateRequestSubmission: jest.Mock };

  beforeEach(async () => {
    requestsRepo = { findOne: jest.fn(), update: jest.fn() };
    vouchersRepo = { find: jest.fn(), delete: jest.fn() };
    requestsService = {
      buildRequestSummaryHtml: jest.fn().mockReturnValue('<p>SUMMARY</p>'),
      getLoginUrl: jest.fn().mockReturnValue('http://app.local/dashboard'),
      updateStatus: jest.fn().mockResolvedValue({ id: 'req-1' }),
    };
    notificationsService = { notifyOrWarn: jest.fn().mockResolvedValue(null) };
    policyEngineService = {
      evaluateRequestSubmission: jest.fn().mockResolvedValue({
        can_submit: true,
        violations: [],
        total_rules: 0,
        passed: 0,
        failed: 0,
        blocking_violations: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsStatusService,
        { provide: getRepositoryToken(RequestEntity), useValue: requestsRepo },
        { provide: getRepositoryToken(Voucher), useValue: vouchersRepo },
        { provide: getRepositoryToken(Department), useValue: {} },
        { provide: getRepositoryToken(RequestApprovalStep), useValue: {} },
        { provide: getRepositoryToken(DocumentClass), useValue: {} },
        { provide: RequestsService, useValue: requestsService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: TravelAgenciesChecks, useValue: {} },
        { provide: PolicyEngineService, useValue: policyEngineService },
        {
          provide: ApproverSubstituteService,
          useValue: {
            reassignRequestIfNeeded: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<RequestsStatusService>(RequestsStatusService);
  });

  it('finishedReservations should notify requester to upload vouchers', async () => {
    requestsRepo.findOne.mockResolvedValue({
      id: 'req-1',
      status: 'Pending Reservations',
      id_travel_agency: 'ta-1',
      user: { email: 'req@corp.com', name: 'Requester' },
    });
    requestsService.updateStatus.mockResolvedValueOnce({ id: 'req-1' });

    const result = await service.finishedReservations(
      { userInfo: { id_travel_agency: 'ta-1' } } as any,
      'req-1',
    );

    expect(notificationsService.notifyOrWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'req@corp.com',
        subject: 'Solicitud lista para comprobacion de gastos',
        html: expect.stringContaining('SUMMARY'),
      }),
    );
    expect(requestsService.updateStatus).toHaveBeenCalledWith(
      'req-1',
      'In Progress',
    );
    expect(result).toEqual({ id: 'req-1', emailWarnings: [] });
  });

  it('finishedUploadingVouchers should notify approver for voucher approval', async () => {
    requestsRepo.findOne.mockResolvedValue({
      id: 'req-2',
      status: 'In Progress',
      id_user: 'user-1',
      id_company: 'company-1',
      advance_money: 0,
      createdAt: new Date('2026-05-01'),
      requests_destinations: [
        {
          departure_date: '2026-05-10',
          arrival_date: '2026-05-12',
        },
      ],
      admin: { email: 'approver@corp.com', name: 'Approver' },
    });
    requestsService.updateStatus.mockResolvedValueOnce({ id: 'req-2' });
    vouchersRepo.find.mockResolvedValue([
      {
        id: 'voucher-1',
        id_request: 'req-2',
        class: 'hotel',
        amount: 100,
        currency: 'MXN',
        date: '2026-05-12',
      },
    ]);

    const result = await service.finishedUploadingVouchers(
      { sessionInfo: { id: 'user-1' } } as any,
      'req-2',
    );

    expect(notificationsService.notifyOrWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'approver@corp.com',
        subject: 'Solicitud pendiente de aprobacion de comprobantes',
        html: expect.stringContaining('SUMMARY'),
      }),
    );
    expect(requestsService.updateStatus).toHaveBeenCalledWith(
      'req-2',
      'Pending Vouchers Approval',
    );
    expect(result).toEqual({ id: 'req-2', emailWarnings: [] });
  });

  it('finishedApprovingVouchers should notify SOI to register refund', async () => {
    requestsRepo.findOne.mockResolvedValue({
      id: 'req-3',
      status: 'Pending Vouchers Approval',
      id_admin: 'admin-1',
      SOI: { email: 'soi@corp.com', name: 'SOI' },
    });
    requestsService.updateStatus.mockResolvedValueOnce({ id: 'req-3' });

    const result = await service.finishedApprovingVouchers(
      { sessionInfo: { id: 'admin-1' } } as any,
      'req-3',
    );

    expect(notificationsService.notifyOrWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'soi@corp.com',
        subject: 'Solicitud pendiente de registro de reembolso',
        html: expect.stringContaining('SUMMARY'),
      }),
    );
    expect(requestsService.updateStatus).toHaveBeenCalledWith(
      'req-3',
      'Pending Refund Approval',
    );
    expect(result).toEqual({ id: 'req-3', emailWarnings: [] });
  });

  it('finsihedRegisteringRequest should update status without direct emails', async () => {
    requestsRepo.findOne.mockResolvedValue({
      id: 'req-4',
      status: 'Pending Refund Approval',
      id_SOI: 'soi-1',
      user: { email: 'req@corp.com' },
    });
    requestsService.updateStatus.mockResolvedValueOnce({ id: 'req-4' });

    const result = await service.finsihedRegisteringRequest(
      { sessionInfo: { id: 'soi-1' } } as any,
      'req-4',
    );

    expect(notificationsService.notifyOrWarn).not.toHaveBeenCalled();
    expect(requestsService.updateStatus).toHaveBeenCalledWith(
      'req-4',
      'Completed',
    );
    expect(result).toEqual({ id: 'req-4', emailWarnings: [] });
  });
});

/**
 * Modification History:
 * - 2026-05-11 | Copilot | Added unit tests for voucher/refund notification flow.
 */
