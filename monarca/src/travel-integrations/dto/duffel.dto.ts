import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

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
