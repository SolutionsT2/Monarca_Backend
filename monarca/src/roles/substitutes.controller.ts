/**
 * File: substitutes.controller.ts
 * Description: HTTP API for temporary authorization substitute assignments.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesAdminService } from './roles-admin.service';
import { CreateSubstituteDto } from './dto/create-substitute.dto';

@ApiTags('AuthorizationSubstitutes')
@UseGuards(AuthGuard)
@Controller('substitutes')
export class SubstitutesController {
  constructor(private readonly rolesAdminService: RolesAdminService) {}

  @Get()
  findAll() {
    return this.rolesAdminService.findAllSubstitutes();
  }

  @Post()
  create(@Body() dto: CreateSubstituteDto) {
    return this.rolesAdminService.createSubstitute(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesAdminService.deleteSubstitute(id);
  }
}

/*
Modification History:
- 2026-03-27 | Efren | Initial implementation (P1 delivery).
*/
