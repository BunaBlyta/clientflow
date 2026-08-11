import { NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/prisma';
import { serializePackage } from './serialize';

export const runtime = 'nodejs';

export async function GET() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      currency: true,
      estimatedDuration: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(packages.map(serializePackage));
}
