/*This LoginService handles authentication logic in a NestJS application using JWT and HTTP-only cookies. The logIn method first verifies that the user exists by calling userChecks.logIn, then compares the provided password with the stored hashed password using bcrypt.compare. If the credentials are valid, it generates a JWT containing the user ID, signs it with JwtService, and stores it in a secure, HTTP-only cookie named sessionInfo (configured with secure: true, sameSite: 'none', and a 1-hour expiration). It then returns a success response; otherwise, it returns a failure message without revealing which credential was incorrect. The logOut method clears the sessionInfo cookie and returns a success message. The profile method extracts the user ID from req.sessionInfo (populated by an authentication guard), retrieves the full user data including permissions via userChecks.getUserById, and returns it to the client. */

import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { LogInDTO } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserChecks } from 'src/users/user.checks.service';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

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

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      return { status: false, message: 'Email or password incorrect' };
    }

    const payload = { id: user.id };
    const token = this.jwtService.sign(payload);

    // Cambios para la conexion con el front
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
    // get user by id with their permissions
    const user = await this.userChecks.getUserById(id);

    return { status: true, user };
  }
}
