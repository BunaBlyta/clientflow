import { NextResponse } from 'next/server';

export const packageSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  currency: true,
  estimatedDuration: true,
  sortOrder: true,
} as const;

export function invalidPackage(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function readPackagePrice(value: unknown): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;

  const raw = typeof value === 'string' ? value.trim() : String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;

  const price = Number(raw);
  if (!Number.isFinite(price) || price <= 0 || price > 9_999_999_999.99) return null;

  return price.toFixed(2);
}

export function readPackageSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value.trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
