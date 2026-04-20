/**
 * File: reservations.service.ts
 * Description: Service for reservation CRUD; validates travel agency and request status on create.
 */

import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entity/reservations.entity';
import {
  CreateReservationDto,
  UpdateReservationDto,
} from './dto/reservation.dtos';
import { RequestsChecks } from 'src/requests/requests.checks';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
    private readonly requestChecks: RequestsChecks,
  ) {}

  async createReservation(
    req: RequestInterface,
    reservation: CreateReservationDto,
  ) {
    // //VALIDAR USER Y id_request_destination
    const id_travel_agency = req.userInfo.id_travel_agency;
    if (
      !(
        id_travel_agency &&
        (await this.requestChecks.isRequestDestinationTravelAgencyId(
          reservation.id_request_destination,
          id_travel_agency,
        ))
      )
    ) {
      throw new UnauthorizedException(
        'Unable to add reservation to that request.',
      );
    }

    //VALIDAR ESTADO DE REQUEST
    const requestStatus =
      await this.requestChecks.getRequestStatusFromRequestDestination(
        reservation.id_request_destination,
      );
    if (requestStatus !== 'Pending Reservations') {
      throw new UnauthorizedException(
        'Unable to create reservation because of the requests status.',
      );
    }

    if (reservation.provider_name === 'duffel' && !reservation.provider_offer_id) {
      throw new BadRequestException('Duffel reservations require provider_offer_id.');
    }

    const payload: Partial<Reservation> = {
      ...reservation,
      link: reservation.link ?? null,
      provider_name: reservation.provider_name ?? null,
      provider_offer_id: reservation.provider_offer_id ?? null,
      booking_reference: reservation.booking_reference ?? null,
      hold_expires_at: reservation.hold_expires_at
        ? new Date(reservation.hold_expires_at)
        : null,
      provider_meta: reservation.provider_meta ?? null,
    };

    const newReservation = this.reservationsRepository.create(payload);
    return this.reservationsRepository.save(newReservation);
  }

  async findAll(): Promise<Reservation[]> {
    return this.reservationsRepository.find();
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOneBy({ id });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found`);
    }
    return reservation;
  }

  async update(id: string, body: UpdateReservationDto) {
    const reservation = await this.findOne(id);

    const {
      title,
      comments,
      price,
      id_request_destination,
      file,
      link,
      provider_name,
      provider_offer_id,
      booking_reference,
      provider_meta,
      hold_expires_at,
    } = body;

    const payload: Partial<Reservation> = {
      ...(title !== undefined ? { title } : {}),
      ...(comments !== undefined ? { comments } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(id_request_destination !== undefined
        ? { id_request_destination }
        : {}),
      ...(file !== undefined ? { file } : {}),
      ...(link !== undefined ? { link: link ?? null } : {}),
      ...(provider_name !== undefined
        ? { provider_name: provider_name ?? null }
        : {}),
      ...(provider_offer_id !== undefined
        ? { provider_offer_id: provider_offer_id ?? null }
        : {}),
      ...(booking_reference !== undefined
        ? { booking_reference: booking_reference ?? null }
        : {}),
      ...(provider_meta !== undefined
        ? { provider_meta: provider_meta ?? null }
        : {}),
      ...(hold_expires_at !== undefined
        ? {
            hold_expires_at: hold_expires_at ? new Date(hold_expires_at) : null,
          }
        : {}),
    };

    const mergedReservation = this.reservationsRepository.merge(
      reservation,
      payload,
    );

    return this.reservationsRepository.save(mergedReservation);
  }

  async findDuffelReservationByReference(
    reference: string,
  ): Promise<Reservation | null> {
    const reservation = await this.reservationsRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.requestDestination', 'requestDestination')
      .leftJoinAndSelect('requestDestination.request', 'request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.travel_agency', 'travelAgency')
      .leftJoinAndSelect('travelAgency.users', 'travelAgencyUsers')
      .where('reservation.provider_name = :providerName', {
        providerName: 'duffel',
      })
      .andWhere(
        '(reservation.booking_reference = :reference OR reservation.provider_offer_id = :reference OR reservation.id = :reference)',
        { reference },
      )
      .getOne();

    return reservation as Reservation | null;
  }

  async updateDuffelReservationByReference(
    reference: string,
    patch: Partial<Reservation>,
  ): Promise<Reservation | null> {
    const reservation = await this.findDuffelReservationByReference(reference);

    if (!reservation) {
      return null;
    }

    const mergedReservation = this.reservationsRepository.merge(
      reservation,
      patch,
    );

    return (await this.reservationsRepository.save(
      mergedReservation,
    )) as Reservation;
  }

  async remove(id: string): Promise<{ message: string; status: boolean }> {
    const reservation = await this.reservationsRepository.findOneBy({ id });
    await this.reservationsRepository.delete(id);
    return {
      message: `Reservation ${reservation?.id} deleted,`,
      status: true,
    };
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history; removed unused UseGuards import.
 */
