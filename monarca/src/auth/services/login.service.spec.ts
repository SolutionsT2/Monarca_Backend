import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
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
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should reject login when user is not found (wrong email)', async () => {
    userChecks.logIn.mockResolvedValue(null);

    const result = await service.logIn(
      { email: 'noone@test.com', password: 'any' },
      res as unknown as Response,
    );

    expect(result).toEqual({
      status: false,
      message: 'Email or password incorrect',
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(jwtSign).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('should reject login when password does not match', async () => {
    userChecks.logIn.mockResolvedValue({ id: 'u1', password: 'hash' } as never);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    const result = await service.logIn(
      { email: 'a@b.com', password: 'wrong' },
      res as unknown as Response,
    );

    expect(result).toEqual({
      status: false,
      message: 'Email or password incorrect',
    });
    expect(jwtSign).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('should log in: JWT + cookie when user and password are valid', async () => {
    userChecks.logIn.mockResolvedValue({ id: 'user-1', password: 'stored-hash' } as never);

    const result = await service.logIn(
      { email: 'a@b.com', password: 'correct' },
      res as unknown as Response,
    );

    expect(result).toEqual({
      status: true,
      message: 'Logged in successfully',
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('correct', 'stored-hash');
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
