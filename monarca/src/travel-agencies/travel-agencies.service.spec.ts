/**
 * File: travel-agencies.service.spec.ts
 * Description: Unit tests for TravelAgenciesService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TravelAgenciesService } from './travel-agencies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TravelAgency } from './entities/travel-agency.entity';
import { NotFoundException } from '@nestjs/common';

describe('TravelAgenciesService', () => {
  let service: TravelAgenciesService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TravelAgenciesService,
        { provide: getRepositoryToken(TravelAgency), useValue: repo },
      ],
    }).compile();

    service = module.get<TravelAgenciesService>(TravelAgenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should persist a travel agency', async () => {
    const dto = { name: 'Agencia Norte' };
    const entity = { id: 'uuid-1', ...dto };
    repo.create.mockReturnValue(entity);
    repo.save.mockResolvedValue(entity);

    await expect(service.create(dto)).resolves.toEqual(entity);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(entity);
  });

  it('findAll should return repositories result', async () => {
    const agencies = [{ id: 'uuid-1', name: 'Agencia Norte' }];
    repo.find.mockResolvedValue(agencies);

    await expect(service.findAll()).resolves.toEqual(agencies);
  });

  it('findOne should return a travel agency with users relation', async () => {
    const entity = { id: 'uuid-1', name: 'Agencia Norte', users: [] };
    repo.findOne.mockResolvedValue(entity);

    await expect(service.findOne('uuid-1')).resolves.toEqual(entity);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      relations: { users: true },
    });
  });

  it('findOne should throw if the travel agency does not exist', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne('uuid-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update should persist changes and reload the entity', async () => {
    const updated = { id: 'uuid-1', name: 'Agencia Sur', users: [] };
    repo.update.mockResolvedValue({ affected: 1 });
    repo.findOne.mockResolvedValue(updated);

    await expect(service.update('uuid-1', { name: 'Agencia Sur' })).resolves.toEqual(
      updated,
    );
    expect(repo.update).toHaveBeenCalledWith('uuid-1', { name: 'Agencia Sur' });
  });

  it('remove should delete the travel agency', async () => {
    repo.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove('uuid-1')).resolves.toEqual({
      status: true,
      message: 'Travel agency uuid-1 removed',
    });
    expect(repo.delete).toHaveBeenCalledWith('uuid-1');
  });

  it('remove should throw if the travel agency does not exist', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove('uuid-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-04-15: Santiago Arista | Refactored providers for testing
 */
