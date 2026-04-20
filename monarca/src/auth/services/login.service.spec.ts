import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { LoginService } from './login.service';
import { UserChecks } from 'src/users/user.checks.service';

describe('LoginService', () => {
  let service: LoginService;
  let userChecks: { logIn: jest.Mock };
  let jwtSign: jest.Mock;
  let res: { cookie: jest.Mock };

  beforeEach(async () => {
    userChecks = { logIn: jest.fn() };
    jwtSign = jest.fn().mockReturnValue('test-jwt');
    res = { cookie: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        { provide: UserChecks, useValue: userChecks },
        { provide: JwtService, useValue: { sign: jwtSign } },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
  });

  it('should reject login when user is not found (invalid credentials)', async () => {
    userChecks.logIn.mockResolvedValue(null);

    const result = await service.logIn(
      { email: 'noone@test.com', password: 'any' },
      res as unknown as Response,
    );

    expect(result).toEqual({
      status: false,
      message: 'Email or password incorrect',
    });
    expect(jwtSign).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('should log in: JWT + cookie when UserChecks validates user', async () => {
    userChecks.logIn.mockResolvedValue({ id: 'user-1', password: 'stored-hash' } as never);

    const result = await service.logIn(
      { email: 'a@b.com', password: 'correct' },
      res as unknown as Response,
    );

    expect(result).toEqual({
      status: true,
      message: 'Logged in successfully',
    });
    expect(jwtSign).toHaveBeenCalledWith({ id: 'user-1' });
    expect(res.cookie).toHaveBeenCalledWith(
      'sessionInfo',
      'test-jwt',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      }),
    );
  });
});
