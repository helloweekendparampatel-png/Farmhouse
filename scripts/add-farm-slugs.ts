/*
Run this script to backfill farm slugs.

Options:
1) Using npx (recommended):
  npx ts-node --project tsconfig.scripts.json scripts/add-farm-slugs.ts

2) Add an npm script to `package.json`:
  "slug:backfill": "ts-node --project tsconfig.scripts.json scripts/add-farm-slugs.ts"
  then run: `npm run slug:backfill`

Ensure your environment (.env.local) is configured with DATABASE_URL and the database is reachable.
*/

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import pkg from '@prisma/client';
import { prisma } from '../prisma/client';

async function main() {
  console.log('Starting slug backfill...');

  const existingFarms = await prisma.farm.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${existingFarms.length} farms.`);

  let slugCounter = 101; // Starting number for HW101

  for (const farm of existingFarms) {
    if (farm.slug) {
      console.log(`Farm ${farm.id} already has slug: ${farm.slug}`);
      continue;
    }

    const nextSlug = `HW${slugCounter++}`;
    await prisma.farm.update({
      where: { id: farm.id },
      data: { slug: nextSlug },
    });
    console.log(`Assigned slug ${nextSlug} to farm ${farm.name}`);
  }

  console.log('Slug backfill completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
