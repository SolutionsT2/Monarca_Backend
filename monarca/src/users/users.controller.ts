/**
 * File: users.controller.ts
 * Description: Controller for user management, Excel employee import,
 * and organizational hierarchy queries.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { HierarchyResolverService } from './hierarchy-resolver.service';
import { UpdateUserDto } from './dto/user.dtos';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from 'src/guards/decorators/permission.decorator';
import { ExcelUploadInterceptor } from 'src/utils/excel-upload.interceptor';
import { ConfirmImportDto } from './dto/import-confirm.dto';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly hierarchyResolver: HierarchyResolverService,
  ) {}

  /**
   * Retrieves all users from the database.
   */
  @Get()
  get(@Query('roleName') roleName?: string) {
    return this.usersService.findAll(roleName);
  }

  /**
   * Traverses the manager chain of a user upward up to `levels` deep.
   * Returns the list of resolved managers with their name and email.
   * Stops early if the chain is shorter than requested or a cycle is detected.
   * @param id UUID of the starting user (requester).
   * @param levels Number of hierarchy levels to climb (default: 1, max: 10).
   */
  @Get(':id/manager-chain')
  @UseGuards(AuthGuard)
  getManagerChain(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('levels', new ParseIntPipe({ optional: true })) levels: number = 1,
  ) {
    return this.hierarchyResolver.resolveManagerChain(id, levels);
  }

  /**
   * Retrieves a single user by their unique identifier.
   * @param id The UUID of the user.
   */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Updates an existing user's information.
   * @param id The UUID of the user to update.
   * @param updateUserDto Fields to update.
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
  async previewImport(
    @Request() req: RequestInterface,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    await this.usersService.assertCompanyAdmin(req.sessionInfo.id);
    return this.usersService.previewExcel(file.buffer);
  }

  /**
   * Step 2: Receive the confirmed employee list and persist via batch upsert
   * with manager hierarchy resolution.
   */
  @Post('import/confirm')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('import_employees')
  async confirmImport(
    @Request() req: RequestInterface,
    @Body() data: ConfirmImportDto,
  ) {
    await this.usersService.assertCompanyAdmin(req.sessionInfo.id);
    return this.usersService.confirmImport(data);
  }
}

/*
 * Modification History:
 * - 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
 * - 2026-04-15 | Excel Import | Added import/preview and import/confirm endpoints.
 * - 2026-05-12 | Juan de Dios Gastélum | Injected HierarchyResolverService;
 *   added GET :id/manager-chain endpoint.
 */
