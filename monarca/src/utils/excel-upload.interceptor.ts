/**
 * File: excel-upload.interceptor.ts
 * Description: Multer-based file interceptor for Excel uploads (.xlsx/.xls), using memory storage.
 */

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

export const ExcelUploadInterceptor = () =>
  FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
        return cb(
          new BadRequestException('Only .xlsx and .xls files are allowed'),
          false,
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
  });
