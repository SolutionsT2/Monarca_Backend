/*efines a LogInDTO class used in a NestJS application to validate and document the structure of login requests. It uses class-validator decorators to enforce that the email is a string between 5 and 30 characters, and that the password is also a string. Additionally, it uses @ApiProperty from @nestjs/swagger to automatically generate API documentation in Swagger, providing example values for both fields. This DTO ensures that incoming login data meets validation rules before reaching the controller or service logic. */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LogInDTO {
  @ApiProperty({ example: 'juan@gmail.com' })
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  password: string;
}
