import type { Note } from "@/lib/types";

export const notes: Note[] = [
  {
    id: "note_1",
    projectId: "proj_3",
    authorRole: "system",
    authorName: "Clientflow",
    body: "Project status changed from Discovery to Design.",
    createdAt: "2026-07-12T09:00:00.000Z",
  },
  {
    id: "note_2",
    projectId: "proj_3",
    authorRole: "system",
    authorName: "Clientflow",
    body: "Project status changed from Design to Development.",
    createdAt: "2026-07-24T09:00:00.000Z",
  },
  {
    id: "note_3",
    projectId: "proj_3",
    authorRole: "client",
    authorName: "Marco Bellini",
    body: "Could we add a page with more product photography? We have new shots from the shoot last week.",
    createdAt: "2026-07-22T08:40:00.000Z",
  },
  {
    id: "note_4",
    projectId: "proj_3",
    authorRole: "staff",
    authorName: "Elira Krasniqi",
    body: "Yep, added as an extra — invoice sent, should be a quick add once development wraps.",
    createdAt: "2026-07-22T08:58:00.000Z",
  },
  {
    id: "note_5",
    projectId: "proj_3",
    authorRole: "staff",
    authorName: "Elira Krasniqi",
    body: "First development pass is live on staging, sending the link separately — take a look when you get a chance.",
    createdAt: "2026-08-07T14:10:00.000Z",
  },
];
