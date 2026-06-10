import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/client';
import { farmhouses } from '@/app/constant';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
    });

    if (!admin) {
      return NextResponse.json(
        { message: 'No admin user found to associate with farms.' },
        { status: 400 },
      );
    }

    // const created = await prisma.$transaction(
    //   async (tx) => {
    //     const results = [];
    //     for (const f of farmhouses) {
    //       const name = (f.name ?? '').trim();
    //       if (!name) continue;

    //       const photoUrls = (Array.isArray(f.images) ? f.images : [])
    //         .map((u) => (typeof u === 'string' ? u.trim() : ''))
    //         .filter(Boolean);

    //       const farm = await tx.farm.create({
    //         data: {
    //           name,
    //           thumbnailUrl: photoUrls[0] ?? undefined,
    //           location: f.location ?? undefined,
    //           description: f.description ?? undefined,
    //           ownerId: admin.id,

    //           images: {
    //             create: photoUrls.map((url) => ({
    //               imageUrl: url,
    //             })),
    //           },
    //           price: f.price ?? undefined,
    //           originalPrice: f.originalPrice ?? undefined,
    //           rating: f.rating ?? undefined,
    //           reviews: f.reviews ?? undefined,
    //           capacity: f.capacity ?? undefined,
    //           features: f.features ?? [],
    //           amenities: f.amenities?.map((a: any) => a.name) ?? [],
    //           facilities: f.facilities ?? [],
    //           pricing: f.pricing ?? undefined,
    //           rules: f.rules ?? [],
    //           contactPhone: f.contact?.phone ?? undefined,
    //           contactEmail: f.contact?.email ?? undefined,
    //           isPopular: f.isPopular ?? false,
    //           discount: f.discount ?? undefined,
    //           weekdayPrice: f.weekdayPrice ?? undefined,
    //           weekendPrice: f.weekendPrice ?? undefined,
    //         },
    //       });
    //       results.push(farm);
    //     }
    //     return results;
    //   },
    //   {
    //     maxWait: 5000,
    //     timeout: 30000,
    //   },
    // );

    return NextResponse.json(
      // { message: `Successfully seeded ${created.length} farms.`, farms: created },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? 'Failed to seed farms' }, { status: 500 });
  }
}
