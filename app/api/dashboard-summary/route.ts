import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/client';
import { Role } from '@prisma/client';
import { requireRole } from '../_lib/auth';

/** Single round-trip counts for the admin dashboard (no row payload). */
export async function GET(req: NextRequest) {
  try {
    requireRole(req, [Role.ADMIN]);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Unauthorized' },
      { status: err.message === 'Forbidden' ? 403 : 401 },
    );
  }

  const [
    totalFarms,
    popularFarms,
    highRatedFarms,
    totalUsers,
    totalDecorations,
  ] = await Promise.all([
    prisma.farm.count(),
    prisma.farm.count({ where: { isPopular: true } }),
    prisma.farm.count({ where: { rating: { gte: 4.5 } } }),
    prisma.user.count(),
    prisma.decoration.count(),
  ]);

  return NextResponse.json({
    totalFarms,
    popularFarms,
    highRatedFarms,
    totalUsers,
    totalDecorations,
  });
}
