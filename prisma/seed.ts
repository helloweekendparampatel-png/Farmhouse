import bcrypt from 'bcryptjs';
import { prisma } from './client';

async function main() {
  const email = 'admin@farmhouse.local';
  /** Plain password for the seeded admin (no @ in the string — use exactly this at sign-in). */
  const password = 'admin123';

  try {
    // Seed Admin user
    let admin = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (!admin) {
      const hashed = await bcrypt.hash(password, 10);
      admin = await prisma.user.create({
        data: {
          email,
          name: 'Default Admin',
          password: hashed,
          role: 'ADMIN',
        },
      });
      console.log('Seeded admin:', email, 'password:', password);
    } else {
      console.log('Admin already exists, skipping user seed');
    }

    // Populate slugs for all farms without slugs
  } catch (error: any) {
    // If database is not reachable (e.g., local development), skip seeding
    if (error?.code === 'P1001' || error?.code === 'ECONNREFUSED') {
      console.log('⚠️  Database not reachable. Skipping seed. This is normal during local development.');
      console.log('   Slugs will be populated when deployed with DATABASE_URL configured.');
      return;
    }
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
