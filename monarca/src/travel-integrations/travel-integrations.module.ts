import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardsModule } from 'src/guards/guards.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { RequestsModule } from 'src/requests/requests.module';
import { Reservation } from 'src/reservations/entity/reservations.entity';
import { DuffelController } from './controllers/duffel.controller';
import { DuffelWebhookController } from './controllers/duffel-webhook.controller';
import { DuffelService } from './services/duffel.service';
import { DuffelWebhookService } from './services/duffel-webhook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    GuardsModule,
    NotificationsModule,
    RequestsModule,
  ],
  controllers: [DuffelController, DuffelWebhookController],
  providers: [DuffelService, DuffelWebhookService],
  exports: [DuffelService, DuffelWebhookService],
})
export class TravelIntegrationsModule {}
