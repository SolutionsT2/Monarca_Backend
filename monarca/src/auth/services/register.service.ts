/**
<<<<<<< Updated upstream
 * File: register.service.ts
 * Description: Service responsible for user registration and password hashing.
 */

=======
 * RegisterService
 * 
 * Service for handling user registration including:
 * - Encrypting user passwords using bcrypt
 * - Creating new user accounts in the system
 * - Validating registration data
 * 
 * @class RegisterService
 */
>>>>>>> Stashed changes
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/user.dtos';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegisterService {
  constructor(private readonly userService: UsersService) {}

  // User registration
  async register(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await this.userService.create(data);

    const { password, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer; translated comments to English.
 */
