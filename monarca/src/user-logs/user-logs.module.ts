/**
 * File: user-logs.module.ts
 * Description: Nest module that registers user logs controller, service and UserLogs entity.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLogs } from './entity/user-logs.entity';
import { UserLogsService } from './user-logs.service';
import { UserLogsController } from './user-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserLogs])],
  providers: [UserLogsService],
  controllers: [UserLogsController],
})
export class UserLogsModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
