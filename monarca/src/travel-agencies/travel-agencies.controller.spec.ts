/**
 * File: travel-agencies.controller.spec.ts
 * Description: Unit tests for TravelAgenciesController.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TravelAgenciesController } from './travel-agencies.controller';
import { TravelAgenciesService } from './travel-agencies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TravelAgency } from './entities/travel-agency.entity';

describe('TravelAgenciesController', () => {
  let controller: TravelAgenciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TravelAgenciesController],
      providers: [
        TravelAgenciesService,
        { provide: getRepositoryToken(TravelAgency), useValue: {} },
      ],
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
 * - 2026-04-15: Santiago Arista | Refactored providers for testing
 */
