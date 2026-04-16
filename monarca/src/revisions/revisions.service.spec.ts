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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevisionsService,
        { provide: getRepositoryToken(Revision), useValue: {} },
        { provide: RequestsService, useValue: {} },
        { provide: RequestsChecks, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: UserChecks, useValue: {} },
      ],
    }).compile();

    service = module.get<RevisionsService>(RevisionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-04-15: Santiago Arista | Refactored providers for testing
 */
