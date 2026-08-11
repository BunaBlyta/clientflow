import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get('projectId');
  const projectWhere = user.role === 'CLIENT' ? { client: { userId: user.id } } : {};
  const notes = await prisma.note.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      project: projectWhere,
    },
    select: {
      id: true,
      projectId: true,
      authorId: true,
      content: true,
      isSystem: true,
      createdAt: true,
      author: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    notes.map((note) => ({
      id: note.id,
      projectId: note.projectId,
      authorId: note.authorId,
      authorName: note.author?.name ?? 'System',
      authorRole: note.author?.role ?? 'SYSTEM',
      body: note.content,
      createdAt: note.createdAt.toISOString(),
    })),
  );
}

