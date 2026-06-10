import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/prisma/client';
import { Role } from '@prisma/client';
import { requireAuth, signAccessToken } from '../../_lib/auth';

export async function PATCH(req: NextRequest) {
  let payload;
  try {
    payload = requireAuth(req);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Unauthorized' },
      { status: err.message === 'Forbidden' ? 403 : 401 },
    );
  }

  const body = (await req.json()) as {
    email?: string;
    password?: string;
  };

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const data: { email?: string; password?: string } = {};

  if (body.email !== undefined) {
    const nextEmail = body.email.trim().toLowerCase();
    if (!nextEmail) {
      return NextResponse.json({ message: 'Email cannot be empty' }, { status: 400 });
    }
    if (nextEmail !== user.email.toLowerCase()) {
      const taken = await prisma.user.findFirst({
        where: { email: nextEmail, NOT: { id: user.id } },
      });
      if (taken) {
        return NextResponse.json({ message: 'That email is already in use' }, { status: 409 });
      }
      data.email = nextEmail;
    }
  }

  if (body.password !== undefined && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }
    data.password = await bcrypt.hash(body.password, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: 'No changes to save' }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    const accessToken = signAccessToken({
      sub: updated.id,
      email: updated.email,
      role: updated.role as Role,
    });

    return NextResponse.json({
      accessToken,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? 'Failed to update profile' },
      { status: 400 },
    );
  }
}
