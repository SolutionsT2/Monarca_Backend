/**
 * File: delegations.module.ts
 * Description: Nest module for managing delegations, including the TypeORM repository registration.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delegation } from './entities/delegation.entity';

/**
 * DelegationsModule integrates components for handling user replacements and substitute validity periods.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Delegation])],
  controllers: [],
  providers: [],
})
export class DelegationsModule {}

/*
Modification History:
- 2026-03-24:
    - Initial creation for managing delegation features.
*/
