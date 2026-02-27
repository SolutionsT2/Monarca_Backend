/*
 * request-logs.controller.ts
 *
 * HTTP controller responsible for managing request log
 * retrieval endpoints. Provides access to historical
 * status changes of requests.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestLogsService } from './request-logs.service';
import { CreateRequestLogDto } from './dto/create-request-log.dto';
import { UpdateRequestLogDto } from './dto/update-request-log.dto';

/**
 * Controller responsible for handling request log endpoints.
 */
@Controller('request-logs')
export class RequestLogsController {
  constructor(private readonly logsService: RequestLogsService) {}

  /**
   * Retrieves all request log entries.
   *
   * @returns Array of RequestLog entities.
   */
  @Get()
  async findAll() {
    return this.logsService.findAll();
  }

  /**
   * Retrieves a single request log entry by its UUID.
   *
   * @param id Unique identifier of the request log.
   * @returns The corresponding RequestLog entity.
   */
  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.logsService.findOne(id);
  }
}



/*
Modification History:

- 2026-02-26 | Diego Vergara | Added controller documentation and JSDoc for public methods.
*/