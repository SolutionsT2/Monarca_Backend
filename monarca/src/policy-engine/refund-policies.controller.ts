import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import {
  CreateRefundPolicyDto,
  UpdateRefundPolicyDto,
} from './dto/refund-policies.dtos';
import { RefundPoliciesService } from './refund-policies.service';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('refund-policies')
export class RefundPoliciesController {
  constructor(private readonly refundPoliciesService: RefundPoliciesService) {}

  @Get()
  async findGroupedByCompany(@Request() req: RequestInterface) {
    return this.refundPoliciesService.findGroupedByCompany(
      req.userInfo.id_role,
      req.userInfo.id_department,
    );
  }

  @Get(':id')
  async findOne(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.refundPoliciesService.findOne(
      id,
      req.userInfo.id_role,
      req.userInfo.id_department,
    );
  }

  @Post()
  async create(@Request() req: RequestInterface, @Body() data: CreateRefundPolicyDto) {
    return this.refundPoliciesService.create(
      req.userInfo.id_role,
      req.userInfo.id_department,
      data,
    );
  }

  @Patch(':id')
  async update(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateRefundPolicyDto,
  ) {
    return this.refundPoliciesService.update(
      id,
      req.userInfo.id_role,
      req.userInfo.id_department,
      data,
    );
  }

  @Delete(':id')
  async remove(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.refundPoliciesService.remove(
      id,
      req.userInfo.id_role,
      req.userInfo.id_department,
    );
  }
}
