import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { parseMoneyAmount } from '@/app/lib/farm-validation';

/** Default ceiling (display price) when `maxPrice` is omitted — tune for your catalog. */
const DEFAULT_MAX_PRICE = 10_000;

const farmListInclude = {
  images: {
    select: {
      id: true,
      imageUrl: true,
      farmId: true,
    },
  },
} as const;

function buildSearchWhere(search: string): Prisma.FarmWhereInput {
  if (!search.trim()) return {};
  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ],
  };
}

/**
 * GET /api/affordable-farmhouses
 *
 * Lists farms whose parsed display `price` is at most `maxPrice` (cheapest first).
 * Query: `maxPrice` (optional, default 10000), `page`, `limit`, `search` (same semantics as GET /api/farms).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));
  const search = searchParams.get('search') || '';

  const maxPriceParam = searchParams.get('maxPrice');
  let maxPrice: number;
  if (maxPriceParam === null || maxPriceParam.trim() === '') {
    maxPrice = DEFAULT_MAX_PRICE;
  } else {
    const n = Number(maxPriceParam);
    if (Number.isNaN(n) || n <= 0) {
      return NextResponse.json(
        { message: 'maxPrice must be a positive number' },
        { status: 400 },
      );
    }
    maxPrice = n;
  }

  const searchWhere = buildSearchWhere(search);

  const where: Prisma.FarmWhereInput = {
    AND: [
      { price: { not: null } },
      { NOT: { price: '' } },
      ...(Object.keys(searchWhere).length ? [searchWhere] : []),
    ],
  };

  const rows = await prisma.farm.findMany({
    where,
    include: farmListInclude,
  });

  const withAmount = rows
    .map((farm) => {
      const amount = farm.price ? parseMoneyAmount(farm.price) : null;
      return amount !== null ? { farm, amount } : null;
    })
    .filter((x): x is { farm: (typeof rows)[0]; amount: number } => x !== null)
    .filter(({ amount }) => amount > 0 && amount <= maxPrice)
    .sort((a, b) => a.amount - b.amount);

  const total = withAmount.length;
  const skip = (page - 1) * limit;
  const pageRows = withAmount.slice(skip, skip + limit).map(({ farm }) => farm);

  return NextResponse.json({
    data: pageRows,
    meta: {
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      maxPrice,
    },
  });
}
