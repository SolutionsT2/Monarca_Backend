/**
 * File: roles-admin.controller.ts
 * Description: HTTP API for role CRUD, permission matrix, module catalog, and XML import.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesAdminService } from './roles-admin.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PatchRolePermissionsDto } from './dto/patch-role-permissions.dto';

@ApiTags('RolesAdmin')
@UseGuards(AuthGuard)
@Controller('roles')
export class RolesAdminController {
  constructor(private readonly rolesAdminService: RolesAdminService) {}

  /**
   * Catalog of modules for building permission matrices (UI mock parity).
   */
  @Get('modules')
  getModules() {
    return this.rolesAdminService.getAvailableModules();
  }

  /**
   * Imports or updates roles from an XML document (see docs/roles-import.example.xml).
   */
  @Post('import-xml')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  importXml(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file field with XML body is required');
    }
    const xml = file.buffer.toString('utf8');
    return this.rolesAdminService.importRolesFromXml(xml);
  }

  @Get()
  findAll() {
    return this.rolesAdminService.findAllRoles();
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesAdminService.createRole(dto);
  }

  @Get(':id/permissions')
  getPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesAdminService.getRolePermissions(id);
  }

  @Patch(':id/permissions')
  patchPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchRolePermissionsDto,
  ) {
    return this.rolesAdminService.patchRolePermissions(id, dto.permissions);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesAdminService.findRoleById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesAdminService.updateRole(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesAdminService.deleteRole(id);
  }
}

/*
Modification History:
- 2026-03-27 | Efren | Initial implementation (P1 delivery).
*/
