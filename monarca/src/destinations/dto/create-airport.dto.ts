import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateAirportDto {
  @ApiProperty({
    description: 'Airport IATA code',
    example: 'MEX',
  })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  iata_code: string;

  @ApiProperty({
    description: 'Airport full name',
    example: 'Aeropuerto Internacional de la Ciudad de Mexico',
  })
  @IsString()
  @Length(2, 150)
  name: string;

  @ApiProperty({
    description: 'Marks this airport as default for the destination',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiProperty({
    description: 'Whether this airport is enabled for searches',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
