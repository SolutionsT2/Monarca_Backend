/**
 * File: user-logs.service.ts
 * Description: Service for user log CRUD operations.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLogs } from './entity/user-logs.entity';
import { CreateUserLogDto } from './dto/create-user-log.dto';
import { UpdateUserLogDto } from './dto/update-user-log.dto';

/**
 * UserLogsService
 * 
 * Service for managing user activity logs including:
 * - Creating log entries for user actions
 * - Retrieving all or specific user logs
 * - Updating and deleting log records
 * 
 * @class UserLogsService
 */
@Injectable()
export class UserLogsService {
  constructor(
    @InjectRepository(UserLogs)
    private readonly userLogsRepository: Repository<UserLogs>,
  ) {}

  create(dto: CreateUserLogDto) {
    const log = this.userLogsRepository.create(dto);
    return this.userLogsRepository.save(log);
  }

  findAll() {
    return this.userLogsRepository.find();
  }

  findOne(id: string) {
    return this.userLogsRepository.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateUserLogDto) {
    return this.userLogsRepository.update(id, dto);
  }

  remove(id: string) {
    return this.userLogsRepository.delete(id);
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
