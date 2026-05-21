import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { AccountingAccountsService } from './accounting-accounts.service';
import { CreateAccountingAccountDto, UpdateAccountingAccountDto } from './dto/accounting-account.dto';
import { ExcelUploadInterceptor } from 'src/utils/excel-upload.interceptor';
import { ConfirmAccountingAccountsDto } from './dto/import-accounting-accounts.dto';

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

  @Get(':id')
  async findOne(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.accountingAccountsService.findOneForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      id,
    );
  }

  @Patch(':id')
  async update(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateAccountingAccountDto,
  ) {
    return this.accountingAccountsService.updateForCompanyAdmin(
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
    return this.accountingAccountsService.deleteForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      id,
    );
  }

  @Post('import/preview')
  @UseInterceptors(ExcelUploadInterceptor())
  async previewImport(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.accountingAccountsService.previewExcelForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      file.buffer,
    );
  }

  @Post('import/confirm')
  async confirmImport(
    @Request() req: RequestInterface,
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Body() data: ConfirmAccountingAccountsDto,
  ) {
    return this.accountingAccountsService.confirmImportForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      data,
    );
  }
}