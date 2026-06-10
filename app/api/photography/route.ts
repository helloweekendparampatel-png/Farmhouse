import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/client';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../_lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Unauthorized' }, { status: 401 });
  }

  const photos = await prisma.photography.findMany({
    include: { images: true },
  });
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  try {
    requireRole(req, [Role.ADMIN]);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Unauthorized' },
      { status: err.message === 'Forbidden' ? 403 : 401 },
    );
  }

  const body = (await req.json()) as {
    title?: string;
    thumbnailUrl?: string | null;
    images?: string[];
  };

  if (!body.title) {
    return NextResponse.json({ message: 'title is required' }, { status: 400 });
  }

  const imageUrls = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
  if (imageUrls.length > 0 && imageUrls.length < 10) {
    return NextResponse.json({ message: 'At least 10 images are required' }, { status: 400 });
  }

  const photo = await prisma.photography.create({
    data: {
      title: body.title,
      thumbnailUrl: body.thumbnailUrl ?? undefined,
      images: {
        create: imageUrls.map((url) => ({ imageUrl: url })),
      },
    },
    include: { images: true },
  });

  return NextResponse.json(photo, { status: 201 });
}
