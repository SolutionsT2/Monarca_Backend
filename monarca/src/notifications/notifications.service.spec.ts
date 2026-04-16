/*
 * notifications.service.spec.ts
 *
 * Unit test suite for NotificationsService.
 * Ensures that the service is properly instantiated
 * within the NestJS testing environment.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added documentation header and modification history.
*/
