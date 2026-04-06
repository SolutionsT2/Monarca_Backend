/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from 'src/reservations/entity/reservations.entity';

type DuffelWebhookObject = Record<string, unknown>;

interface DuffelWebhookPayload {
  id: string;
  api_version?: string;
  type: string;
  data?: {
    object?: DuffelWebhookObject | null;
  };
  live_mode?: boolean;
  idempotency_key?: string;
  created_at?: string;
  identity_organisation_id?: string;
}

@Injectable()
export class DuffelWebhookService {
  private readonly logger = new Logger(DuffelWebhookService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
  ) {}

  async handleWebhook(payload: DuffelWebhookPayload) {
    const eventObject = this.extractWebhookObject(payload.data?.object);
    const externalReference =
      this.getStringField(eventObject, 'id') ??
      payload.idempotency_key ??
      payload.id;

    if (!externalReference) {
      return {
        received: true,
        matched: false,
        reason: 'Missing Duffel reference',
      };
    }

    const reservation =
      await this.findDuffelReservationByReference(externalReference);

    if (!reservation) {
      this.logger.warn(
        `Duffel webhook received for unmatched reference ${externalReference} (${payload.type})`,
      );
      return {
        received: true,
        matched: false,
        reference: externalReference,
        eventType: payload.type,
      };
    }

    const bookingReference =
      this.getStringField(eventObject, 'id') ??
      reservation.booking_reference ??
      null;
    const holdExpiresAt =
      this.parseDate(this.getStringField(eventObject, 'hold_expires_at')) ??
      reservation.hold_expires_at ??
      null;
    const previousMeta: Record<string, unknown> =
      reservation.provider_meta && typeof reservation.provider_meta === 'object'
        ? reservation.provider_meta
        : {};
    const providerMeta = {
      ...previousMeta,
      duffel_last_webhook_event: {
        id: payload.id,
        type: payload.type,
        api_version: payload.api_version ?? null,
        live_mode: payload.live_mode ?? null,
        created_at: payload.created_at ?? null,
      },
      duffel_last_webhook_payload: payload,
      duffel_order_snapshot: eventObject,
    };

    const updatedReservation = await this.reservationsRepository.save(
      this.reservationsRepository.merge(reservation, {
        booking_reference: bookingReference,
        hold_expires_at: holdExpiresAt,
        provider_meta: providerMeta,
      }),
    );

    return {
      received: true,
      matched: true,
      reference: externalReference,
      eventType: payload.type,
      reservationId: updatedReservation.id,
    };
  }

  private async findDuffelReservationByReference(
    reference: string,
  ): Promise<Reservation | null> {
    return this.reservationsRepository.findOne({
      where: [
        { provider_name: 'duffel', booking_reference: reference },
        { provider_name: 'duffel', provider_offer_id: reference },
        { provider_name: 'duffel', id: reference },
      ],
    });
  }

  private extractWebhookObject(value: unknown): DuffelWebhookObject {
    return typeof value === 'object' && value !== null
      ? (value as DuffelWebhookObject)
      : {};
  }

  private getStringField(
    value: DuffelWebhookObject,
    key: string,
  ): string | undefined {
    const field = value[key];
    return typeof field === 'string' ? field : undefined;
  }

  private parseDate(value: unknown): Date | null {
    if (typeof value !== 'string') {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
