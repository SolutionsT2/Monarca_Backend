/**
 * File: users.controller.ts
 * Description: Controller responsible for handling HTTP requests related to user management.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dtos';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Retrieves all users from the database.
   * @returns An array of user objects.
   */
  @Get()
  get() {
    return this.usersService.findAll();
  }

  /**
   * Retrieves a single user by their unique identifier.
   * @param id The UUID of the user.
   * @returns The requested user object.
   */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Updates an existing user's information.
   * @param id The UUID of the user to update.
   * @param updateUserDto Data transfer object containing the fields to update.
   * @returns The updated user object.
   */
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Deletes a user from the system.
   * @param id The UUID of the user to delete.
   * @returns A status object confirming deletion.
   */
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.delete(id);
  }
}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
*/
