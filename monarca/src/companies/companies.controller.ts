import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateCompanyDepartmentDto,
  CreateCompanyDto,
  UpdateCompanyDto,
} from './dto/company.dtos';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() data: CreateCompanyDto) {
    return this.companiesService.create(data);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, data);
  }

  @Post(':id/departments')
  createDepartment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: CreateCompanyDepartmentDto,
  ) {
    return this.companiesService.createDepartment(id, data);
  }

  @Get(':id/departments')
  findDepartments(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companiesService.findDepartments(id);
  }
}
