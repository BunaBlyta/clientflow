import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { createNotification, scheduleEntityChanged, scheduleNotificationEffects } from '@/app/api/_lib/notifications';
import { MAX_NOTE_BODY_LENGTH } from '@/app/api/_lib/text-limits';

export const runtime = 'nodejs';

function invalidRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

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

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidRequest('Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return invalidRequest('Request body must be an object');
  }

  const values = body as Record<string, unknown>;
  const projectId = typeof values.projectId === 'string' ? values.projectId.trim() : '';
  const noteBody = typeof values.body === 'string' ? values.body.trim() : '';

  if (!projectId) return invalidRequest('Project is required');
  if (!noteBody || noteBody.length > MAX_NOTE_BODY_LENGTH) {
    return invalidRequest(`Note body is required and must be ${MAX_NOTE_BODY_LENGTH.toLocaleString()} characters or fewer`);
  }

  const createdNote = await prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        clientId: true,
        client: { select: { userId: true } },
      },
    });

    if (!project || (user.role === 'CLIENT' && project.client?.userId !== user.id)) {
      return null;
    }

    const note = await transaction.note.create({
      data: {
        projectId: project.id,
        authorId: user.id,
        content: noteBody,
        isSystem: false,
      },
      select: {
        id: true,
        projectId: true,
        authorId: true,
        content: true,
        createdAt: true,
        author: { select: { name: true, role: true } },
      },
    });

    const notificationIds: string[] = [];
    if (user.role === 'CLIENT') {
      const staffUsers = await transaction.user.findMany({
        where: { role: 'STAFF', isActive: true },
        select: { id: true },
      });

      for (const staffUser of staffUsers) {
        const id = await createNotification(transaction, {
          userId: staffUser.id,
          type: 'NEW_NOTE',
          projectId: project.id,
          title: 'New note from a client',
          message: noteBody,
        });
        if (id) notificationIds.push(id);
      }
    } else if (project.client) {
      const id = await createNotification(transaction, {
        userId: project.client.userId,
        type: 'NEW_NOTE',
        projectId: project.id,
        title: 'New note from the studio',
        message: noteBody,
      });
      if (id) notificationIds.push(id);
    }

    return { note, notificationIds };
  });

  if (!createdNote) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  scheduleNotificationEffects(createdNote.notificationIds);
  scheduleEntityChanged({ entity: 'note', id: createdNote.note.id, projectId: createdNote.note.projectId });

  return NextResponse.json({
    id: createdNote.note.id,
    projectId: createdNote.note.projectId,
    authorId: createdNote.note.authorId,
    authorName: createdNote.note.author?.name ?? 'System',
    authorRole: createdNote.note.author?.role ?? 'SYSTEM',
    body: createdNote.note.content,
    createdAt: createdNote.note.createdAt.toISOString(),
  }, { status: 201 });
}
