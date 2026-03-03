/**
 * File: vouchers.service.spec.ts
 * Description: Unit tests for VouchersService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { VouchersService } from './vouchers.service';

describe('VouchersService', () => {
  let service: VouchersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VouchersService],
    }).compile();

    service = module.get<VouchersService>(VouchersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
