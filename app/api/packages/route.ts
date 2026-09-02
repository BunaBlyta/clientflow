import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializePackage } from './serialize';
import { readPackageTranslations } from '@/lib/package-translations';
import {
  invalidPackage,
  isUniqueConstraintError,
  packageSelect,
  readPackagePrice,
  readPackageSlug,
} from './_lib';

export const runtime = 'nodejs';

function readPackageText(value: unknown, label: string, required: boolean) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if ((required && !text) || text.length > 2_000) return null;
  return text;
}

export async function GET() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    select: packageSelect,
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(packages.map(serializePackage));
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (user.role !== 'STAFF') return NextResponse.json({ error: 'Staff access required' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidPackage('Request body must be valid JSON');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return invalidPackage('Request body must be an object');
  }

  const values = body as Record<string, unknown>;
  const name = readPackageText(values.name, 'Name', true);
  const slug = readPackageSlug(values.slug);
  const description = readPackageText(values.description, 'Description', true);
  const estimatedDuration = readPackageText(values.estimatedDuration, 'Estimated duration', false);
  const price = readPackagePrice(values.price);
  const currency = typeof values.currency === 'string' ? values.currency.trim().toLowerCase() : '';
  const sortOrder = values.sortOrder === undefined ? 0 : values.sortOrder;
  const translations = 'translations' in values ? readPackageTranslations(values.translations) : null;
  const isActive = values.isActive === undefined ? true : values.isActive;

  if (!name) return invalidPackage('Name is required');
  if (!slug) return invalidPackage('Slug must contain lowercase letters, numbers, and hyphens only');
  if (!description) return invalidPackage('Description is required');
  if (estimatedDuration === null) return invalidPackage('Estimated duration is invalid');
  if (!price) return invalidPackage('Price must be a positive value with at most two decimals');
  if (!/^[a-z]{3}$/.test(currency)) return invalidPackage('Currency must be a three-letter code');
  if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0) {
    return invalidPackage('Sort order must be a non-negative integer');
  }
  if (typeof isActive !== 'boolean') return invalidPackage('isActive must be a boolean');
  if (translations === undefined) {
    return invalidPackage('Translations must map a supported locale to a name and description');
  }

  try {
    const createdPackage = await prisma.package.create({
      data: {
        name,
        slug,
        description,
        price,
        currency,
        ...(estimatedDuration ? { estimatedDuration } : {}),
        sortOrder,
        isActive,
        ...(translations ? { translations } : {}),
      },
      select: packageSelect,
    });

    return NextResponse.json(serializePackage(createdPackage), { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'A package with that slug already exists' }, { status: 409 });
    }
    throw error;
  }
}
