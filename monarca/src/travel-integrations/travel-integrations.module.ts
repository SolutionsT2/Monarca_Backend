import { Module } from '@nestjs/common';
import { GuardsModule } from 'src/guards/guards.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { RequestsModule } from 'src/requests/requests.module';
import { DuffelController } from './controllers/duffel.controller';
import { DuffelService } from './services/duffel.service';

@Module({
  imports: [
    GuardsModule,
    NotificationsModule,
    RequestsModule,
  ],
  controllers: [DuffelController],
  providers: [DuffelService],
  exports: [DuffelService],
})
export class TravelIntegrationsModule {}
