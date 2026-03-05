/**
<<<<<<< Updated upstream
 * File: reservations.module.ts
 * Description: Nest module that registers reservations controller, service, and Reservation entity.
 */

=======
 * Reservations Module
 * 
 * Module for managing travel reservations with file upload support.
 * Exports: ReservationsService, ReservationsController
 */
>>>>>>> Stashed changes
import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entity/reservations.entity';
import { RequestsModule } from 'src/requests/requests.module';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation]), RequestsModule,
GuardsModule],
  providers: [ReservationsService],
  controllers: [ReservationsController],
})
export class ReservationsModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
