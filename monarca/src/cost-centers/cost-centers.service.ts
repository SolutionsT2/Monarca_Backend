import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostCenter } from './entity/cost-centers.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { CreateCostCenterDto } from './dto/cost-centers.dtos';

@Injectable()
export class CostCentersService {
  constructor(
    @InjectRepository(CostCenter)
    private readonly costCenterRepo: Repository<CostCenter>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Roles)
    private readonly roleRepo: Repository<Roles>,
  ) {}

  async createForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    data: CreateCostCenterDto,
  ): Promise<CostCenter> {
    const companyId = await this.resolveCompanyIdForCompanyAdmin(idRole, idDepartment);

    if (data.numericId !== undefined) {
      const duplicateNumeric = await this.costCenterRepo.findOne({
        where: {
          numericId: data.numericId,
          id_company: companyId,
        },
      });

      if (duplicateNumeric) {
        throw new BadRequestException(
          `Cost center numericId ${data.numericId} already exists for this company.`,
        );
      }
    }

    if (data.key !== undefined) {
      const key = data.key.trim();
      const duplicateKey = await this.costCenterRepo.findOne({
        where: {
          key,
          id_company: companyId,
        },
      });

      if (duplicateKey) {
        throw new BadRequestException(
          `Cost center key ${key} already exists for this company.`,
        );
      }
    }

    const entity = this.costCenterRepo.create({
      numericId: data.numericId,
      key: data.key?.trim(),
      name: data.name.trim(),
      id_company: companyId,
    });

    return this.costCenterRepo.save(entity);
  }

  async findAllForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
  ): Promise<CostCenter[]> {
    const companyId = await this.resolveCompanyIdForCompanyAdmin(idRole, idDepartment);

    return this.costCenterRepo.find({
      where: { id_company: companyId },
      order: { name: 'ASC' },
    });
  }

  private async resolveCompanyIdForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
  ): Promise<string> {
    const role = await this.roleRepo.findOne({ where: { id: idRole } });
    if (!role) {
      throw new ForbiddenException('Role not found');
    }

    const normalizedRole = role.name.trim().toLowerCase();
    const isCompanyAdmin = [
      'companyadmin',
      'company admin',
      'administrador de empresa',
      'admin empresa',
    ].includes(normalizedRole);

    if (!isCompanyAdmin) {
      throw new ForbiddenException('Only CompanyAdmin can access cost centers endpoints.');
    }

    if (!idDepartment) {
      throw new ForbiddenException(
        'CompanyAdmin must belong to a department associated with a company.',
      );
    }

    const department = await this.departmentRepo.findOne({ where: { id: idDepartment } });
    if (!department?.id_company) {
      throw new NotFoundException('Department company context not found.');
    }

    return department.id_company;
  }
}
