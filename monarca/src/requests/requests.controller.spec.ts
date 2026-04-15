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

describe('RequestsController', () => {
  let controller: RequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [RequestsService],
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
*/
