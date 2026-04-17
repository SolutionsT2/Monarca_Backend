import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: { findOne: jest.Mock; find: jest.Mock; create: jest.Mock; save: jest.Mock; update: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a user by id', async () => {
    repo.findOne.mockResolvedValue({ id: 'u1' });
    await expect(service.findById('u1')).resolves.toEqual({ id: 'u1' });
  });

  it('should throw if user not found', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(service.findById('u2')).rejects.toThrow('User not found');
  });

  it('should get all users', async () => {
    repo.find.mockResolvedValue([{ id: 'u1' }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 'u1' }]);
  });

  it('should create a user', async () => {
    repo.create.mockReturnValue({ id: 'u1' });
    repo.save.mockResolvedValue({ id: 'u1' });
    await expect(service.create({ name: 'Test' } as any)).resolves.toEqual({ id: 'u1' });
  });

  it('should update a user', async () => {
    repo.update.mockResolvedValue(undefined);
    repo.findOne.mockResolvedValue({ id: 'u1' });
    await expect(service.update('u1', { name: 'Updated' } as any)).resolves.toEqual({ id: 'u1' });
  });

  it('should delete a user', async () => {
    repo.delete.mockResolvedValue(undefined);
    await expect(service.delete('u1')).resolves.toEqual({ status: true, message: 'User u1 deleted' });
  });
});


/**
 * Modification History:
 * - 2026-04-15 - Santiago Arista Viramontes: Added users.service.spec.ts
 */