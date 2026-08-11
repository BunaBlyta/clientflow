type PackagePrice = number | string | { toString(): string };

export type PackageSummary = {
  id: string;
  name: string;
  price: PackagePrice;
  currency: string;
};

export type PackageRecord = PackageSummary & {
  slug: string;
  description: string;
  estimatedDuration: string | null;
  sortOrder: number;
};

export function serializePackageSummary(pkg: PackageSummary) {
  return {
    id: pkg.id,
    name: pkg.name,
    price: Number(pkg.price),
    currency: pkg.currency,
  };
}

export function serializePackage(pkg: PackageRecord) {
  return {
    ...serializePackageSummary(pkg),
    slug: pkg.slug,
    description: pkg.description,
    estimatedDuration: pkg.estimatedDuration,
    sortOrder: pkg.sortOrder,
  };
}
