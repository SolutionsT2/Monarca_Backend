/*
 * create-request.dto.ts
 *
 * Data Transfer Objects used for creating a new travel request.
 * Includes nested destination validation and Swagger metadata.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsInt,
  IsDate,
  ValidateNested,
  IsNumber,
} from 'class-validator';

/**
 * DTO representing a single destination within a request.
 * Defines validation rules and trip sequencing data.
 */
export class RequestDestinationtDto {
  @ApiProperty({
    description: 'Destination city identifier',
    example: 'destination-uuid-000',
  })
  // Marked optional at the DTO level so the service can return user-friendly
  // Spanish messages (with destino index and field path) for null/missing values.
  @IsOptional()
  @IsUUID()
  id_destination: string;

  @ApiProperty({
    description: 'Destination airport identifier when plane is required',
    example: '6a9d95f7-3376-40db-a6f6-3499d56f2203',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  id_airport?: string;

  @ApiProperty({
    description: 'Order of the destination in the trip sequence',
    example: 1,
  })
  @IsInt()
  destination_order: number;

  @ApiProperty({
    description: 'Number of days for the stay at the destination',
    example: 5,
  })
  @IsInt()
  stay_days: number;

  @ApiProperty({
    description: 'Arrival date at the destination',
    example: '2025-05-01T10:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  arrival_date: Date;

  @ApiProperty({
    description: 'Departure date from the destination',
    example: '2025-05-06T10:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  departure_date: Date;

  @ApiProperty({
    description: 'Whether a hotel is required at the destination',
    example: true,
  })
  @IsBoolean()
  is_hotel_required: boolean;

  @ApiProperty({
    description: 'Whether a plane is required for the trip to the destination',
    example: true,
  })
  @IsBoolean()
  is_plane_required: boolean;

  @ApiProperty({
    description: 'Whether this is the last destination in the trip',
    example: true,
  })
  @IsBoolean()
  is_last_destination: boolean;

  @ApiProperty({
    description: 'Additional details or requirements for this destination',
    example: 'Hotel near downtown',
  })
  @IsOptional()
  @IsString()
  details?: string;
}

/**
 * DTO for creating a new request.
 * Contains general request data and a list of destinations.
 */
export class CreateRequestDto {
  @ApiProperty({
    description: 'Origin city identifier',
    example: '2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f',
  })
  @IsUUID()
  id_origin_city: string;

  @ApiProperty({
    description: 'Origin airport identifier used for flight searches',
    example: '0bb26339-5ce7-4d2d-bf4c-4e81d8dc9d01',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  id_origin_airport?: string;

  @ApiProperty({
    description: 'Short title for the trip',
    example: 'On-Site Training Trip',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Detailed reason for the trip',
    example: 'I need to go on this trip because ...',
  })
  @IsString()
  motive: string;

  @ApiProperty({
    description: 'Money asked for in advance for the trip',
    example: 10000.98,
  })
  @IsNumber()
  advance_money: number;

  @ApiProperty({
    description: 'Additional requirements or notes',
    example: 'Need a wheelchair for an elderly person',
  })
  @IsString()
  requirements: string;

  @ApiProperty({
    description: 'Priority level of the request',
    example: 'high',
  })
  @IsString()
  priority: string;

  @ApiProperty({
    description: 'Whether the trip is a round trip',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_round_trip?: boolean;

  @ApiProperty({
    description: 'List of destinations for the trip request',
    type: [RequestDestinationtDto],
  })
  // Optional at DTO level so the service can return a Spanish toast-friendly
  // message ("La solicitud debe incluir al menos un destino.") instead of the
  // generic class-validator array.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // Validate each object in the array
  @Type(() => RequestDestinationtDto)
  requests_destinations: RequestDestinationtDto[];
}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Fixed DTO naming typo and added full documentation compliance.
- 2026-04-22 | Juan de Dios Gastélum Flores | Added is_round_trip optional field to CreateRequestDto.
- 2026-04-30 | Diego Vergara | Made requests_destinations and id_destination optional at DTO level so the service can return user-friendly Spanish messages with field paths.
*/
