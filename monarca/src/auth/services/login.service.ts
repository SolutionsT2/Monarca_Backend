/**
 * File: login.service.ts
 * Description: Service handling user login, logout and profile retrieval.
 */

import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { LogInDTO } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserChecks } from 'src/users/user.checks.service';

@Injectable()
export class LoginService {
  constructor(
    private readonly userChecks: UserChecks,
    private readonly jwtService: JwtService,
  ) {}

  async logIn(data: LogInDTO, res: Response) {
    const user = await this.userChecks.logIn(data);

    if (!user) {
      return { status: false, message: 'Email or password incorrect' };
    }

    const payload = { id: user.id };
    const token = this.jwtService.sign(payload);

    // Settings for communication with the frontend
    res.cookie('sessionInfo', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 3600 * 1000, // 1 hour
    });

    return { status: true, message: 'Logged in successfully' };
  }

  async logOut(res: Response) {
    res.clearCookie('sessionInfo', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    return { status: true, message: 'Logged out successfully' };
  }

  async profile(req: any) {
    const { id } = req.sessionInfo;
    // Get user by id with their permissions
    const user = await this.userChecks.getUserById(id);

    return { status: true, user };
  }
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer; translated comments to English.
 */
