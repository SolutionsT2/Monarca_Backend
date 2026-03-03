/**
 * File: travel-agencies.controller.spec.ts
 * Description: Unit tests for TravelAgenciesController.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TravelAgenciesController } from './travel-agencies.controller';
import { TravelAgenciesService } from './travel-agencies.service';

describe('TravelAgenciesController', () => {
  let controller: TravelAgenciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TravelAgenciesController],
      providers: [TravelAgenciesService],
    }).compile();

    controller = module.get<TravelAgenciesController>(TravelAgenciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
