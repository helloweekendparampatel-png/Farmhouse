import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/client';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../_lib/auth';
import { normalizeAmenitiesForStorage, type AmenityPayload } from '@/app/lib/amenities';
import { validateFarmCreatePayload } from '@/app/lib/farm-validation';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '15', 10);
  const skip = (page - 1) * limit;

  const search = searchParams.get('search') || '';

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
          { location: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [farms, total] = await Promise.all([
    prisma.farm.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ slug: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
      include: {
        images: {
          select: {
            id: true,
            imageUrl: true,
            farmId: true,
          },
        },
      },
    }),
    prisma.farm.count({ where }),
  ]);

  return NextResponse.json({
    data: farms,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  let payload;
  try {
    payload = requireRole(req, [Role.ADMIN]);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Unauthorized' },
      { status: err.message === 'Forbidden' ? 403 : 401 },
    );
  }

  const body = (await req.json()) as {
    farms?: {
      name?: string;
      location?: string | null;
      description?: string | null;
      price?: string | null;
      originalPrice?: string | null;
      rating?: number | null;
      reviews?: number | null;
      capacity?: string | null;
      features?: string[];
      amenities?: AmenityPayload[];
      facilities?: string[];
      pricing?: any;
      rules?: string[];
      contactPhone?: string | null;
      contactEmail?: string | null;
      isPopular?: boolean | null;
      discount?: string | null;
      weekdayPrice?: string | null;
      weekendPrice?: string | null;
      thumbnailImageUrl?: string | null;
      photoImageUrls?: string[];
    }[];
  };

  if (!body.farms || !Array.isArray(body.farms) || body.farms.length === 0) {
    return NextResponse.json({ message: 'farms array is required' }, { status: 400 });
  }

  const ownerId = payload.sub;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const allSlugs = await tx.farm.findMany({
        select: { slug: true },
        where: { slug: { startsWith: 'HW' } },
      });

      let currentMaxSlugNumber = 100;
      for (const item of allSlugs) {
        if (item.slug) {
          const numStr = item.slug.replace('HW', '');
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > currentMaxSlugNumber) {
            currentMaxSlugNumber = num;
          }
        }
      }

      const results = [];
      for (const f of body.farms!) {
        const name = (f.name ?? '').trim();
        const payloadErr = validateFarmCreatePayload(f);
        if (payloadErr) {
          throw new Error(payloadErr);
        }

        const photoUrls = (Array.isArray(f.photoImageUrls) ? f.photoImageUrls : [])
          .map((u) => (typeof u === 'string' ? u.trim() : ''))
          .filter(Boolean);

        const thumbnailUrl =
          typeof f.thumbnailImageUrl === 'string' ? f.thumbnailImageUrl.trim() : '';

        const nextSlug = `HW${++currentMaxSlugNumber}`;

        const farm = await tx.farm.create({
          data: {
            slug: nextSlug,
            name,
            thumbnailUrl,
            location: f.location ?? undefined,
            description: f.description ?? undefined,
            ownerId,
            images: {
              create: photoUrls.map((url) => ({ imageUrl: url })),
            },
            price: f.price ?? undefined,
            originalPrice: f.originalPrice ?? undefined,
            rating: f.rating ?? undefined,
            reviews: f.reviews ?? undefined,
            capacity: f.capacity ?? undefined,
            features: f.features ?? [],
            amenities: normalizeAmenitiesForStorage(f.amenities),
            facilities: f.facilities ?? [],
            pricing: f.pricing ?? undefined,
            rules: f.rules ?? [],
            contactPhone: f.contactPhone ?? undefined,
            contactEmail: f.contactEmail ?? undefined,
            isPopular: f.isPopular ?? false,
            discount: f.discount ?? undefined,
            weekdayPrice: f.weekdayPrice ?? undefined,
            weekendPrice: f.weekendPrice ?? undefined,
          },
        });
        results.push(farm);
      }
      return results;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message ?? 'Failed to create farm(s)' },
      { status: 400 },
    );
  }
}
