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
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';
import { Department } from 'src/departments/entity/department.entity';
import { PolicyEngineModule } from 'src/policy-engine/policy-engine.module';
import { PolicyViolation } from 'src/policy-engine/entities/policy-violation.entity';
import { JwtConfigModule } from 'src/jwt/jwt.config.module';
import { EmailActionService } from './email-action.service';
import { EmailActionController } from './email-action.controller';

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
      DocumentClass,
      Department,
      PolicyViolation,
    ]),
    GuardsModule,
    UsersModule,
    DestinationsModule,
    TravelAgenciesModule,
    RequestLogsModule,
    NotificationsModule,
    PolicyEngineModule,
    JwtConfigModule,
  ],
  controllers: [EmailActionController, RequestsController, RequestsStatusController],
  providers: [
    RequestsService,
    RequestsChecks,
    RequestsStatusService,
    NotificationsService,
    EmailActionService,
  ],
  exports: [RequestsService, RequestsChecks],
})
export class RequestsModule {}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added module documentation and clarified inline comments.
- 2026-04-24 | José Ángel | Added JwtConfigModule, EmailActionService, and EmailActionController for email-based SOI approval.
*/