/**
 * File: substitutes.controller.ts
 * Description: HTTP API for person-to-person substitute assignments.
 * Approvers manage their own delegations via this controller.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesAdminService } from './roles-admin.service';
import { CreateSubstituteDto } from './dto/create-substitute.dto';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@UseGuards(AuthGuard)
@Controller('substitutes')
export class SubstitutesController {
  constructor(private readonly rolesAdminService: RolesAdminService) {}

  @Get()
  findAll(@Req() req: RequestInterface) {
    const userId = req.sessionInfo.id;
    return this.rolesAdminService.findSubstitutesByOriginalUser(userId);
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
- 2026-05-12 | Juan de Dios Gastélum | GET now scoped to logged-in user via findSubstitutesByOriginalUser.
*/
