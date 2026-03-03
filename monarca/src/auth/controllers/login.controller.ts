/**
 * File: login.controller.ts
 * Description: Controller handling login, logout and profile endpoints.
 */

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

  // Test for sending cookies and returning the logged-in user
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.loginService.profile(req);
  }

  // DO NOT USE: DELETE SOON
  // // Test for role permissions for routes with Guard
  // @Get('Eliminar')
  // @UseGuards(AuthGuard, PermissionsGuard)
  // @Permissions('Eliminar Datos')
  // roleAcess2() {
  //   return 'Only users with permission ID 2 can access this';
  // }

  // @Get('prueba_permisos')
  // @UseGuards(AuthGuard, PermissionsGuard)
  // @Permissions('Ver Reportes') // Access for users that have this permission
  // permissionsTest(@Req() req) {

  //   // Specific permissions
  //   const canDelete = hasPermission(req, 'Eliminar Datos');
  //   const canEdit = hasPermission(req, 'Editar Datos');

  //   let message = 'You have view permissions.';

  //   if (canDelete) {
  //     message += ' You also have delete permissions.';
  //   }

  //   if (canEdit) {
  //     message += ' You also have edit permissions.';
  //   }

  //   return {
  //     message,
  //     permissions: {
  //       canDelete,
  //       canEdit
  //     }
  //   };
  // }
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer; translated comments to English.
 */

