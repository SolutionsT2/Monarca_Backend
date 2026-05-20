import { ApiProperty } from '@nestjs/swagger';

export class ImportErrorDto {
  @ApiProperty({ example: 'row-2' })
  row: string;

  @ApiProperty({ example: 'Invalid data' })
  message: string;
}

export class ImportResultDto {
  @ApiProperty({ example: 8 })
  created: number;

  @ApiProperty({ example: 2 })
  updated: number;

  @ApiProperty({ type: [ImportErrorDto] })
  errors: ImportErrorDto[];
}
