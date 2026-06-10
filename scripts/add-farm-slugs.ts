import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
