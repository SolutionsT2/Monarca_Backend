/**
 * File: app.module.ts
 * Description: Root Nest module: static files, feature modules, TypeORM config, and seed provider.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsModule } from './departments/departments.module';
import { Roles } from './roles/entity/roles.entity';
import { TravelAgenciesModule } from './travel-agencies/travel-agencies.module';
import { RequestsModule } from './requests/requests.module';
import { RequestLogsModule } from './request-logs/request-logs.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { User } from './users/entities/user.entity';
import { UserLogs } from './user-logs/entity/user-logs.entity';
import { Department } from './departments/entity/department.entity';
import { Destination } from './destinations/entities/destination.entity';
import { Request } from './requests/entities/request.entity';
import { Reservation } from './reservations/entity/reservations.entity';
import { RequestsDestination } from './requests/entities/requests-destination.entity';
import { Permission } from './roles/entity/permissions.entity';
import { RequestLog } from './request-logs/entities/request-log.entity';
import { DestinationsModule } from './destinations/destinations.module';
import { TravelAgency } from './travel-agencies/entities/travel-agency.entity';
import { ReservationsModule } from './reservations/reservations.module';
import { Voucher } from './vouchers/entities/vouchers.entity';
import { RevisionsModule } from './revisions/revisions.module';
import { Revision } from './revisions/entities/revision.entity';
import { SeedService } from 'seed.service';
import { UserLogsModule } from './user-logs/user-logs.module';
import { RolePermission } from './roles/entity/roles_permissions.entity';
import { GuardsModule } from './guards/guards.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CostCentersModule } from './cost-centers/cost-centers.module';
import { CostCenter } from './cost-centers/entity/cost-centers.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { CfdiModule } from './cfdi/cfdi.module';
import { Cfdi } from './cfdi/cfdi.entity';
import { Delegation } from './delegations/entities/delegation.entity';
import { DelegationsModule } from './delegations/delegations.module';
import { Policy } from './policy-engine/entities/policy.entity';
import { PolicyRule } from './policy-engine/entities/policy-rule.entity';
import { PolicyViolation } from './policy-engine/entities/policy-violation.entity';
import { PolicyEngineModule } from './policy-engine/policy-engine.module';

// ---- Ditta Consulting integration entities ----
import { Company } from './companies/entity/company.entity';
import { AccountingAccount } from './accounting-accounts/entity/accounting-account.entity';
import { DocumentClass } from './document-classes/entity/document-class.entity';
import { PolicyExport } from './policy-exports/entity/policy-export.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/files',
    }),
    NotificationsModule,
    AuthModule,
    UsersModule,
    TravelAgenciesModule,
    Roles,
    DepartmentsModule,
    CostCentersModule,
    RequestsModule,
    RequestLogsModule,
    ReservationsModule,
    VouchersModule,
    RevisionsModule,
    DestinationsModule,
    UserLogsModule,
    GuardsModule,
    CfdiModule,
    DelegationsModule,
    PolicyEngineModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT
        ? parseInt(process.env.POSTGRES_PORT, 10)
        : 5433,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      entities: [
        User,
        Department,
        CostCenter,
        Destination,
        Request,
        RequestsDestination,
        Roles,
        RolePermission,
        Permission,
        Reservation,
        RequestLog,
        TravelAgency,
        Voucher,
        UserLogs,
        Revision,
        Cfdi,
        Policy,
        PolicyRule,
        PolicyViolation,
        Delegation,
        // Ditta Consulting
        Company,
        AccountingAccount,
        DocumentClass,
        PolicyExport,
      ],
      synchronize: true,
    }),

    TypeOrmModule.forFeature([
      User,
      Department,
      CostCenter,
      Destination,
      Request,
      RequestsDestination,
      Roles,
      RolePermission,
      Permission,
      Reservation,
      RequestLog,
      TravelAgency,
      Voucher,
      UserLogs,
      Revision,
      Cfdi,
      Policy,
      PolicyRule,
      PolicyViolation,
      Delegation,
      // Ditta Consulting
      Company,
      AccountingAccount,
      DocumentClass,
      PolicyExport,
    ]),
  ],
  controllers: [],
  providers: [SeedService],
})
export class AppModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 * - 2026-03-24: Added seed data for delegations.
 * - 2026-04-13 | Diego Vergara | Registered Ditta Consulting entities (Company, AccountingAccount, DocumentClass, PolicyExport) in TypeOrmModule for schema sync and dependency injection.
 */
