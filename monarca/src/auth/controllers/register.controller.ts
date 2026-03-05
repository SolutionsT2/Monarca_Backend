/**
 * File: register.controller.ts
 * Description: Controller responsible for user registration endpoint.
 */

import { Controller, Post, Body } from '@nestjs/common';
import { RegisterService } from '../services/register.service';
import { CreateUserDto } from 'src/users/dto/user.dtos';

/**
 * RegisterController
 * 
 * REST API controller for user registration.
 * Handles endpoint for creating new user accounts.
 */
@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

<<<<<<< Updated upstream
  /*

  Example body for user registration:
  {
    "name": "",
    "last_name": "",
    "password": "",
    "email": ""
  }

  To change the role and department for now you must update the code in "register.service.ts".
  */

=======
  /**
   * Register new user
   * 
   * Example request body:
   * {
   *   "name": "John",
   *   "last_name": "Doe",
   *   "password": "secure_password",
   *   "email": "john@example.com"
   * }
   * 
   * Note: Role and department assignments must be done separately.
   * See register.service.ts for role/department configuration.
   */
>>>>>>> Stashed changes
  @Post()
  register(@Body() data: CreateUserDto) {
    return this.registerService.register(data);
  }
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer; translated comments to English.
 */
