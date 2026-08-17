import { NextRequest, NextResponse } from 'next/server';
import {
  averageTurnaroundByPackage,
  outstandingInvoicesTotal,
  projectsByStage,
  revenueByPackage,
  revenueOverTime,
} from '@/lib/analytics';
import type { Invoice, ManagedPackage, Project } from '@/lib/types';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { packageSelect } from '@/app/api/packages/_lib';
import { serializePackage } from '@/app/api/packages/serialize';
import { serializeInvoice } from '@/app/api/invoices/serialize';

export const runtime = 'nodejs';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-120b';

function serializeProject(project: {
  id: string;
  clientId: string;
  packageId: string | null;
  name: string;
  status: Project['status'];
  createdAt: Date;
  updatedAt: Date;
  targetLaunchDate: Date | null;
}): Project {
  return {
    id: project.id,
    clientId: project.clientId,
    packageId: project.packageId,
    name: project.name,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    ...(project.targetLaunchDate
      ? { targetLaunchDate: project.targetLaunchDate.toISOString() }
      : {}),
  };
}

function insightError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return insightError('Authentication required', 401);
  if (user.role !== 'STAFF') return insightError('Staff access required', 403);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return insightError('Analytics insights are not configured yet.', 503);

  try {
    const [packageRecords, projectRecords, invoiceRecords] = await Promise.all([
      prisma.package.findMany({
        where: { isActive: true },
        select: packageSelect,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.project.findMany({
        select: {
          id: true,
          clientId: true,
          packageId: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          targetLaunchDate: true,
        },
      }),
      prisma.invoice.findMany({
        select: {
          id: true,
          projectId: true,
          clientId: true,
          type: true,
          description: true,
          amount: true,
          status: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
        },
      }),
    ]);

    const packages: ManagedPackage[] = packageRecords.map(serializePackage);
    const projects = projectRecords.map(serializeProject);
    const invoices: Invoice[] = invoiceRecords.map(serializeInvoice);
    const revenueTrend = revenueOverTime(invoices, 12);
    const revenueByPkg = revenueByPackage(invoices, projects, packages);
    const turnaroundByPkg = averageTurnaroundByPackage(projects, packages);
    const numbers = {
      revenueOverTime: revenueTrend.map(({ label, revenueCents }) => ({ label, revenueCents })),
      revenueByPackage: revenueByPkg.map(({ name, revenueCents }) => ({ name, revenueCents })),
      turnaroundByPackage: turnaroundByPkg.map(({ name, avgDays, count }) => ({ name, avgDays, count })),
      projectsByStage: projectsByStage(projects),
      outstandingInvoicesCents: outstandingInvoicesTotal(invoices),
    };

    const prompt = [
      'You are summarizing analytics for a small web design studio.',
      'Using only the computed dashboard numbers below, write a concise 2-3 sentence plain-English insight.',
      'Mention the most meaningful revenue or pipeline pattern and any useful outstanding-payment or turnaround signal.',
      'Do not invent causes, recommendations, or numbers, and do not use markdown, headings, or bullet points.',
      `Computed numbers (money is in cents): ${JSON.stringify(numbers)}`,
    ].join('\n');

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return insightError('We couldn’t generate an insight right now.', 502);

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const insight = payload.choices?.[0]?.message?.content;
    if (typeof insight !== 'string' || !insight.trim()) {
      return insightError('We couldn’t generate an insight right now.', 502);
    }

    return NextResponse.json({ insight: insight.trim() });
  } catch {
    return insightError('We couldn’t generate an insight right now.', 502);
  }
}
