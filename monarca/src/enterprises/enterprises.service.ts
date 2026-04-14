import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateEnterpriseDto,
  EnterpriseDto,
  UpdateEnterpriseDto,
} from './dto/enterprise.dtos';
import { Enterprise } from './entities/enterprise.entity';

@Injectable()
export class EnterprisesService {
  constructor(
    @InjectRepository(Enterprise)
    private readonly repo: Repository<Enterprise>,
  ) {}

  create(data: CreateEnterpriseDto) {
    const enterprise = this.repo.create({
      name: data.name.trim(),
      currency: data.currency,
      departments: data.departments.map((department) => ({
        name: department.name.trim(),
        cost_center_id: department.cost_center_id,
      })),
    });

    return this.repo.save(enterprise);
  }

  findAll(): Promise<EnterpriseDto[]> {
    return this.repo.find({
      relations: ['departments'],
    });
  }

  async findOne(id: string): Promise<EnterpriseDto> {
    const enterprise = await this.repo.findOne({
      where: { id },
      relations: ['departments'],
    });

    if (!enterprise) {
      throw new NotFoundException(`Enterprise ${id} not found`);
    }

    return enterprise;
  }

  async update(id: string, data: UpdateEnterpriseDto): Promise<EnterpriseDto> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['departments'],
    });

    if (!entity) {
      throw new NotFoundException(`Enterprise ${id} not found`);
    }

    if (data.name !== undefined) {
      entity.name = data.name.trim();
    }

    if (data.currency !== undefined) {
      entity.currency = data.currency;
    }

    if (data.departments !== undefined) {
      entity.departments = data.departments.map((department) => ({
        name: department.name.trim(),
        cost_center_id: department.cost_center_id,
      })) as Enterprise['departments'];
    }

    await this.repo.save(entity);
    return this.findOne(id);
  }

  remove(id: string) {
    return `This action removes a #${id} enterprise`;
  }
}
