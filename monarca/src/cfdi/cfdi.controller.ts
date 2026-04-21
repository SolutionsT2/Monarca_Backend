/**
 * File: cfdi.controller.ts
 * Description:
 */

import {
  BadRequestException,
  Controller,
  HttpException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CfdiService } from './cfdi.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('cfdi')
export class CfdiController {
  constructor(private readonly cfdiService: CfdiService) {}

  @Post('preview')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async preview(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException(
        'Falta el archivo: envía multipart/form-data con el campo "file"',
      );
    }

    if (!file.originalname.toLowerCase().endsWith('.xml')) {
      throw new BadRequestException('El archivo debe ser XML');
    }

    const xml = file.buffer.toString('utf8');

    try {
      return await this.cfdiService.previewForVoucher(xml);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException(
        'Missing file: send multipart/form-data with field name "file"',
      );
    }

    if (!file.originalname.endsWith('.xml')) {
      throw new BadRequestException('File must be an XML');
    }

    const xml = file.buffer.toString();

    try {
      return await this.cfdiService.processXML(xml);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

/**
 * Modification History:
 * - 2026-02-26:
 */
