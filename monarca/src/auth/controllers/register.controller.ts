/*This NestJS controller defines the user registration endpoint under the /register route. It exposes a POST /register method that receives user data in the request body (validated through the CreateUserDto) and delegates the creation logic to RegisterService.register. The comment in the file explains the expected structure of the request payload (first name, last name, password, and email) and notes that role and department assignment are currently handled internally within the register.service.ts file rather than being configurable through the request body. */

import { Controller, Post, Body } from '@nestjs/common';
import { RegisterService } from '../services/register.service';
import { CreateUserDto } from 'src/users/dto/user.dtos';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  /*

  Example user registration body

  {
  "first name": "",
  "last name": "",
  "password": "",
  "email": ""

  }

  To change the role and department, for now, the change must be made in the "register.service.ts" file.
  */

  @Post()
  register(@Body() data: CreateUserDto) {
    return this.registerService.register(data);
  }
}
