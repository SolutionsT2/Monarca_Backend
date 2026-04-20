/*
 * requests.controller.spec.ts
 *
 * Unit test suite for RequestsController.
 * Verifies controller instantiation within
 * the NestJS testing environment.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { PolicyViolation } from 'src/policy-engine/entities/policy-violation.entity';
import { UserChecks } from 'src/users/user.checks.service';
import { DestinationsChecks } from 'src/destinations/destinations.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DataSource } from 'typeorm';
// Do not import AuthGuard and PermissionsGuard as classes for test DI
import { JwtService } from '@nestjs/jwt';

describe('RequestsController', () => {
  let controller: RequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        RequestsService,
        { provide: getRepositoryToken(Request), useValue: {} },
        { provide: getRepositoryToken(PolicyViolation), useValue: {} },
        { provide: UserChecks, useValue: {} },
        { provide: DestinationsChecks, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: 'AuthGuard', useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: 'PermissionsGuard', useValue: { canActivate: jest.fn().mockReturnValue(true) } },
      ],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

/*
Modification History:

- 2026-02-26 | Diego Vergara | Renamed test file for consistency and added documentation header.
- 2026-04-15 | Santiago Arista | Added providers
*/
