/**
<<<<<<< Updated upstream
 * File: departments.module.ts
 * Description: NestJS module exposing TypeORM repository for departments.
 */

=======
 * Departments Module
 * 
 * Module for managing organizational departments.
 * Exports: DepartmentsService, DepartmentsController
 */
>>>>>>> Stashed changes
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entity/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Department])],
  exports: [TypeOrmModule],
})
export class DepartmentsModule {}

/**
 * Modification History:
 * - 2026-02-26: Added description header and modification history footer.
 */
