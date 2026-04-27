/**
 * File: refund-policies.service.spec.ts
 * Description: Unit tests for RefundPoliciesService.
 */

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from 'src/companies/entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { PolicyRule } from './entities/policy-rule.entity';
import { Policy } from './entities/policy.entity';
import { RefundPoliciesService } from './refund-policies.service';

describe('RefundPoliciesService', () => {
  let service: RefundPoliciesService;
  let policyRepo: any;
  let policyRuleRepo: any;
  let companyRepo: any;
  let departmentRepo: any;
  let roleRepo: any;
  let manager: any;

  const superAdminRole = { id: 'role-super', name: 'SuperAdmin' };
  const companyAdminRole = { id: 'role-company', name: 'Company Admin' };

  beforeEach(async () => {
    manager = {
      create: jest.fn((entity, payload) => payload),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    policyRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      manager: {
        transaction: jest.fn(async (callback: any) => callback(manager)),
      },
    };
    policyRuleRepo = {};
    companyRepo = { findOne: jest.fn() };
    departmentRepo = { findOne: jest.fn() };
    roleRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundPoliciesService,
        { provide: getRepositoryToken(Policy), useValue: policyRepo },
        { provide: getRepositoryToken(PolicyRule), useValue: policyRuleRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
        { provide: getRepositoryToken(Department), useValue: departmentRepo },
        { provide: getRepositoryToken(Roles), useValue: roleRepo },
      ],
    }).compile();

    service = module.get(RefundPoliciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findGroupedByCompany should group policies and sort companies', async () => {
    roleRepo.findOne.mockResolvedValue(superAdminRole);
    policyRepo.find.mockResolvedValue([
      {
        id: 'policy-2',
        name: 'B policy',
        company: { id: 'company-b', key: 'B', name: 'Beta' },
        rules: [],
      },
      {
        id: 'policy-1',
        name: 'A policy',
        company: { id: 'company-a', key: 'A', name: 'Alpha' },
        rules: [],
      },
      {
        id: 'policy-3',
        name: 'Another alpha policy',
        company: { id: 'company-a', key: 'A', name: 'Alpha' },
        rules: [],
      },
    ]);

    const grouped = await service.findGroupedByCompany('role-super', undefined);

    expect(grouped).toHaveLength(2);
    expect(grouped[0].company.name).toBe('Alpha');
    expect(grouped[0].policies).toHaveLength(2);
    expect(grouped[1].company.name).toBe('Beta');
    expect(policyRepo.find).toHaveBeenCalledWith({
      where: {},
      relations: ['company', 'rules'],
      order: {
        name: 'ASC',
        rules: {
          expense_class: 'ASC',
        },
      },
    });
  });

  it('findGroupedByCompany should filter policies for company admins', async () => {
    roleRepo.findOne.mockResolvedValue(companyAdminRole);
    departmentRepo.findOne.mockResolvedValue({ id_company: 'company-a' });
    policyRepo.find.mockResolvedValue([
      {
        id: 'policy-1',
        name: 'Policy',
        company: { id: 'company-a', key: 'A', name: 'Alpha' },
        rules: [],
      },
    ]);

    await service.findGroupedByCompany('role-company', 'dept-1');

    expect(policyRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_company: 'company-a' },
      }),
    );
  });

  it('create should require id_company for superadmin', async () => {
    roleRepo.findOne.mockResolvedValue(superAdminRole);

    await expect(
      service.create('role-super', undefined, { name: 'Policy' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create should persist policy and rules for superadmin', async () => {
    roleRepo.findOne.mockResolvedValue(superAdminRole);
    companyRepo.findOne.mockResolvedValue({ id: 'company-a' });
    policyRepo.findOne.mockResolvedValue({
      id: 'policy-1',
      id_company: 'company-a',
      name: 'Policy',
      description: 'Description',
      is_active: true,
      company: { id: 'company-a' },
      rules: [],
    });
    manager.save
      .mockResolvedValueOnce({ id: 'policy-1' })
      .mockResolvedValueOnce([]);

    const result = await service.create('role-super', undefined, {
      id_company: 'company-a',
      name: '  Policy  ',
      description: '  Description  ',
      rules: [
        {
          expense_class: '  hotel  ',
          operator: '  lt  ',
          threshold_value: 5000,
          threshold_unit: ' mxn ',
          consequence: ' policy_violation ',
          is_active: true,
        },
      ],
    } as any);

    expect(manager.create).toHaveBeenCalledWith(
      Policy,
      expect.objectContaining({
        id_company: 'company-a',
        name: 'Policy',
        description: 'Description',
        is_active: true,
      }),
    );
    expect(manager.create).toHaveBeenCalledWith(
      PolicyRule,
      expect.objectContaining({
        id_policy: 'policy-1',
        expense_class: 'hotel',
        operator: 'LT',
        threshold_value: 5000,
        threshold_unit: 'mxn',
        consequence: 'POLICY_VIOLATION',
        is_active: true,
      }),
    );
    expect(result.id).toBe('policy-1');
  });

  it('create should reject company admins trying to target another company', async () => {
    roleRepo.findOne.mockResolvedValue(companyAdminRole);
    departmentRepo.findOne.mockResolvedValue({ id_company: 'company-a' });

    await expect(
      service.create('role-company', 'dept-1', {
        id_company: 'company-b',
        name: 'Policy',
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('update should reject company admins moving a policy to another company', async () => {
    roleRepo.findOne.mockResolvedValue(companyAdminRole);
    departmentRepo.findOne.mockResolvedValue({ id_company: 'company-a' });
    policyRepo.findOne.mockResolvedValue({
      id: 'policy-1',
      id_company: 'company-a',
      rules: [],
      company: { id: 'company-a' },
    });

    await expect(
      service.update('policy-1', 'role-company', 'dept-1', {
        id_company: 'company-b',
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove should delete a policy when access is allowed', async () => {
    roleRepo.findOne.mockResolvedValue(superAdminRole);
    policyRepo.findOne.mockResolvedValue({ id: 'policy-1', id_company: 'company-a' });

    const result = await service.remove('policy-1', 'role-super', undefined);

    expect(policyRepo.delete).toHaveBeenCalledWith('policy-1');
    expect(result).toEqual({
      status: true,
      message: 'Policy policy-1 removed',
    });
  });

  it('remove should throw when the policy does not exist', async () => {
    roleRepo.findOne.mockResolvedValue(superAdminRole);
    policyRepo.findOne.mockResolvedValue(null);

    await expect(service.remove('policy-1', 'role-super', undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
