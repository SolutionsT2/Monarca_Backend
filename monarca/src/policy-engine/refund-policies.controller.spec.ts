/**
 * File: refund-policies.controller.spec.ts
 * Description: Unit tests for RefundPoliciesController.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RefundPoliciesController } from './refund-policies.controller';
import { RefundPoliciesService } from './refund-policies.service';

describe('RefundPoliciesController', () => {
  let controller: RefundPoliciesController;
  let service: {
    findGroupedByCompany: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findGroupedByCompany: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefundPoliciesController],
      providers: [{ provide: RefundPoliciesService, useValue: service }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get(RefundPoliciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findGroupedByCompany should forward the session context', async () => {
    const req = { userInfo: { id_role: 'role-1', id_department: 'dept-1' } };

    await controller.findGroupedByCompany(req as any);

    expect(service.findGroupedByCompany).toHaveBeenCalledWith(
      'role-1',
      'dept-1',
    );
  });

  it('findOne should forward the session context and policy id', async () => {
    const req = { userInfo: { id_role: 'role-1', id_department: 'dept-1' } };

    await controller.findOne(req as any, 'policy-1');

    expect(service.findOne).toHaveBeenCalledWith('policy-1', 'role-1', 'dept-1');
  });

  it('create should forward the session context and payload', async () => {
    const req = { userInfo: { id_role: 'role-1', id_department: 'dept-1' } };
    const payload = { name: 'Policy' };

    await controller.create(req as any, payload as any);

    expect(service.create).toHaveBeenCalledWith('role-1', 'dept-1', payload);
  });

  it('update should forward the session context, policy id and payload', async () => {
    const req = { userInfo: { id_role: 'role-1', id_department: 'dept-1' } };
    const payload = { name: 'Updated policy' };

    await controller.update(req as any, 'policy-1', payload as any);

    expect(service.update).toHaveBeenCalledWith(
      'policy-1',
      'role-1',
      'dept-1',
      payload,
    );
  });

  it('remove should forward the session context and policy id', async () => {
    const req = { userInfo: { id_role: 'role-1', id_department: 'dept-1' } };

    await controller.remove(req as any, 'policy-1');

    expect(service.remove).toHaveBeenCalledWith('policy-1', 'role-1', 'dept-1');
  });
});
