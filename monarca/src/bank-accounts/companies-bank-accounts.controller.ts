import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('companies/:companyId/bank-accounts')
export class CompaniesBankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  async findAll(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
  ) {
    return this.bankAccountsService.findAllForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
    );
  }

  @Post()
  async create(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Body() data: CreateBankAccountDto,
  ) {
    return this.bankAccountsService.createForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      data,
    );
  }

  @Patch(':id')
  async update(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateBankAccountDto,
  ) {
    return this.bankAccountsService.updateForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      id,
      data,
    );
  }

  @Delete(':id')
  async delete(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bankAccountsService.deleteForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      id,
    );
  }
}
