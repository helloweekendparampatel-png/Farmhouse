import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate unique slug by appending a number if slug already exists
 */
async function generateUniqueSlug(
  baseName: string,
  excludeId?: string
): Promise<string> {
  let slug = generateSlug(baseName);
  let counter = 1;

  while (true) {
    const existing = await prisma.farm.findFirst({
      where: {
        slug: slug,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${generateSlug(baseName)}-${counter}`;
    counter++;
  }
}

/**
 * Populate slugs for all farms that don't have one
 */
export async function populateFarmSlugs(): Promise<void> {
  try {
    const farmsWithoutSlugs = await prisma.farm.findMany({
      where: {
        slug: null,
      },
    });

    if (farmsWithoutSlugs.length === 0) {
      console.log('✓ All farms already have slugs');
      return;
    }

    console.log(
      `🔄 Generating slugs for ${farmsWithoutSlugs.length} farms...`
    );

    for (const farm of farmsWithoutSlugs) {
      const uniqueSlug = await generateUniqueSlug(farm.name, farm.id);
      await prisma.farm.update({
        where: { id: farm.id },
        data: { slug: uniqueSlug },
      });
      console.log(`  ✓ ${farm.name} → ${uniqueSlug}`);
    }

    console.log('✓ Successfully populated all farm slugs');
  } catch (error) {
    console.error('Error populating farm slugs:', error);
    throw error;
  }
}
