import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/prisma/client';
import { Role } from '@prisma/client';
import { signAccessToken } from '../../_lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };

  const emailTrimmed = typeof email === 'string' ? email.trim() : '';
  if (!emailTrimmed || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  // Case-insensitive email so Admin@x and admin@x both match the stored account.
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: emailTrimmed, mode: 'insensitive' },
    },
  });
  if (!user) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role as Role,
  };

  const accessToken = signAccessToken(payload);

  return NextResponse.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
