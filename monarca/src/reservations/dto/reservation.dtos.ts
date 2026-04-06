/**
 * File: reservation.dtos.ts
 * Description: DTOs for creating, updating and representing reservations (with Swagger/validation).
 */

import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsObject,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Reservation } from '../entity/reservations.entity';

export class CreateReservationDto {
  @ApiProperty({
    example: 'Taxi reservation',
    description: 'Title of the reservation that is being made',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example:
      'Taxi reservation made for the user John Doe, expected arrival at 10:00 AM',
    description: 'Comments or notes about the reservation',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  comments: string;

  @ApiProperty({
    example: '250.00',
    description: 'Price of the reservation',
    required: true,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({
    example: '/files/reservations/flight-confirmation.pdf',
    description: 'Public link or reference for the reservation artifact',
    required: false,
  })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({
    description: 'Name of the external provider used for this reservation',
    required: false,
    example: 'duffel',
  })
  @IsOptional()
  @IsString()
  provider_name?: string;

  @ApiProperty({
    description: 'Provider offer identifier when reservation comes from Duffel',
    required: false,
    example: 'off_00009htYpSCXrwaB9DnUm0',
  })
  @IsOptional()
  @IsString()
  provider_offer_id?: string;

  @ApiProperty({
    description: 'Provider booking confirmation or order reference',
    required: false,
    example: 'ord_00009hthhsUZ8W4LxQgkjo',
  })
  @IsOptional()
  @IsString()
  booking_reference?: string;

  @ApiProperty({
    description: 'Hold expiration date returned by provider',
    required: false,
    example: '2026-04-05T18:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  hold_expires_at?: string;

  @ApiProperty({
    description: 'Reduced provider snapshot for tracing and support',
    required: false,
    example: { provider: 'duffel', offer_id: 'off_123' },
  })
  @IsOptional()
  @IsObject()
  provider_meta?: Record<string, unknown>;

  @ApiProperty({
    description: 'pdf file of the reservation',
    example: 'file',
  })
  @IsOptional()
  file?: string;


  @ApiProperty({
    description: 'ID of the request destination',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  id_request_destination: string;
}

export class UpdateReservationDto extends PartialType(CreateReservationDto) {}

export class ReservationDto extends OmitType(Reservation, []) {}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
