import {
  Body,
  Controller,
  BadRequestException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  CreateCompanyDepartmentDto,
  CreateCompanyDto,
  UpdateCompanyDepartmentCostCenterDto,
  UpdateCompanyDto,
} from './dto/company.dtos';
import { ExcelUploadInterceptor } from 'src/utils/excel-upload.interceptor';
import { ConfirmDepartmentsDto } from './dto/import-departments.dto';
import { CompaniesService } from './companies.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async create(@Request() req: RequestInterface, @Body() data: CreateCompanyDto) {
    await this.companiesService.assertSuperAdmin(req.userInfo.id_role);
    return this.companiesService.create(data);
  }

  @Get()
  async findAll(@Request() req: RequestInterface) {
    await this.companiesService.assertSuperAdmin(req.userInfo.id_role);
    return this.companiesService.findAll();
  }

  @Get(':id')
  async findOne(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateCompanyDto,
  ) {
    await this.companiesService.assertSuperAdmin(req.userInfo.id_role);
    return this.companiesService.update(id, data);
  }

  @Post(':id/departments')
  async createDepartment(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: CreateCompanyDepartmentDto,
  ) {
    await this.companiesService.assertCompanyDepartmentAccess(
      req.userInfo.id_role,
      req.userInfo.id_department,
      id,
    );
    return this.companiesService.createDepartment(id, data);
  }

  @Get(':id/departments')
  async findDepartments(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.companiesService.assertCompanyDepartmentAccess(
      req.userInfo.id_role,
      req.userInfo.id_department,
      id,
    );
    return this.companiesService.findDepartments(id);
  }

  @Patch(':id/departments/:departmentId/cost-center')
  async updateDepartmentCostCenter(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('departmentId', new ParseUUIDPipe()) departmentId: string,
    @Body() data: UpdateCompanyDepartmentCostCenterDto,
  ) {
    await this.companiesService.assertCompanyDepartmentAccess(
      req.userInfo.id_role,
      req.userInfo.id_department,
      id,
    );

    return this.companiesService.updateDepartmentCostCenter(
      id,
      departmentId,
      data,
    );
  }

  @Post(':id/departments/import/preview')
  @UseInterceptors(ExcelUploadInterceptor())
  async previewDepartmentsImport(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.companiesService.previewDepartmentsExcel(
      req.userInfo.id_role,
      req.userInfo.id_department,
      id,
      file.buffer,
    );
  }

  @Post(':id/departments/import/confirm')
  async confirmDepartmentsImport(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: ConfirmDepartmentsDto,
  ) {
    return this.companiesService.confirmDepartmentsImport(
      req.userInfo.id_role,
      req.userInfo.id_department,
      id,
      data,
    );
  }
}
