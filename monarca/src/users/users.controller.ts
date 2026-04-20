/**
 * File: users.controller.ts
 * Description: Controller responsible for handling HTTP requests related to user management and Excel import.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dtos';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from 'src/guards/decorators/permission.decorator';
import { ExcelUploadInterceptor } from 'src/utils/excel-upload.interceptor';
import { ConfirmImportDto } from './dto/import-confirm.dto';

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

  // ---------------------------------------------------------------------------
  // Excel Import Endpoints (Admin only)
  // ---------------------------------------------------------------------------

  /**
   * Step 1: Upload an Excel file and receive a preview of parsed employee data
   * along with the list of available roles for assignment.
   */
  @Post('import/preview')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('import_employees')
  @UseInterceptors(ExcelUploadInterceptor())
  async previewImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.usersService.previewExcel(file.buffer);
  }

  /**
   * Step 2: Receive the confirmed employee list (with admin-assigned roles)
   * and persist them via batch upsert + manager hierarchy resolution.
   */
  @Post('import/confirm')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('import_employees')
  async confirmImport(@Body() data: ConfirmImportDto) {
    return this.usersService.confirmImport(data);
  }
}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
- 2026-04-15 | Excel Import | Added import/preview and import/confirm endpoints.
*/