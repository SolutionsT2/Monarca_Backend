/**
 * File: destinations.controller.ts
 * Description: Controller exposing CRUD endpoints for destinations.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { CreateAirportDto } from './dto/create-airport.dto';
import { UpdateAirportDto } from './dto/update-airport.dto';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destService: DestinationsService) {}

  @Post()
  create(@Body() data: CreateDestinationDto) {
    return this.destService.create(data);
  }

  @Get()
  findAll() {
    return this.destService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.destService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateDestinationDto,
  ) {
    return this.destService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.destService.remove(id);
  }

  @Get(':id/airports')
  findAirports(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.destService.findAirports(id);
  }

  @Post(':id/airports')
  createAirport(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: CreateAirportDto,
  ) {
    return this.destService.createAirport(id, data);
  }

  @Patch(':id/airports/:airportId')
  updateAirport(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('airportId', new ParseUUIDPipe()) airportId: string,
    @Body() data: UpdateAirportDto,
  ) {
    return this.destService.updateAirport(id, airportId, data);
  }

  @Delete(':id/airports/:airportId')
  removeAirport(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('airportId', new ParseUUIDPipe()) airportId: string,
  ) {
    return this.destService.removeAirport(id, airportId);
  }
}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
