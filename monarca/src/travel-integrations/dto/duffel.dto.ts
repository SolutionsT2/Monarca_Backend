import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDuffelOfferRequestDto {
  @ApiProperty({
    description: 'Monarca request destination id to associate this Duffel search with.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  requestDestinationId!: string;

  @ApiProperty({
    description:
      'Duffel offer request payload (data object) sent as-is to Duffel API.',
    example: {
      slices: [
        {
          origin: 'MEX',
          destination: 'JFK',
          departure_date: '2026-04-15',
        },
      ],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
    },
  })
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, unknown>;
}

export class ListDuffelOffersQueryDto {
  @ApiProperty({
    description: 'Duffel offer request id to list matching offers.',
    example: 'orq_00009hthhsUZ8W4LxQgkjo',
  })
  @IsString()
  @MinLength(3)
  offerRequestId!: string;

  @ApiProperty({
    description: 'Optional Duffel page token for pagination.',
    required: false,
    example: 'g2wAAAABaANkAAN0eXBlaAxvZmZlcl9yZXF1ZXN0',
  })
  @IsOptional()
  @IsString()
  after?: string;

  @ApiProperty({
    description: 'Optional Duffel page size for pagination.',
    required: false,
    example: '20',
  })
  @IsOptional()
  @IsString()
  limit?: string;
}

export class CreateDuffelOrderDto {
  @ApiProperty({
    description: 'Monarca request destination id that is being booked.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  requestDestinationId!: string;

  @ApiProperty({
    description: 'Duffel offer id selected for the booking.',
    example: 'off_00009htYpSCXrwaB9DnUm0',
  })
  @IsString()
  offerId!: string;

  @ApiProperty({
    description: 'Duffel order payload (data object) sent as-is to Duffel API.',
    example: {
      selected_offers: ['off_00009htYpSCXrwaB9DnUm0'],
      passengers: [
        {
          title: 'mr',
          given_name: 'Diego',
          family_name: 'Vergara',
          born_on: '1990-01-01',
          email: 'diego@example.com',
          phone_number: '+525512345678',
        },
      ],
      type: 'instant',
    },
  })
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, unknown>;

  @ApiProperty({
    description: 'Title to store in the internal reservation record.',
    example: 'Vuelo CDMX - Nueva York',
  })
  @IsString()
  reservationTitle!: string;

  @ApiProperty({
    description: 'Comments to store in the internal reservation record.',
    example: 'Reserva generada desde Duffel para la agencia.',
  })
  @IsString()
  reservationComments!: string;

  @ApiProperty({
    description: 'Price to persist in the internal reservation record.',
    example: 250.0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  reservationPrice!: number;
}

export class CreateDuffelPaymentDto {
  @ApiProperty({
    description: 'Monarca request destination id associated with the payment.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  requestDestinationId!: string;

  @ApiProperty({
    description: 'Duffel order id to settle with a payment.',
    example: 'ord_00009hthhsUZ8W4LxQgkjo',
  })
  @IsString()
  orderId!: string;

  @ApiProperty({
    description:
      'Duffel payment payload (data object) sent as-is to Duffel API.',
    example: {
      order_id: 'ord_00009hthhsUZ8W4LxQgkjo',
      currency: 'USD',
      amount: '100.00',
      payment_type: 'balance',
    },
  })
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, unknown>;
}
