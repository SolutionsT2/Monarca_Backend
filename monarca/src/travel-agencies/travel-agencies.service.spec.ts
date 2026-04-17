/**
 * File: travel-agencies.service.spec.ts
 * Description: Unit tests for TravelAgenciesService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TravelAgenciesService } from './travel-agencies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TravelAgency } from './entities/travel-agency.entity';

describe('TravelAgenciesService', () => {
  let service: TravelAgenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TravelAgenciesService,
        { provide: getRepositoryToken(TravelAgency), useValue: {} },
      ],
    }).compile();

    service = module.get<TravelAgenciesService>(TravelAgenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-04-15: Santiago Arista | Refactored providers for testing
 */
