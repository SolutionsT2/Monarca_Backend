import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto } from './dto/cost-centers.dtos';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly costCentersService: CostCentersService) {}

  @Get()
  async findAll(@Request() req: RequestInterface) {
    return this.costCentersService.findAllForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
    );
  }

  @Post()
  async create(
    @Request() req: RequestInterface,
    @Body() data: CreateCostCenterDto,
  ) {
    return this.costCentersService.createForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      data,
    );
  }

  @Delete(':id')
  async delete(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.costCentersService.deleteForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      id,
    );
  }
}
