/*This AuthModule defines the authentication module in a NestJS application. It imports JwtConfigModule to handle JWT configuration and signing, and UsersModule to access user-related services and database logic. The module registers two controllers (LoginController and RegisterController) to handle login and registration endpoints, and provides their corresponding services (LoginService and RegisterService). By exporting LoginService, RegisterService, and JwtConfigModule, it allows other modules in the application to reuse authentication logic and JWT functionality. */

import { Module, forwardRef } from '@nestjs/common';
import { LoginController } from './controllers/login.controller';
import { LoginService } from './services/login.service';
import { JwtConfigModule } from 'src/jwt/jwt.config.module';
import { UsersModule } from 'src/users/users.module';
import { RegisterController } from './controllers/register.controller';
import { RegisterService } from './services/register.service';

@Module({
  imports: [JwtConfigModule, UsersModule],
  controllers: [LoginController, RegisterController],
  providers: [LoginService, RegisterService],
  exports: [LoginService, RegisterService, JwtConfigModule],
})
export class AuthModule {}
