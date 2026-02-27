/*
 * request-logs.controller.spec.ts
 *
 * Unit test suite for RequestLogsController.
 * Ensures the controller is properly instantiated
 * within the NestJS testing environment.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestLogsController } from './request-logs.controller';
import { RequestLogsService } from './request-logs.service';

describe('RequestLogsController', () => {
  let controller: RequestLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestLogsController],
      providers: [RequestLogsService],
    }).compile();

    controller = module.get<RequestLogsController>(RequestLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added file header documentation and modification history.
*/
