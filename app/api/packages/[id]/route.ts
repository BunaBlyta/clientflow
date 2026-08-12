import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import {
  invalidPackage,
  isUniqueConstraintError,
  packageSelect,
  readPackagePrice,
  readPackageSlug,
} from '@/app/api/packages/_lib';
import { serializePackage } from '@/app/api/packages/serialize';

export const runtime = 'nodejs';

function readOptionalText(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length <= 2_000 ? text : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const values = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if ('name' in values) {
    if (typeof values.name !== 'string' || !values.name.trim() || values.name.trim().length > 2_000) {
      return invalidPackage('Name must be a non-empty string');
    }
    data.name = values.name.trim();
  }
  if ('slug' in values) {
    const slug = readPackageSlug(values.slug);
    if (!slug) return invalidPackage('Slug must contain lowercase letters, numbers, and hyphens only');
    data.slug = slug;
  }
  if ('description' in values) {
    const description = readOptionalText(values.description);
    if (description === null || !description) return invalidPackage('Description must be a non-empty string');
    data.description = description;
  }
  if ('estimatedDuration' in values) {
    const estimatedDuration = readOptionalText(values.estimatedDuration);
    if (estimatedDuration === null) return invalidPackage('Estimated duration is invalid');
    data.estimatedDuration = estimatedDuration || null;
  }
  if ('price' in values) {
    const price = readPackagePrice(values.price);
    if (!price) return invalidPackage('Price must be a positive value with at most two decimals');
    data.price = price;
  }
  if ('currency' in values) {
    if (typeof values.currency !== 'string' || !/^[a-zA-Z]{3}$/.test(values.currency.trim())) {
      return invalidPackage('Currency must be a three-letter code');
    }
    data.currency = values.currency.trim().toLowerCase();
  }
  if ('sortOrder' in values) {
    if (typeof values.sortOrder !== 'number' || !Number.isInteger(values.sortOrder) || values.sortOrder < 0) {
      return invalidPackage('Sort order must be a non-negative integer');
    }
    data.sortOrder = values.sortOrder;
  }
  if ('isActive' in values) {
    if (typeof values.isActive !== 'boolean') return invalidPackage('isActive must be a boolean');
    data.isActive = values.isActive;
  }

  if (Object.keys(data).length === 0) return invalidPackage('At least one package field is required');

  try {
    const updatedPackage = await prisma.package.update({
      where: { id },
      data,
      select: packageSelect,
    });

    return NextResponse.json(serializePackage(updatedPackage));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'A package with that slug already exists' }, { status: 409 });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    throw error;
  }
}
