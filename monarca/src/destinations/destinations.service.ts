/**
 * File: destinations.service.ts
 * Description: Service for managing destination entities (CRUD operations).
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from './entities/destination.entity';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { Airport } from './entities/airport.entity';
import { CreateAirportDto } from './dto/create-airport.dto';
import { UpdateAirportDto } from './dto/update-airport.dto';

@Injectable()
export class DestinationsService {
  constructor(
    @InjectRepository(Destination)
    private readonly destRepo: Repository<Destination>,
    @InjectRepository(Airport)
    private readonly airportRepo: Repository<Airport>,
  ) {}

  async create(data: CreateDestinationDto): Promise<Destination> {
    const dest = this.destRepo.create({
      country: data.country,
      city: data.city,
    });
    return this.destRepo.save(dest);
  }

  async findAll(): Promise<Destination[]> {
    return this.destRepo.find({
      relations: ['airports'],
      order: {
        country: 'ASC',
        city: 'ASC',
        airports: {
          is_primary: 'DESC',
          iata_code: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<Destination> {
    const dest = await this.destRepo.findOne({
      where: { id },
      relations: ['airports'],
      order: {
        airports: {
          is_primary: 'DESC',
          iata_code: 'ASC',
        },
      },
    });
    if (!dest) {
      throw new NotFoundException(`Destination ${id} not found`);
    }
    return dest;
  }

  async update(id: string, data: UpdateDestinationDto): Promise<Destination> {
    await this.destRepo.update(id, {
      ...(data.country !== undefined && { country: data.country }),
      ...(data.city !== undefined && { city: data.city }),
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ status: boolean; message: string }> {
    await this.destRepo.delete(id);
    return { status: true, message: `Destination ${id} removed` };
  }

  async findAirports(destinationId: string): Promise<Airport[]> {
    await this.findOne(destinationId);

    return this.airportRepo.find({
      where: { id_destination: destinationId },
      order: { is_primary: 'DESC', iata_code: 'ASC' },
    });
  }

  async createAirport(
    destinationId: string,
    data: CreateAirportDto,
  ): Promise<Airport> {
    await this.findOne(destinationId);

    if (data.is_primary) {
      await this.airportRepo.update(
        { id_destination: destinationId },
        { is_primary: false },
      );
    }

    const airport = this.airportRepo.create({
      id_destination: destinationId,
      iata_code: data.iata_code.trim().toUpperCase(),
      name: data.name.trim(),
      is_primary: data.is_primary ?? false,
      is_active: data.is_active ?? true,
    });

    return this.airportRepo.save(airport);
  }

  async updateAirport(
    destinationId: string,
    airportId: string,
    data: UpdateAirportDto,
  ): Promise<Airport> {
    const airport = await this.airportRepo.findOne({
      where: { id: airportId, id_destination: destinationId },
    });

    if (!airport) {
      throw new NotFoundException(
        `Airport ${airportId} not found for destination ${destinationId}`,
      );
    }

    if (data.is_primary === true) {
      await this.airportRepo.update(
        { id_destination: destinationId },
        { is_primary: false },
      );
    }

    await this.airportRepo.update(airportId, {
      ...(data.iata_code !== undefined && {
        iata_code: data.iata_code.trim().toUpperCase(),
      }),
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.is_primary !== undefined && { is_primary: data.is_primary }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
    });

    const updatedAirport = await this.airportRepo.findOne({
      where: { id: airportId },
    });

    if (!updatedAirport) {
      throw new NotFoundException(`Airport ${airportId} not found`);
    }

    return updatedAirport;
  }

  async removeAirport(
    destinationId: string,
    airportId: string,
  ): Promise<{ status: boolean; message: string }> {
    const airport = await this.airportRepo.findOne({
      where: { id: airportId, id_destination: destinationId },
    });

    if (!airport) {
      throw new NotFoundException(
        `Airport ${airportId} not found for destination ${destinationId}`,
      );
    }

    await this.airportRepo.delete(airportId);

    return {
      status: true,
      message: `Airport ${airportId} removed from destination ${destinationId}`,
    };
  }
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
