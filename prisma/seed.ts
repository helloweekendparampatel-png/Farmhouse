import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@farmhouse.local';
  /** Plain password for the seeded admin (no @ in the string — use exactly this at sign-in). */
  const password = 'admin123';

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
        role: Role.ADMIN,
      },
    });
    console.log('Seeded admin:', email, 'password:', password);
  } else {
    console.log('Admin already exists, skipping user seed');
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
