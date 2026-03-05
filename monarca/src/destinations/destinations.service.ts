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

/**
 * DestinationsService
 * 
 * Service for managing destination entities including:
 * - Creating new destination records (city/country pairs)
 * - Retrieving destination information
 * - Updating destination details
 * - Removing destinations from the system
 * 
 * @class DestinationsService
 */
@Injectable()
export class DestinationsService {
  constructor(
    @InjectRepository(Destination)
    private readonly destRepo: Repository<Destination>,
  ) {}

  async create(data: CreateDestinationDto): Promise<Destination> {
    const dest = this.destRepo.create({
      country: data.country,
      city: data.city,
    });
    return this.destRepo.save(dest);
  }

  async findAll(): Promise<Destination[]> {
    return this.destRepo.find();
  }

  async findOne(id: string): Promise<Destination> {
    const dest = await this.destRepo.findOneBy({ id });
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
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
