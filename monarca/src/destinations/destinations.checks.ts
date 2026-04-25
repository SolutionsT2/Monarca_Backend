/**
 * File: destinations.checks.ts
 * Description: Helper service for validating destinations and retrieving destination information.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from './entities/destination.entity';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { Airport } from './entities/airport.entity';

@Injectable()
export class DestinationsChecks {
  constructor(
    @InjectRepository(Destination)
    private readonly destRepo: Repository<Destination>,
    @InjectRepository(Airport)
    private readonly airportRepo: Repository<Airport>,
  ) {}

  async isValid(id: string): Promise<boolean> {
    const dest = await this.destRepo.findOneBy({ id });

    return !!dest;
  }

  async getCityNameById(id: string): Promise<string> {
    const dest = await this.destRepo.findOneBy({ id });
    return dest?.city || 'Unknown city';
  }

  async isAirportValid(id: string): Promise<boolean> {
    const airport = await this.airportRepo.findOneBy({ id });
    return !!airport;
  }

  async isAirportInDestination(
    airportId: string,
    destinationId: string,
  ): Promise<boolean> {
    const airport = await this.airportRepo.findOne({
      where: {
        id: airportId,
        id_destination: destinationId,
      },
    });

    return !!airport;
  }
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer; translated comments/strings to English.
 */
