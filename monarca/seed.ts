/**
 * File: seed.ts
 * Description: CLI entry point for seeding: runs SeedService with --seed, --truncate, or --drop.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SeedService } from './seed.service';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeedService);
  
  const action = process.argv[2];

  if (!action) {
    console.error('❌ No action provided. Use: seed | truncate | drop');
    process.exit(1);
  }

   switch (action.toLowerCase()) {
    case '--seed':
      await seeder.run();
      break;
    case '--truncate':
      await seeder.truncate();
      break;
    case '--drop':
      await seeder.dropAllTables();
      break;
    default:
      console.error('❌ Invalid action. Use: seed | truncate | drop');
      process.exit(1);
   }
    await app.close();
}

runSeed();

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */