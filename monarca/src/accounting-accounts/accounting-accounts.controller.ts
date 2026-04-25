import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { AccountingAccountsService } from './accounting-accounts.service';
import { CreateAccountingAccountDto } from './dto/accounting-account.dto';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('companies/:companyId/accounting-accounts')
export class AccountingAccountsController {
  constructor(private readonly accountingAccountsService: AccountingAccountsService) {}

  @Get()
  async findAll(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
  ) {
    return this.accountingAccountsService.findAllForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
    );
  }

  @Post()
  async create(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Body() data: CreateAccountingAccountDto,
  ) {
    return this.accountingAccountsService.createForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      data,
    );
  }

  @Delete(':id')
  async delete(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.accountingAccountsService.deleteForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      id,
    );
  }
}