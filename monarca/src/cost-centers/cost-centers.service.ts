import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CostCenter } from './entity/cost-centers.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { CreateCostCenterDto } from './dto/cost-centers.dtos';
import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ConfirmCostCentersDto,
  PreviewCostCentersResponseDto,
  PreviewCostCenterRowDto,
} from './dto/import-cost-centers.dto';
import { ImportResultDto } from 'src/utils/import-result.dto';
import {
  getRowValue,
  normalizeCellValue,
  normalizeNumberValue,
  parseExcelRows,
} from 'src/utils/excel-import.utils';

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
          deletedAt: IsNull(),
        },
      });

      if (duplicateNumeric) {
        throw new BadRequestException(
          `Centro de costo con ID numérico ${data.numericId} ya existe para esta empresa.`,
        );
      }
    }

    if (data.key !== undefined) {
      const key = data.key.trim();
      const duplicateKey = await this.costCenterRepo.findOne({
        where: {
          key,
          id_company: companyId,
          deletedAt: IsNull(),
        },
      });

      if (duplicateKey) {
        throw new BadRequestException(
          `Centro de costo con llave ${key} ya existe para esta empresa.`,
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

  async previewExcelForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    buffer: Buffer,
  ): Promise<PreviewCostCentersResponseDto> {
    const companyId = await this.resolveCompanyIdForCompanyAdmin(idRole, idDepartment);

    const rows = parseExcelRows(buffer);
    if (!rows.length) {
      throw new HttpException({ errors: { file: ['El archivo Excel no contiene filas'] } }, HttpStatus.BAD_REQUEST);
    }

    const costCenters = rows.map((row, index) => this.mapCostCenterPreviewRow(row, index + 2, companyId));
    const errorRows = costCenters.filter((row) => row.validationErrors.length > 0).length;

    return {
      costCenters,
      totalRows: costCenters.length,
      validRows: costCenters.length - errorRows,
      errorRows,
    };
  }

  async confirmImportForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    data: ConfirmCostCentersDto,
  ): Promise<ImportResultDto> {
    const companyId = await this.resolveCompanyIdForCompanyAdmin(idRole, idDepartment);

    if (!data.costCenters?.length) {
      throw new HttpException({ errors: { costCenters: ['No se proporcionaron centros de costo para importar'] } }, HttpStatus.BAD_REQUEST);
    }

    const result: ImportResultDto = { created: 0, updated: 0, errors: [] };

    for (const [index, costCenter] of data.costCenters.entries()) {
      try {
        const normalizedKey = normalizeCellValue(costCenter.key);
        const normalizedName = normalizeCellValue(costCenter.name);

        if (!normalizedName) {
          throw new HttpException({ errors: { name: ['El nombre es obligatorio'] } }, HttpStatus.BAD_REQUEST);
        }

        const whereConditions: any = { id_company: companyId, deletedAt: IsNull() };
        if (normalizedKey) {
          whereConditions.key = normalizedKey;
        } else if (costCenter.numericId !== undefined && costCenter.numericId !== null) {
          whereConditions.numericId = costCenter.numericId;
        } else {
          whereConditions.name = normalizedName;
        }

        const existing = await this.costCenterRepo.findOne({
          where: whereConditions,
        });

        if (existing) {
          existing.key = normalizedKey ?? existing.key;
          existing.name = normalizedName;
          existing.numericId = costCenter.numericId ?? existing.numericId;
          await this.costCenterRepo.save(existing);
          result.updated += 1;
        } else {
          await this.createForCompanyAdmin(idRole, idDepartment, {
            key: normalizedKey ?? undefined,
            name: normalizedName,
            numericId: costCenter.numericId ?? undefined,
          });
          result.created += 1;
        }
      } catch (error) {
        result.errors.push({
          row: `row-${index + 2}`,
          message: this.formatImportErrorMessage(error, 'Error inesperado al importar centros de costo'),
        });
      }
    }

    return result;
  }

  async findAllForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
  ): Promise<CostCenter[]> {
    const companyId = await this.resolveCompanyIdForCompanyAdmin(idRole, idDepartment);

    return this.costCenterRepo.find({
      where: { id_company: companyId, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async deleteForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCostCenter: string,
  ): Promise<void> {
    const companyId = await this.resolveCompanyIdForCompanyAdmin(idRole, idDepartment);

    const costCenter = await this.costCenterRepo.findOne({
      where: {
        id: idCostCenter,
        id_company: companyId,
        deletedAt: IsNull(),
      },
    });

    if (!costCenter) {
      throw new NotFoundException(`Centro de costo ${idCostCenter} no se encontró para esta empresa`);
    }

    const departmentsUsingCostCenter = await this.departmentRepo.count({
      where: {
        id_company: companyId,
        cost_center: { id: idCostCenter },
      },
    });

    if (departmentsUsingCostCenter > 0) {
      throw new BadRequestException(
        'Centro de costo asignado a uno o más departamentos. Reasigne los departamentos antes de eliminarlo.',
      );
    }

    await this.costCenterRepo.update(
      { id: idCostCenter },
      { deletedAt: new Date() },
    );
  }

  async updateDepartmentCostCenterForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
    idCompany: string,
    idTargetDepartment: string,
    costCenterId: number,
  ): Promise<Department> {
    await this.resolveCompanyIdForCompanyAdmin(idRole, idDepartment);

    const targetDepartment = await this.departmentRepo.findOne({
      where: {
        id: idTargetDepartment,
        id_company: idCompany,
      },
      relations: ['cost_center'],
    });

    if (!targetDepartment) {
      throw new NotFoundException(`Departmento ${idTargetDepartment} no se encontró dentro de esta empresa`);
    }

    const costCenter = await this.costCenterRepo.findOne({
      where: {
        numericId: costCenterId,
        id_company: idCompany,
        deletedAt: IsNull(),
      },
    });

    if (!costCenter) {
      throw new NotFoundException(`Cost center ${costCenterId} no se encontró para esta empresa`);
    }

    targetDepartment.cost_center = costCenter;

    return this.departmentRepo.save(targetDepartment);
  }

  private async resolveCompanyIdForCompanyAdmin(
    idRole: string,
    idDepartment: string | undefined,
  ): Promise<string> {
    const role = await this.roleRepo.findOne({ where: { id: idRole } });
    if (!role) {
      throw new ForbiddenException('Rol no encontrado');
    }

    const normalizedRole = role.name.trim().toLowerCase();
    const isCompanyAdmin = [
      'companyadmin',
      'company admin',
      'administrador de empresa',
      'admin empresa',
    ].includes(normalizedRole);

    if (!isCompanyAdmin) {
      throw new ForbiddenException(
        'Solo CompanyAdmin puede gestionar centros de costos.',
      );
    }

    if (!idDepartment) {
      throw new ForbiddenException(
        'El CompanyAdmin debe pertenecer a un departamento asociado a una empresa.',
      );
    }

    const department = await this.departmentRepo.findOne({ where: { id: idDepartment } });
    if (!department?.id_company) {
      throw new NotFoundException(
        'No se encontró el contexto de empresa del departamento.',
      );
    }

    return department.id_company;
  }

  private mapCostCenterPreviewRow(
    row: Record<string, any>,
    rowNumber: number,
    companyId: string,
  ): PreviewCostCenterRowDto {
    const numericId = normalizeNumberValue(
      getRowValue(row, 'numericid', 'numeric id', 'id numerico', 'id numérico', 'id_numerico'),
    );
    const key = normalizeCellValue(getRowValue(row, 'key', 'llave', 'clave'));
    const name = normalizeCellValue(getRowValue(row, 'name', 'nombre')) ?? '';

    const validationErrors: string[] = [];

    if (!name) {
      validationErrors.push('El nombre es obligatorio');
    }

    return {
      row: rowNumber,
      numericId,
      key,
      name,
      isUpdate: false,
      validationErrors,
    };
  }

  private formatImportErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }

      if (response && typeof response === 'object') {
        return JSON.stringify(response);
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
