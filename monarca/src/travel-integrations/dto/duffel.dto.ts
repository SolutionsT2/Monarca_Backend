import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
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
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiProperty({
    description:
      'Optional sorting. Prefix with - for descending (e.g. -total_amount).',
    required: false,
    example: 'total_amount',
  })
  @IsOptional()
  @IsIn(['total_amount', '-total_amount', 'total_duration', '-total_duration'])
  sort?: 'total_amount' | '-total_amount' | 'total_duration' | '-total_duration';

  @ApiProperty({
    description: 'Optional maximum number of connections per offer.',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxConnections?: number;
}

export class GetDuffelOfferByIdQueryDto {
  @ApiProperty({
    description:
      'When true, includes available_services in offer detail if provided by airline.',
    required: false,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  returnAvailableServices?: boolean;
}
