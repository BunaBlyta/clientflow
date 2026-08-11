import type {
  Client,
  Invoice,
  Note,
  Notification,
  Package,
  Project,
  ProjectRequest,
} from './types';

// Fixture data standing in for the real API (owned by a separate backend
// agent, not yet built). Shapes match lib/types.ts, which mirrors the data
// model in AGENTS.md section 4. See STATUS.md for how this reconciles with
// the eventual live API.

export const MOCK_PACKAGES: Package[] = [
  {
    id: 'pkg-landing-page',
    name: 'Landing Page',
    priceCents: 250000,
    description: 'A single high-converting page for a launch or campaign.',
  },
  {
    id: 'pkg-full-website',
    name: 'Full Website',
    priceCents: 650000,
    description: 'A complete multi-page marketing site.',
  },
  {
    id: 'pkg-web-app',
    name: 'Web App Build',
    priceCents: 1800000,
    description: 'A custom web application, scoped individually.',
  },
];

export const MOCK_CLIENT: Client = {
  id: 'client-1',
  name: 'Jordan Ellis',
  companyName: 'Riverside Coffee Co.',
  email: 'jordan@riversidecoffee.com',
};

// Demo auth credentials — this whole flow is mocked, no real backend yet.
export const DEMO_PASSWORD = 'riverside123';
export const DEMO_VALID_CODE = '123456';
export const DEMO_EXPIRED_CODE = '000000';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    clientId: 'client-1',
    packageId: 'pkg-full-website',
    name: 'Riverside Cafe — Full Website',
    status: 'DEVELOPMENT',
    createdAt: '2026-06-02T14:00:00.000Z',
    updatedAt: '2026-08-05T09:30:00.000Z',
    targetLaunchDate: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'proj-2',
    clientId: 'client-1',
    packageId: 'pkg-landing-page',
    name: 'Riverside Cafe — Landing Page Refresh',
    status: 'REVIEW',
    createdAt: '2026-05-10T14:00:00.000Z',
    updatedAt: '2026-08-08T16:00:00.000Z',
    targetLaunchDate: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'proj-3',
    clientId: 'client-1',
    packageId: 'pkg-landing-page',
    name: 'Riverside Cafe — Brand Site Relaunch',
    status: 'LAUNCHED',
    createdAt: '2026-01-15T14:00:00.000Z',
    updatedAt: '2026-03-20T11:00:00.000Z',
    targetLaunchDate: '2026-03-20T00:00:00.000Z',
  },
  {
    id: 'proj-4',
    clientId: 'client-1',
    packageId: 'pkg-web-app',
    name: 'Riverside Cafe — Seasonal Menu Microsite',
    status: 'ON_HOLD',
    createdAt: '2026-07-01T14:00:00.000Z',
    updatedAt: '2026-07-28T10:00:00.000Z',
  },
];

export const MOCK_INVOICES: Invoice[] = [
  // proj-1 — Development, in progress
  {
    id: 'inv-1',
    projectId: 'proj-1',
    kind: 'DEPOSIT',
    label: 'Deposit — Full Website',
    amountCents: 325000,
    status: 'PAID',
    createdAt: '2026-06-02T14:10:00.000Z',
    paidAt: '2026-06-03T08:20:00.000Z',
  },
  {
    id: 'inv-2',
    projectId: 'proj-1',
    kind: 'EXTRA',
    label: 'Extra — Additional landing sections',
    amountCents: 45000,
    status: 'FAILED',
    createdAt: '2026-08-01T10:00:00.000Z',
    dueDate: '2026-08-08T00:00:00.000Z',
  },
  {
    id: 'inv-3',
    projectId: 'proj-1',
    kind: 'EXTRA',
    label: 'Extra — Rush timeline fee',
    amountCents: 20000,
    status: 'PAYMENT_PENDING',
    createdAt: '2026-08-09T09:00:00.000Z',
    dueDate: '2026-08-16T00:00:00.000Z',
  },

  // proj-2 — Review, final payment overdue
  {
    id: 'inv-4',
    projectId: 'proj-2',
    kind: 'DEPOSIT',
    label: 'Deposit — Landing Page Refresh',
    amountCents: 125000,
    status: 'PAID',
    createdAt: '2026-05-10T14:10:00.000Z',
    paidAt: '2026-05-11T09:00:00.000Z',
  },
  {
    id: 'inv-5',
    projectId: 'proj-2',
    kind: 'FINAL',
    label: 'Final payment — Landing Page Refresh',
    amountCents: 125000,
    status: 'SENT',
    createdAt: '2026-07-25T10:00:00.000Z',
    dueDate: '2026-08-05T00:00:00.000Z',
  },

  // proj-3 — Launched, closed out
  {
    id: 'inv-6',
    projectId: 'proj-3',
    kind: 'DEPOSIT',
    label: 'Deposit — Brand Site Relaunch',
    amountCents: 125000,
    status: 'PAID',
    createdAt: '2026-01-15T14:10:00.000Z',
    paidAt: '2026-01-16T08:00:00.000Z',
  },
  {
    id: 'inv-7',
    projectId: 'proj-3',
    kind: 'FINAL',
    label: 'Final payment — Brand Site Relaunch',
    amountCents: 125000,
    status: 'PAID',
    createdAt: '2026-03-15T10:00:00.000Z',
    paidAt: '2026-03-18T13:40:00.000Z',
  },
  {
    id: 'inv-8',
    projectId: 'proj-3',
    kind: 'EXTRA',
    label: 'Extra — Duplicate charge correction',
    amountCents: 15000,
    status: 'REFUNDED',
    createdAt: '2026-03-19T09:00:00.000Z',
    paidAt: '2026-03-19T09:05:00.000Z',
  },

  // proj-4 — On hold
  {
    id: 'inv-9',
    projectId: 'proj-4',
    kind: 'DEPOSIT',
    label: 'Deposit — Seasonal Menu Microsite',
    amountCents: 360000,
    status: 'PAID',
    createdAt: '2026-07-01T14:10:00.000Z',
    paidAt: '2026-07-02T10:00:00.000Z',
  },
  {
    id: 'inv-10',
    projectId: 'proj-4',
    kind: 'EXTRA',
    label: 'Extra — Menu redesign add-on',
    amountCents: 60000,
    status: 'VOIDED',
    createdAt: '2026-07-20T10:00:00.000Z',
  },
  {
    id: 'inv-11',
    projectId: 'proj-4',
    kind: 'EXTRA',
    label: 'Extra — Menu redesign add-on (redraft)',
    amountCents: 60000,
    status: 'DRAFT',
    createdAt: '2026-07-28T10:00:00.000Z',
  },
];

export const MOCK_NOTES: Note[] = [
  {
    id: 'note-1',
    projectId: 'proj-1',
    authorId: null,
    authorName: 'System',
    authorRole: 'SYSTEM',
    body: 'Project status changed from Design to Development.',
    createdAt: '2026-07-20T09:00:00.000Z',
  },
  {
    id: 'note-2',
    projectId: 'proj-1',
    authorId: 'staff-1',
    authorName: 'Sam Torres',
    authorRole: 'STAFF',
    body: 'Kicking off the development sprint — first build preview coming next week.',
    createdAt: '2026-07-20T09:05:00.000Z',
  },
  {
    id: 'note-3',
    projectId: 'proj-1',
    authorId: 'client-1',
    authorName: 'Jordan Ellis',
    authorRole: 'CLIENT',
    body: "Loving the direction so far! Could we add a testimonials section to the homepage?",
    createdAt: '2026-07-31T18:22:00.000Z',
  },
  {
    id: 'note-4',
    projectId: 'proj-1',
    authorId: 'staff-1',
    authorName: 'Sam Torres',
    authorRole: 'STAFF',
    body: "Absolutely — added that as an extra. Sent a small invoice for the additional section, take a look when you get a chance.",
    createdAt: '2026-08-01T10:02:00.000Z',
  },
  {
    id: 'note-5',
    projectId: 'proj-1',
    authorId: null,
    authorName: 'System',
    authorRole: 'SYSTEM',
    body: "Payment failed for invoice 'Extra — Additional landing sections'.",
    createdAt: '2026-08-02T07:00:00.000Z',
  },

  {
    id: 'note-6',
    projectId: 'proj-2',
    authorId: null,
    authorName: 'System',
    authorRole: 'SYSTEM',
    body: 'Project status changed from Development to Review.',
    createdAt: '2026-08-08T16:00:00.000Z',
  },
  {
    id: 'note-7',
    projectId: 'proj-2',
    authorId: 'staff-1',
    authorName: 'Sam Torres',
    authorRole: 'STAFF',
    body: 'The staging link is ready for your review — let us know about any final tweaks before we launch.',
    createdAt: '2026-08-08T16:05:00.000Z',
  },
  {
    id: 'note-8',
    projectId: 'proj-2',
    authorId: 'client-1',
    authorName: 'Jordan Ellis',
    authorRole: 'CLIENT',
    body: 'Looks fantastic. One small typo on the About section — "Riverside" is misspelled in the second paragraph.',
    createdAt: '2026-08-09T11:15:00.000Z',
  },

  {
    id: 'note-9',
    projectId: 'proj-3',
    authorId: null,
    authorName: 'System',
    authorRole: 'SYSTEM',
    body: 'Project status changed from Review to Launched.',
    createdAt: '2026-03-20T11:00:00.000Z',
  },
  {
    id: 'note-10',
    projectId: 'proj-3',
    authorId: 'staff-1',
    authorName: 'Sam Torres',
    authorRole: 'STAFF',
    body: "You're live! Congrats on the new site, Jordan.",
    createdAt: '2026-03-20T11:05:00.000Z',
  },
  {
    id: 'note-11',
    projectId: 'proj-3',
    authorId: 'client-1',
    authorName: 'Jordan Ellis',
    authorRole: 'CLIENT',
    body: 'Thank you — the whole team loves it!',
    createdAt: '2026-03-20T19:40:00.000Z',
  },

  {
    id: 'note-12',
    projectId: 'proj-4',
    authorId: null,
    authorName: 'System',
    authorRole: 'SYSTEM',
    body: 'Project status changed from Design to On Hold.',
    createdAt: '2026-07-28T10:00:00.000Z',
  },
  {
    id: 'note-13',
    projectId: 'proj-4',
    authorId: 'staff-1',
    authorName: 'Sam Torres',
    authorRole: 'STAFF',
    body: "Pausing this one while you finalize the new seasonal menu. Just post a note here when you're ready to pick it back up.",
    createdAt: '2026-07-28T10:04:00.000Z',
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'PAYMENT_FAILED',
    title: 'Payment failed',
    body: "Your payment for 'Extra — Additional landing sections' didn't go through. Tap to try again.",
    read: false,
    createdAt: '2026-08-02T07:00:00.000Z',
    projectId: 'proj-1',
    invoiceId: 'inv-2',
  },
  {
    id: 'notif-2',
    type: 'NEW_NOTE',
    title: 'New note from Sam Torres',
    body: 'The staging link is ready for your review — let us know about any final tweaks.',
    read: false,
    createdAt: '2026-08-08T16:05:00.000Z',
    projectId: 'proj-2',
  },
  {
    id: 'notif-3',
    type: 'PROJECT_STAGE_CHANGED',
    title: 'Riverside Cafe — Landing Page Refresh moved to Review',
    body: 'Your project is now in the Review stage.',
    read: false,
    createdAt: '2026-08-08T16:00:00.000Z',
    projectId: 'proj-2',
  },
  {
    id: 'notif-4',
    type: 'EXTRA_CHARGE_CREATED',
    title: 'New invoice: Extra — Rush timeline fee',
    body: 'A new invoice for $200.00 was added to Riverside Cafe — Full Website.',
    read: true,
    createdAt: '2026-08-09T09:00:00.000Z',
    projectId: 'proj-1',
    invoiceId: 'inv-3',
  },
  {
    id: 'notif-5',
    type: 'PROJECT_STAGE_CHANGED',
    title: 'Riverside Cafe — Full Website moved to Development',
    body: 'Your project is now in the Development stage.',
    read: true,
    createdAt: '2026-07-20T09:00:00.000Z',
    projectId: 'proj-1',
  },
  {
    id: 'notif-6',
    type: 'PAYMENT_SUCCEEDED',
    title: 'Payment received',
    body: "Thanks! Your final payment for 'Riverside Cafe — Brand Site Relaunch' was received.",
    read: true,
    createdAt: '2026-03-18T13:40:00.000Z',
    projectId: 'proj-3',
    invoiceId: 'inv-7',
  },
  {
    id: 'notif-7',
    type: 'PROJECT_STAGE_CHANGED',
    title: 'Riverside Cafe — Seasonal Menu Microsite moved to On Hold',
    body: "We've paused this project. Post a note when you're ready to resume.",
    read: true,
    createdAt: '2026-07-28T10:00:00.000Z',
    projectId: 'proj-4',
  },
];

// Requests belonging to prospects who don't have an account yet — looked up
// by email on the "check my request" screen, reachable before login.
export const MOCK_REQUESTS: ProjectRequest[] = [
  {
    id: 'req-1',
    packageId: 'pkg-landing-page',
    prospectName: 'Dana Chen',
    prospectEmail: 'dana@brightlaunch.io',
    status: 'PENDING',
    createdAt: '2026-08-08T12:00:00.000Z',
  },
  {
    id: 'req-2',
    packageId: 'pkg-full-website',
    prospectName: 'Marcus Webb',
    prospectEmail: 'marcus@webbstudio.com',
    status: 'APPROVED',
    createdAt: '2026-08-01T09:00:00.000Z',
    reviewedAt: '2026-08-03T15:00:00.000Z',
  },
  {
    id: 'req-3',
    packageId: 'pkg-landing-page',
    prospectName: 'Priya Shah',
    prospectEmail: 'priya@shahconsulting.com',
    status: 'REJECTED',
    createdAt: '2026-07-28T09:00:00.000Z',
    reviewedAt: '2026-07-30T11:00:00.000Z',
  },
];

export function getPackageById(id: string | null): Package | undefined {
  if (!id) return undefined;
  return MOCK_PACKAGES.find((p) => p.id === id);
}
