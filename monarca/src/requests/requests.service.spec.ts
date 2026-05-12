/**
 * File: requests.service.spec.ts
 * Description: Unit tests for RequestsService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { PolicyViolation } from 'src/policy-engine/entities/policy-violation.entity';
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';
import { Department } from 'src/departments/entity/department.entity';
import { UserChecks } from 'src/users/user.checks.service';
import { DestinationsChecks } from 'src/destinations/destinations.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DataSource } from 'typeorm';

describe('RequestsService', () => {
  let service: RequestsService;
  let requestsRepo: { findOne: jest.Mock; save: jest.Mock };
  let userChecks: { getUserById: jest.Mock };
  let notificationsService: { notify: jest.Mock };
  let dataSource: { createEntityManager: jest.Mock };

  beforeEach(async () => {
    requestsRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    userChecks = { getUserById: jest.fn() };
    notificationsService = { notify: jest.fn().mockResolvedValue(null) };
    dataSource = {
      createEntityManager: jest.fn().mockReturnValue({ save: jest.fn() }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(Request), useValue: requestsRepo },
        { provide: getRepositoryToken(PolicyViolation), useValue: {} },
        { provide: getRepositoryToken(DocumentClass), useValue: {} },
        { provide: getRepositoryToken(Department), useValue: {} },
        { provide: UserChecks, useValue: userChecks },
        { provide: DestinationsChecks, useValue: {} },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updateStatus should notify requester with login link', async () => {
    process.env.FRONTEND_URL = 'http://app.local/';

    requestsRepo.findOne
      .mockResolvedValueOnce({ id: 'req-1', status: 'Pending Review' })
      .mockResolvedValueOnce({
        id: 'req-1',
        status: 'Approved',
        title: 'Viaje',
        user: { name: 'Requester', lastName: 'One', email: 'req@corp.com' },
        requests_destinations: [],
      });
    requestsRepo.save.mockResolvedValue({
      id: 'req-1',
      status: 'Approved',
      title: 'Viaje',
      id_user: 'user-1',
    });

    await service.updateStatus('req-1', 'Approved');

    expect(notificationsService.notify).toHaveBeenCalledWith(
      'req@corp.com',
      'Cambio de estatus de solicitud',
      expect.stringContaining('Approved'),
      expect.stringContaining('http://app.local/dashboard'),
    );
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * 
 * - 2026-04-15 - Santiago Arista Viramontes: Added providers
 */
