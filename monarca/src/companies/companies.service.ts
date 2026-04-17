import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CompanyDto,
  CompanyDepartmentDto,
  CreateCompanyDepartmentDto,
  CreateCompanyDto,
  UpdateCompanyDto,
} from './dto/company.dtos';
import { Company } from './entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(CostCenter)
    private readonly costCenterRepo: Repository<CostCenter>,
  ) {}

  create(data: CreateCompanyDto): Promise<CompanyDto> {
    const company = this.companyRepo.create({
      key: data.key.trim(),
      name: data.name.trim(),
      localCurrency: data.localCurrency.trim().toUpperCase(),
    });

    return this.companyRepo.save(company);
  }

  findAll(): Promise<CompanyDto[]> {
    return this.companyRepo.find();
  }

  async findOne(id: string): Promise<CompanyDto> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async update(id: string, data: UpdateCompanyDto): Promise<CompanyDto> {
    const company = await this.findOne(id);

    if (data.key !== undefined) company.key = data.key.trim();
    if (data.name !== undefined) company.name = data.name.trim();
    if (data.localCurrency !== undefined) {
      company.localCurrency = data.localCurrency.trim().toUpperCase();
    }

    await this.companyRepo.save(company);
    return this.findOne(id);
  }

  async createDepartment(
    idCompany: string,
    data: CreateCompanyDepartmentDto,
  ): Promise<CompanyDepartmentDto> {
    await this.findOne(idCompany);

    const costCenter = await this.costCenterRepo.findOne({
      where: { id: data.cost_center_id },
    });

    if (!costCenter) {
      throw new NotFoundException(
        `Cost center ${data.cost_center_id} not found`,
      );
    }

    const department = this.departmentRepo.create({
      name: data.name.trim(),
      id_company: idCompany,
      cost_center: costCenter,
    });

    return this.departmentRepo.save(department);
  }

  findDepartments(idCompany: string): Promise<CompanyDepartmentDto[]> {
    return this.departmentRepo.find({
      where: { id_company: idCompany },
      relations: ['cost_center'],
      order: { name: 'ASC' },
    });
  }
}
