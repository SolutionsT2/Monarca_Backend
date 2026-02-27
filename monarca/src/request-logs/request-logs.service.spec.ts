/*
 * request-logs.service.spec.ts
 *
 * Unit test suite for RequestLogsService.
 * Verifies proper service instantiation
 * within the NestJS testing environment.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestLogsService } from './request-logs.service';

describe('RequestLogsService', () => {
  let service: RequestLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestLogsService],
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
*/
