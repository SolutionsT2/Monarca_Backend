/**
 * File: vouchers.controller.spec.ts
 * Description: Unit tests for VouchersController.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { VouchersService } from './vouchers.service';
import { CfdiService } from 'src/cfdi/cfdi.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';

jest.mock(
  'src/guards/auth.guard',
  () => ({
    AuthGuard: class AuthGuard {
      canActivate() {
        return true;
      }
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/guards/permissions.guard',
  () => ({
    PermissionsGuard: class PermissionsGuard {
      canActivate() {
        return true;
      }
    },
  }),
  { virtual: true },
);

const { VouchersController } = require('./vouchers.controller');

describe('VouchersController', () => {
  let controller: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VouchersController],
      providers: [
        { provide: VouchersService, useValue: {} },
        { provide: CfdiService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get(VouchersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
