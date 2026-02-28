/*
 * request-logs.service.ts
 *
 * Service responsible for retrieving and managing
 * request log entities from the database.
 * Uses TypeORM repository pattern.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRequestLogDto } from './dto/create-request-log.dto';
import { UpdateRequestLogDto } from './dto/update-request-log.dto';
import { RequestLog } from './entities/request-log.entity';

/**
 * Service that provides data access operations
 * for RequestLog entities.
 */
@Injectable()
export class RequestLogsService {
  constructor(
    @InjectRepository(RequestLog)
    private readonly repo: Repository<RequestLog>,
  ) {}

  /**
   * Retrieves all request log records.
   *
   * @returns Array of RequestLog entities.
   */
  async findAll(): Promise<RequestLog[]> {
    return this.repo.find();
  }

  /**
   * Retrieves a request log by its UUID.
   *
   * @param id Unique identifier of the request log.
   * @throws NotFoundException if the log does not exist.
   * @returns The corresponding RequestLog entity.
   */
  async findOne(id: string): Promise<RequestLog> {
    const ent = await this.repo.findOneBy({ id });
    if (!ent) throw new NotFoundException(`Log ${id} not found`);
    return ent;
  }
}



/*
Modification History:

- 2026-02-26 | Diego Vergara | Added service documentation and JSDoc for public methods.
*/