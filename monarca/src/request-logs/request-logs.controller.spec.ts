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
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestLog } from './entities/request-log.entity';

describe('RequestLogsController', () => {
  let controller: RequestLogsController;


  beforeEach(async () => {
    const mockRepo = {};
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestLogsController],
      providers: [
        RequestLogsService,
        {
          provide: getRepositoryToken(RequestLog),
          useValue: mockRepo,
        },
      ],
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
- 2026-04-15 | Santiago Arista | Refactored providers for testing
*/
