/*
 * notifications.module.ts
 *
 * NestJS module responsible for grouping and configuring
 * all notification-related components, including controllers
 * and services.
 */

import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

/**
 * Module that encapsulates notification functionality.
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added module documentation and file header description.
*/