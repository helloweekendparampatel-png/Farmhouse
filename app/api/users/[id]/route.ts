import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/prisma/client';
import { Role } from '@prisma/client';
import { requireRole } from '../../_lib/auth';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    requireRole(req, [Role.ADMIN]);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Unauthorized' },
      { status: err.message === 'Forbidden' ? 403 : 401 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    requireRole(req, [Role.ADMIN]);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Unauthorized' },
      { status: err.message === 'Forbidden' ? 403 : 401 },
    );
  }

  const body = (await req.json()) as {
    name?: string;
    password?: string;
    role?: string;
  };

  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.role !== undefined) {
    const roleUpper = body.role.toUpperCase();
    data.role = roleUpper === 'ADMIN' ? Role.ADMIN : Role.USER;
  }
  if (body.password !== undefined) {
    data.password = await bcrypt.hash(body.password, 10);
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    requireRole(req, [Role.ADMIN]);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Unauthorized' },
      { status: err.message === 'Forbidden' ? 403 : 401 },
    );
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json(null, { status: 204 });
}
