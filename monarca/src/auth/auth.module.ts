/**
<<<<<<< Updated upstream
 * File: auth.module.ts
 * Description: Authentication module that wires login and registration controllers and services.
 */

=======
 * Authentication Module
 * 
 * Module for handling user authentication, JWT configuration, and login/logout operations.
 * Exports: LoginService, RegisterService, AuthGuard
 */
>>>>>>> Stashed changes
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

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
