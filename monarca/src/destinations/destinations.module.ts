/**
 * File: destinations.module.ts
 * Description: NestJS module wiring destinations controller, service and checks.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destination } from './entities/destination.entity';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';
import { DestinationsChecks } from './destinations.checks';

@Module({
  imports: [TypeOrmModule.forFeature([Destination])],
  providers: [DestinationsService, DestinationsChecks],
  controllers: [DestinationsController],
  exports: [DestinationsChecks],
})
export class DestinationsModule {}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
