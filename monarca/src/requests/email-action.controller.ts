/**
 * File: email-action.controller.ts
 * Description: Public endpoint that processes email action tokens.
 * Allows SOI to approve requests directly from an email link without logging in.
 */

import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EmailActionService } from './email-action.service';
import { RequestsStatusService } from './requests.status.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request as RequestEntity } from './entities/request.entity';

@Controller('requests')
export class EmailActionController {
  constructor(
    private readonly emailActionService: EmailActionService,
    private readonly requestsStatusService: RequestsStatusService,
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
  ) {}

  /**
   * GET /requests/email-action?token=xxx
   *
   * Verifies the token and executes the corresponding action.
   * No authentication guard — the token itself is the credential.
   */
  @Get('email-action')
  async handleEmailAction(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Missing token.');
    }

    const payload = this.emailActionService.verifyActionToken(token);
    if (!payload) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    const { requestId, action, userId } = payload;

    const request = await this.requestsRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada.');
    }

    if (action === 'soi-approve') {
      // Validate that the token belongs to the actual SOI of this request
      if (request.id_SOI !== userId) {
        throw new UnauthorizedException('No tienes permiso para aprobar esta solicitud.');
      }

      // Build a minimal RequestInterface for the status service
      const fakeReq: any = {
        sessionInfo: { id: userId },
        userInfo: {},
      };

      try {
        await this.requestsStatusService.SOIApproval(fakeReq, requestId);
        return {
          message: `Solicitud ${requestId} aprobada contablemente con éxito.`,
        };
      } catch (err) {
        throw new InternalServerErrorException(
          err?.message || 'Error al procesar la aprobación.',
        );
      }
    }

    throw new BadRequestException('Acción no reconocida.');
  }
}

