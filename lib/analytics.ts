import type { Invoice, Project } from "@/lib/types";
import { packages } from "@/lib/mock-data";

const OUTSTANDING_STATUSES: Invoice["status"][] = ["SENT", "PAYMENT_PENDING", "FAILED"];

export function revenueOverTime(invoices: Invoice[], months = 6) {
  const now = new Date();
  const buckets: { key: string; label: string; revenueCents: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      revenueCents: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const invoice of invoices) {
    if (invoice.status !== "PAID" || !invoice.paidAt) continue;
    const d = new Date(invoice.paidAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.revenueCents += invoice.amountCents;
  }
  return buckets;
}

export function revenueByPackage(invoices: Invoice[], projects: Project[]) {
  const projectPackage = new Map(projects.map((p) => [p.id, p.packageId]));
  return packages.map((pkg) => {
    const revenueCents = invoices
      .filter((i) => i.status === "PAID" && projectPackage.get(i.projectId) === pkg.id)
      .reduce((sum, i) => sum + i.amountCents, 0);
    return { packageId: pkg.id, name: pkg.name, revenueCents };
  });
}

export function outstandingInvoicesTotal(invoices: Invoice[]) {
  return invoices
    .filter((i) => OUTSTANDING_STATUSES.includes(i.status))
    .reduce((sum, i) => sum + i.amountCents, 0);
}

export function overdueInvoicesTotal(invoices: Invoice[]) {
  const now = Date.now();
  return invoices
    .filter(
      (i) =>
        OUTSTANDING_STATUSES.includes(i.status) &&
        i.dueDate &&
        new Date(i.dueDate).getTime() < now
    )
    .reduce((sum, i) => sum + i.amountCents, 0);
}

export function averageTurnaroundByPackage(projects: Project[]) {
  return packages
    .filter((pkg) => !pkg.isCustom || projects.some((p) => p.packageId === pkg.id && p.status === "LAUNCHED"))
    .map((pkg) => {
      const launched = projects.filter((p) => p.packageId === pkg.id && p.status === "LAUNCHED");
      const avgDays =
        launched.length === 0
          ? null
          : Math.round(
              launched.reduce(
                (sum, p) =>
                  sum + (new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime()) / 86_400_000,
                0
              ) / launched.length
            );
      return { packageId: pkg.id, name: pkg.name, avgDays, count: launched.length };
    });
}

export function totalPaidRevenue(invoices: Invoice[]) {
  return invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.amountCents, 0);
}

export function activeProjectCount(projects: Project[]) {
  return projects.filter((p) => !["LAUNCHED", "CANCELLED"].includes(p.status)).length;
}
