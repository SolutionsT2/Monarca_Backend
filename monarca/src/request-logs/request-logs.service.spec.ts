/*
 * request-logs.service.spec.ts
 *
 * Unit test suite for RequestLogsService.
 * Verifies proper service instantiation
 * within the NestJS testing environment.
 */


import { Test, TestingModule } from '@nestjs/testing';
import { RequestLogsService } from './request-logs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestLog } from './entities/request-log.entity';

describe('RequestLogsService', () => {
  let service: RequestLogsService;


  beforeEach(async () => {
    const mockRepo = {};
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestLogsService,
        {
          provide: getRepositoryToken(RequestLog),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<RequestLogsService>(RequestLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added documentation header and modification history.
- 2026-04-15 | Santiago Arista | Refactored providers for testing
*/
