/**
 * File: requests.service.spec.ts
 * Description: Unit tests for RequestsService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { PolicyViolation } from 'src/policy-engine/entities/policy-violation.entity';
import { UserChecks } from 'src/users/user.checks.service';
import { DestinationsChecks } from 'src/destinations/destinations.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DataSource } from 'typeorm';

describe('RequestsService', () => {
  let service: RequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
          RequestsService,
          { provide: getRepositoryToken(Request), useValue: {} },
          { provide: getRepositoryToken(PolicyViolation), useValue: {} },
          { provide: UserChecks, useValue: {} },
          { provide: DestinationsChecks, useValue: {} },
          { provide: NotificationsService, useValue: {} },
          { provide: DataSource, useValue: {} },
        ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * 
 * - 2026-04-15 - Santiago Arista Viramontes: Added providers
 */
