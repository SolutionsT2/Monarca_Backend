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
import { User } from 'src/users/entities/user.entity';
import { AuthorizationSubstitute } from 'src/roles/entity/authorization-substitute.entity';
import { NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ApproverSubstituteService } from './services/approver-substitute.service';
import { ApproverSubstituteMiddleware } from './middleware/approver-substitute.middleware';
import { RequestApprovalStep } from './entities/request-approval-step.entity';
import { ApprovalRulesModule } from 'src/approval-rules/approval-rules.module';
import { Destination } from 'src/destinations/entities/destination.entity';

/**
 * Module encapsulating request domain logic
 * and related integrations.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Request,
      RequestsDestination,
      RequestApprovalStep,
      Voucher,
      DocumentClass,
      Department,
      Destination,
      PolicyViolation,
      User,
      AuthorizationSubstitute,
    ]),
    GuardsModule,
    UsersModule,
    DestinationsModule,
    TravelAgenciesModule,
    RequestLogsModule,
    NotificationsModule,
    PolicyEngineModule,
    ApprovalRulesModule,
  ],
  controllers: [RequestsController, RequestsStatusController],
  providers: [
    RequestsService,
    RequestsChecks,
    RequestsStatusService,
    NotificationsService,
    ApproverSubstituteService,
    ApproverSubstituteMiddleware,
  ],
  exports: [RequestsService, RequestsChecks, ApproverSubstituteService],
})
export class RequestsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApproverSubstituteMiddleware).forRoutes(
      { path: 'requests/to-approve', method: RequestMethod.GET },
      { path: 'requests/approve/:id', method: RequestMethod.PATCH },
      { path: 'requests/deny/:id', method: RequestMethod.PATCH },
      {
        path: 'requests/finished-approving-vouchers/:id',
        method: RequestMethod.PATCH,
      },
    );
  }
}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added module documentation and clarified inline comments.
- 2026-05-12 | Juan de Dios Gastélum | Registered request approval steps and approval rules dependencies.
*/
