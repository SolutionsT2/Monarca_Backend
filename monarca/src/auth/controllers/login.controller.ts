/*This NestJS controller defines the authentication-related API endpoints under the /login route. It exposes a POST /login endpoint that receives login credentials (LogInDTO) and delegates the authentication logic to LoginService.logIn, passing the Express Response with passthrough enabled so the service can set cookies/headers (for example, a session token) while still returning a normal response body. It also provides POST /login/logout (with an explicit 200 status via @HttpCode(200)) that calls LoginService.logOut to clear the user’s session (typically by removing cookies). Finally, it includes a protected GET /login/profile endpoint guarded by AuthGuard, which reads the authenticated request and returns the current user profile via LoginService.profile. The large commented section at the bottom shows older, deprecated examples for role/permission guards that are no longer intended to be used. */

import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { LogInDTO } from '../dto/login.dto';
import { LoginService } from '../services/login.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  logIn(@Body() data: LogInDTO, @Res({ passthrough: true }) res: Response) {
    return this.loginService.logIn(data, res);
  }
  @Post('logout')
  @HttpCode(200)
  logOut(@Res({ passthrough: true }) res: Response) {
    return this.loginService.logOut(res);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.loginService.profile(req);
  }
}
