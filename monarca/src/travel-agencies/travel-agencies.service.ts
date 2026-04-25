/**
 * File: travel-agencies.service.ts
 * Description: Service for travel agency CRUD operations.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateTravelAgencyDto,
  TravelAgencyDto,
  UpdateTravelAgencyDto,
} from './dto/travel-agency.dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { TravelAgency } from './entities/travel-agency.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TravelAgenciesService {
  constructor(
    @InjectRepository(TravelAgency)
    private readonly repo: Repository<TravelAgency>,
  ) {}

  create(data: CreateTravelAgencyDto) {
    const ent = this.repo.create(data);
    return this.repo.save(ent);
  }

  async update(
    id: string,
    data: UpdateTravelAgencyDto,
  ): Promise<TravelAgencyDto> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ status: boolean; message: string }> {
    const result = await this.repo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Travel agency ${id} not found`);
    }

    return {
      status: true,
      message: `Travel agency ${id} removed`,
    };
  }

  findAll(): Promise<TravelAgencyDto[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<TravelAgencyDto> {
    const ent = await this.repo.findOne({
      where: { id },
      relations: { users: true },
    });
    if (!ent) throw new NotFoundException(`Travel agency ${id} not found`);
    return ent;
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
