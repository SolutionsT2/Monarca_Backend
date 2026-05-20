/**
 * File: vouchers.controller.ts
 * Description: Controller for voucher upload (PDF/XML), CRUD, and approve/deny endpoints.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  Req,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher-dto';
import { UpdateVoucherDto } from './dto/update-voucher-dto';
import { Voucher } from './entities/vouchers.entity';
import { ApiTags } from '@nestjs/swagger';
import { UploadPdfInterceptor } from 'src/utils/interceptor.middleware';
import {
  UseInterceptors,
  UploadedFiles,
  InternalServerErrorException,
} from '@nestjs/common';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { promises as fs } from 'fs';
import { validateVoucherXmlRequiredFields } from './utils/xml-required-fields.validator';
import { CfdiService } from 'src/cfdi/cfdi.service';

@ApiTags('Vouchers') // Swagger documentation tag for the controller
@Controller('vouchers')
@UseGuards(AuthGuard, PermissionsGuard)
export class VouchersController {
  constructor(
    private readonly vouchersService: VouchersService,
    private readonly cfdiService: CfdiService,
  ) {}

  private async cleanupUploadedFiles(uploadedFiles: Express.Multer.File[]) {
    await Promise.allSettled(
      uploadedFiles.map((file) => fs.unlink(file.path)),
    );
  }

  // Create a new voucher
  @UseInterceptors(UploadPdfInterceptor())
  @Post('upload')
  async uploadVoucher(
    @Req() req: RequestInterface,
    @UploadedFiles()
    files: {
      file_url_pdf?: Express.Multer.File[];
      file_url_xml?: Express.Multer.File[];
    },
    @Body() dto: CreateVoucherDto,
  ) {
    const baseDownloadLink = process.env.DOWNLOAD_LINK?.replace(/\/+$/, '');
    const pathToVocuherDownload = '/files/vouchers/';
    if (!baseDownloadLink) {
      throw new InternalServerErrorException('DOWNLOAD_LINK not configured');
    }

    const id_user = req?.sessionInfo?.id;
    if (!id_user) {
      throw new UnauthorizedException('Missing authenticated session context.');
    }
    const fileMap: Record<string, string> = {};

    // flatten both arrays into one list
    const uploaded = [
      ...(files.file_url_pdf || []),
      ...(files.file_url_xml || []),
    ];

    const isForeign = dto.is_foreign === true;
    const xmlFile = files.file_url_xml?.[0];
    if (!isForeign && !xmlFile) {
      await this.cleanupUploadedFiles(uploaded);
      throw new BadRequestException({
        message: 'El XML es obligatorio para vouchers de Mexico.',
        errorCode: 'XML_REQUIRED',
      });
    }
    if (xmlFile) {
      let xmlContent: string;
      try {
        xmlContent = await fs.readFile(xmlFile.path, 'utf8');
      } catch {
        await this.cleanupUploadedFiles(uploaded);
        throw new BadRequestException({
          message: 'No se pudo leer el archivo XML cargado.',
          errorCode: 'XML_READ_ERROR',
        });
      }

      const validation = validateVoucherXmlRequiredFields(xmlContent);
      if (!validation.isValid) {
        await this.cleanupUploadedFiles(uploaded);
        throw new BadRequestException({
          message: 'El XML es inválido. Faltan campos obligatorios.',
          errorCode: 'INVALID_XML_REQUIRED_FIELDS',
          missingFields: validation.missingFields,
        });
      }

      try {
        await this.cfdiService.processXML(xmlContent);
      } catch (err) {
        await this.cleanupUploadedFiles(uploaded);
        throw err;
      }
    }

    for (const file of uploaded) {
      const publicUrl = `${baseDownloadLink}${pathToVocuherDownload}${file.filename}`;
      if (file.fieldname === 'file_url_pdf') {
        fileMap.file_url_pdf = publicUrl;
      } else if (file.fieldname === 'file_url_xml') {
        fileMap.file_url_xml = publicUrl;
      }
    }

    return this.vouchersService.create(id_user, { ...dto, ...fileMap });
  }

  // Get all vouchers for the current user
  @Get('user')
  async findByUser(@Req() req: RequestInterface): Promise<Voucher[]> {
    const userId = req?.sessionInfo?.id;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated session context.');
    }
    return this.vouchersService.findByUser(userId);
  }

  // Get all vouchers
  @Get()
  async findAll(): Promise<Voucher[]> {
    return this.vouchersService.findAll();
  }

  // Get a single voucher by its ID
  @Get(':requestId')
  async findByRequest(
    @Param('requestId') requestId: string,
  ): Promise<Voucher[]> {
    return this.vouchersService.findByRequest(requestId);
  }

  // Update an existing voucher
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    return this.vouchersService.update(id, updateVoucherDto);
  }

  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
  ): Promise<{ status: boolean; message: string }> {
    return this.vouchersService.approve(id);
  }

  @Patch(':id/deny')
  async deny(
    @Param('id') id: string,
  ): Promise<{ status: boolean; message: string }> {
    return this.vouchersService.deny(id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ status: boolean; message: string }> {
    return this.vouchersService.remove(id);
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history; consolidated Nest imports.
 */
