/**
 * File: destinations.service.spec.ts
 * Description: Unit tests for DestinationsService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DestinationsService } from './destinations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Destination } from './entities/destination.entity';
import { Airport } from './entities/airport.entity';

describe('DestinationsService', () => {
  let service: DestinationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DestinationsService,
        { provide: getRepositoryToken(Destination), useValue: {} },
        { provide: getRepositoryToken(Airport), useValue: {} },
      ],
    }).compile();

    service = module.get<DestinationsService>(DestinationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 * - 2026-04-15: Santiago Arista | Refactored providers for testing
 */
