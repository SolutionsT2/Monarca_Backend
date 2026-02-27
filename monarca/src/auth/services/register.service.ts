/*his RegisterService handles user registration logic in a NestJS application. When the register method is called, it hashes the incoming password using bcrypt.hash with a salt round of 10 to ensure secure storage. It then logs the incoming data for debugging purposes and calls UsersService.create to persist the new user in the database. After creation, it removes the password field from the returned user object before sending the response back to the client, ensuring that sensitive information is not exposed. */

import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/user.dtos';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegisterService {
  constructor(private readonly userService: UsersService) {}

  async register(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    console.log('DEBUG → Registering user:', data);

    const newUser = await this.userService.create(data);

    const { password, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }
}
