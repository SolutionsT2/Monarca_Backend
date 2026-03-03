/**
 * File: update-voucher-dto.ts
 * Description: DTO for updating a voucher (partial of create), with Swagger.
 */

import { CreateVoucherDto } from './create-voucher-dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
