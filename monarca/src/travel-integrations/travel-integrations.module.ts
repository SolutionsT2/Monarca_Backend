import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardsModule } from 'src/guards/guards.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { RequestsModule } from 'src/requests/requests.module';
import { Reservation } from 'src/reservations/entity/reservations.entity';
import { ReservationsModule } from 'src/reservations/reservations.module';
import { DuffelWebhookController } from './controllers/duffel-webhook.controller';
import { DuffelController } from './controllers/duffel.controller';
import { DuffelWebhookService } from './services/duffel-webhook.service';
import { DuffelService } from './services/duffel.service';

@Module({
  imports: [
    GuardsModule,
    NotificationsModule,
    RequestsModule,
    ReservationsModule,
    TypeOrmModule.forFeature([Reservation]),
  ],
  controllers: [DuffelController, DuffelWebhookController],
  providers: [DuffelService, DuffelWebhookService],
  exports: [DuffelService, DuffelWebhookService],
})
export class TravelIntegrationsModule {}
