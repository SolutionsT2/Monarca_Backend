/**
<<<<<<< Updated upstream
 * File: travel-agencies.module.ts
 * Description: Nest module that registers travel agencies controller, service, checks and TravelAgency entity.
 */

=======
 * Travel Agencies Module
 * 
 * Module for managing travel agency operations and reservations.
 * Exports: TravelAgenciesService, TravelAgenciesController, TravelAgenciesChecks
 */
>>>>>>> Stashed changes
import { Module } from '@nestjs/common';
import { TravelAgenciesService } from './travel-agencies.service';
import { TravelAgenciesController } from './travel-agencies.controller';
import { TravelAgency } from './entities/travel-agency.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelAgenciesChecks } from './travel-agencies.checks';

@Module({
  imports: [TypeOrmModule.forFeature([TravelAgency])],
  controllers: [TravelAgenciesController],
  providers: [TravelAgenciesService, TravelAgenciesChecks],
  exports: [TravelAgenciesChecks],
})
export class TravelAgenciesModule {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
