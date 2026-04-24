/**
 * File: revisions.controller.spec.ts
 * Description: Unit tests for RevisionsController.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RevisionsController } from './revisions.controller';
import { RevisionsService } from './revisions.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

describe('RevisionsController', () => {
  let controller: RevisionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevisionsController],
      providers: [
        { provide: RevisionsService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: Reflector, useValue: { get: jest.fn().mockReturnValue([]) } },
        { provide: getRepositoryToken(User), useValue: {} },
      ],
    }).compile();

    controller = module.get<RevisionsController>(RevisionsController);
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
