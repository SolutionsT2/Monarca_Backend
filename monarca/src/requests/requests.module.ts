/*
 * requests.module.ts
 *
 * NestJS module responsible for configuring request-related
 * services, controllers, validation checks, and dependencies.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { GuardsModule } from 'src/guards/guards.module';
import { UsersModule } from 'src/users/users.module';
import { DestinationsModule } from 'src/destinations/destinations.module';
import { RequestsChecks } from './requests.checks';
import { RequestsStatusController } from './requests.status.controller';
import { RequestsStatusService } from './requests.status.service';
import { TravelAgenciesModule } from 'src/travel-agencies/travel-agencies.module';
import { RequestLogsModule } from 'src/request-logs/request-logs.module';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { PolicyEngineModule } from 'src/policy-engine/policy-engine.module';
import { PolicyViolation } from 'src/policy-engine/entities/policy-violation.entity';
import { Department } from 'src/departments/entity/department.entity';

/**
 * Module encapsulating request domain logic
 * and related integrations.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Request,
      RequestsDestination,
      Voucher,
      PolicyViolation,
      Department,
    ]),
    GuardsModule,
    UsersModule,
    DestinationsModule,
    TravelAgenciesModule,
    RequestLogsModule,
    NotificationsModule, // Assuming this is a controller that handles notifications related to requests
    PolicyEngineModule,
  ],
  controllers: [RequestsController, RequestsStatusController],
  providers: [
    RequestsService,
    RequestsChecks,
    RequestsStatusService,
    NotificationsService,
  ],
  exports: [RequestsService, RequestsChecks],
})
export class RequestsModule {}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added module documentation and clarified inline comments.
*/
