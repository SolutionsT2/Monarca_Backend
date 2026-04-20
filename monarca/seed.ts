/**
 * File: seed.ts
 * Description: CLI entry point for seeding: runs SeedService with --seed, --truncate, or --drop.
 */

import { NestFactory } from '@nestjs/core';
import { SeedService } from './seed.service';

async function runSeed() {
  const action = process.argv[2];

  if (!action) {
    console.error('❌ No action provided. Use: seed | truncate | drop');
    process.exit(1);
  }

  if (action === '--drop' || action === '--truncate') {
    // Prevent schema sync from running before destructive maintenance actions.
    process.env.TYPEORM_SYNCHRONIZE = 'false';
  }

  const { AppModule } = await import('./src/app.module');
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeedService);

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