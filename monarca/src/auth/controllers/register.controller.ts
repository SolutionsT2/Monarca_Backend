/**
 * File: register.controller.ts
 * Description: Controller responsible for user registration endpoint.
 */

import { Controller, Post, Body } from '@nestjs/common';
import { RegisterService } from '../services/register.service';
import { CreateUserDto } from 'src/users/dto/user.dtos';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

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

  @Post()
  register(@Body() data: CreateUserDto) {
    return this.registerService.register(data);
  }
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer; translated comments to English.
 */
