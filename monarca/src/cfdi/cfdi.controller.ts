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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CfdiService } from './cfdi.service';

@Controller('cfdi')
export class CfdiController {
  constructor(private readonly cfdiService: CfdiService) {}

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
