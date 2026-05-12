import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: 'user-1' }),
            update: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Updated' }),
            delete: jest.fn().mockResolvedValue({ status: true, message: 'User user-1 deleted' }),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get all users', async () => {
    await expect(controller.get()).resolves.toEqual([]);
  });

  it('should get one user', async () => {
    await expect(controller.findOne('user-1')).resolves.toEqual({ id: 'user-1' });
  });

  it('should update a user', async () => {
    await expect(controller.update('user-1', { name: 'Updated' })).resolves.toEqual({ id: 'user-1', name: 'Updated' });
  });

  it('should delete a user', async () => {
    await expect(controller.remove('user-1')).resolves.toEqual({ status: true, message: 'User user-1 deleted' });
  });
});

/**
 * Modification History:
 * - 2026-04-15 - Santiago Arista Viramontes: Added users.controller.spec.ts
 */