/**
 * File: revisions.controller.ts
 * Description: Controller for creating revisions (admin feedback on requests).
 */

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RevisionsService } from './revisions.service';
import { CreateRevisionDto } from './dto/create-revision.dto';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';

/**
 * RevisionsController
 * 
 * REST API controller for managing request revisions.
 * Handles endpoints for posting revision comments and marking requests for changes.
 * 
 * Protected by: AuthGuard, PermissionsGuard
 */
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('revisions')
export class RevisionsController {
  constructor(private readonly revisionsService: RevisionsService) {}

  @Post()
  postRevision(
    @Request() req: RequestInterface,
    @Body() dto: CreateRevisionDto,
  ) {
    return this.revisionsService.create(req, dto);
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
