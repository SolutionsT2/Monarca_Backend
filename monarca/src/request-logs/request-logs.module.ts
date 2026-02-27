/*
 * request-logs.module.ts
 *
 * NestJS module responsible for configuring
 * request log persistence, services, and controllers.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLog } from './entities/request-log.entity';
import { RequestLogsService } from './request-logs.service';
import { RequestLogsController } from './request-logs.controller';

/**
 * Module that encapsulates request log functionality.
 */
@Module({
  imports: [TypeOrmModule.forFeature([RequestLog])],
  controllers: [RequestLogsController],
  providers: [RequestLogsService],
  exports: [TypeOrmModule, RequestLogsService],
})
export class RequestLogsModule {}



/*
Modification History:

- 2026-02-26 | Diego Vergara | Added module documentation and file header.
*/
