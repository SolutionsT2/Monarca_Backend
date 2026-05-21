import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import { ExcelUploadInterceptor } from 'src/utils/excel-upload.interceptor';
import { ConfirmBankAccountsDto } from './dto/import-bank-accounts.dto';

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

    return this.bankAccountsService.previewExcelForCompanyAdmin(
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
    @Body() data: ConfirmBankAccountsDto,
  ) {
    return this.bankAccountsService.confirmImportForCompanyAdmin(
      req.userInfo.id_role,
      req.userInfo.id_department,
      companyId,
      data,
    );
  }
}
