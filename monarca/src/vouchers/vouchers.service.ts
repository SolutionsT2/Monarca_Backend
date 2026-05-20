/**
 * File: vouchers.service.ts
 * Description: Service for voucher CRUD, create (with creator check), approve/deny, and findByRequest.
 */

import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher-dto';
import { UpdateVoucherDto } from './dto/update-voucher-dto';
import { Voucher } from './entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { PolicyEngineService } from 'src/policy-engine/policy-engine.service';
import { DocumentClass } from 'src/document-classes/entity/document-class.entity';
@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(Request)
    private readonly rRepo: Repository<Request>,
    @InjectRepository(DocumentClass)
    private readonly documentClassRepo: Repository<DocumentClass>,
    private readonly policyEngineService: PolicyEngineService,
  ) {}

  private async getVoucherDocumentClassId(): Promise<string> {
    const documentClass = await this.documentClassRepo.findOne({
      where: { key: 'gv' },
    });

    if (!documentClass) {
      throw new NotFoundException('Document class with key gv not found.');
    }

    return documentClass.id;
  }

  async create(id_user: string, data: CreateVoucherDto): Promise<Voucher> {
    const request = await this.rRepo.findOne({
      where: { id: data.id_request },
    });
    if (!request) {
      throw new NotFoundException(
        `RequestDestination ${data.id_request} not found`,
      );
    }
    const approverId = request.id_admin;
    const id_creator = request.id_user;
    if (id_user !== id_creator) {
      throw new ForbiddenException(
        `User ${id_user} is not authorized to create a voucher for this request`,
      );
    }

    const duplicate = await this.findDuplicateVoucher(data);
    if (duplicate) {
      throw new ConflictException(
        'Duplicate voucher detected for this request. Please review the existing voucher before uploading again.',
      );
    }

    const voucher = this.voucherRepo.create({
      id_request: data.id_request, // Using the correct DTO property
      id_document_class: await this.getVoucherDocumentClassId(),
      class: data.class,
      amount: data.amount,
      currency: data.currency,
      amount_mxn: data.amount_mxn ?? null,
      tax_type: data.tax_type,
      date: new Date(data.date), // Ensuring that the date is correctly parsed
      file_url_pdf: data.file_url_pdf,
      file_url_xml: data.file_url_xml,
      is_foreign: data.is_foreign ?? false,
      status: data.status,
      id_approver: approverId, // Mapping the correct file URL
    });
    const savedVoucher = await this.voucherRepo.save(voucher);

    const violations = await this.policyEngineService.evaluate(savedVoucher);
    if (violations.length > 0) {
      await this.voucherRepo.delete(savedVoucher.id);
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: 'Voucher violates reimbursement policies.',
        policy_summary: {
          total_rules: violations.length,
          passed: 0,
          failed: violations.length,
          blocking_violations: violations.length,
          can_submit: false,
          violations: violations.map((violation) => ({
            policy_id: violation.id_policy_rule,
            policy_code: violation.id_policy_rule,
            passed: false,
            message: violation.detail,
            severity: 'BLOCKING',
            consequence: 'POLICY_VIOLATION',
            can_override: false,
          })),
        },
      });
    }

    return savedVoucher;
  }

  private async findDuplicateVoucher(data: CreateVoucherDto): Promise<Voucher | null> {
    const normalizedDate = data.date ? new Date(data.date) : null;
    const hasPdf = Boolean(data.file_url_pdf);
    const hasXml = Boolean(data.file_url_xml);

    if (hasPdf || hasXml) {
      const fileMatches = await this.voucherRepo.findOne({
        where: [
          ...(hasPdf
            ? [
                {
                  id_request: data.id_request,
                  file_url_pdf: data.file_url_pdf,
                },
              ]
            : []),
          ...(hasXml
            ? [
                {
                  id_request: data.id_request,
                  file_url_xml: data.file_url_xml,
                },
              ]
            : []),
        ],
      });

      if (fileMatches) {
        return fileMatches;
      }
    }

    if (!normalizedDate) {
      return null;
    }

    return this.voucherRepo.findOne({
      where: {
        id_request: data.id_request,
        class: data.class,
        amount: data.amount,
        currency: data.currency,
        date: normalizedDate,
      },
    });
  }

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepo.find();
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }
    return voucher;
  }

  async update(id: string, data: UpdateVoucherDto): Promise<Voucher> {
    const existingVoucher = await this.findOne(id); // Ensure we find the voucher first

    const updatedVoucherData = {
      // Update only provided fields
      id_request: data.id_request ?? existingVoucher.id_request, // Use existing if not provided
      id_document_class: await this.getVoucherDocumentClassId(),
      class: data.class ?? existingVoucher.class, // Use existing if not provided
      amount: data.amount ?? existingVoucher.amount, // Use existing if not provided
      tax_type: data.tax_type ?? existingVoucher.tax_type, // Use existing if not provided
      currency: data.currency ?? existingVoucher.currency, // Use existing if not provided
      amount_mxn: data.amount_mxn ?? existingVoucher.amount_mxn,
      date: data.date ? new Date(data.date) : existingVoucher.date, // Update only if new date is provided
      file_url_pdf: data.file_url_pdf ?? existingVoucher.file_url_pdf, // Use existing if not provided
      file_url_xml: data.file_url_xml ?? existingVoucher.file_url_xml, // Use existing if not provided
      is_foreign: data.is_foreign ?? existingVoucher.is_foreign,
      status: data.status ?? existingVoucher.status,
    };

    // Now update and return the updated entity
    await this.voucherRepo.update(id, updatedVoucherData);
    return this.findOne(id); // Return the updated entity
  }

  async findByUser(userId: string): Promise<Voucher[]> {
    return this.voucherRepo.find({
      where: {
        requests: {
          id_user: userId,
        },
      },
      relations: ['requests'],
    });
  }

  async remove(id: string): Promise<{ status: boolean; message: string }> {
    const voucher = await this.findOne(id);
    if (voucher.status === 'Voucher Approved' || voucher.status === 'Approved') {
      throw new ForbiddenException(
        'Vouchers that have already been approved cannot be deleted.',
      );
    }
    const result = await this.voucherRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }
    return { status: true, message: `Voucher with ID ${id} removed` };
  }

  async approve(id: string): Promise<{ status: boolean; message: string }> {
    // 1) run the update
    const result: UpdateResult = await this.voucherRepo.update(id, {
      status: 'Voucher Approved', // ← your “determined value” here
    });

    // 2) if nothing was affected, the id didn’t exist
    if (result.affected === 0) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    // 3) return a success payload
    return {
      status: true,
      message: `Voucher ${id} approved`,
    };
  }

  async deny(id: string): Promise<{ status: boolean; message: string }> {
    // 1) run the update
    const result: UpdateResult = await this.voucherRepo.update(id, {
      status: 'Voucher Denied', // ← your “determined value” here
    });

    // 2) if nothing was affected, the id didn’t exist
    if (result.affected === 0) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    // 3) return a success payload
    return {
      status: true,
      message: `Voucher ${id} denied`,
    };
  }

  async findByRequest(requestId: string): Promise<Voucher[]> {
    const vouchers = await this.voucherRepo.find({
      where: { id_request: requestId },
    });
    if (vouchers.length === 0) {
      throw new NotFoundException(
        `No vouchers found for Request ID ${requestId}`,
      );
    }
    return vouchers;
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history; removed unused privateDecrypt import; normalized ForbiddenException spacing.
 */
