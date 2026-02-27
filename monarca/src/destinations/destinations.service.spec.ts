/**
 * File: destinations.service.spec.ts
 * Description: Unit tests for DestinationsService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DestinationsService } from './destinations.service';

describe('DestinationsService', () => {
  let service: DestinationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DestinationsService],
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
 */
