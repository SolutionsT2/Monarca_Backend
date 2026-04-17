/**
 * File: destinations.controller.spec.ts
 * Description: Unit tests for DestinationsController.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Destination } from './entities/destination.entity';

describe('DestinationsController', () => {
  let controller: DestinationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DestinationsController],
      providers: [
        DestinationsService,
        { provide: getRepositoryToken(Destination), useValue: {} },
      ],
    }).compile();

    controller = module.get<DestinationsController>(DestinationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 * - 2026-04-15: Santiago Arista | Refactored providers for testing
 */
