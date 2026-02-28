/*
 * notifications.controller.spec.ts
 *
 * Unit test suite for NotificationsController.
 * Verifies that the controller is properly instantiated
 * within the NestJS testing module environment.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});



/*
Modification History:

- 2026-02-26 | Diego Vergara | Added file description and documentation standard compliance.
*/