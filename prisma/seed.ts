import { scryptSync, randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const date = (value: string) => new Date(value);

function passwordHash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  // Keep the seed credentials aligned with auth.ts: Node's current defaults,
  // explicitly recorded as N=16384, r=8, p=1, maxmem=32 MiB.
  const hash = scryptSync(password, salt, 64, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  }).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

async function main() {
  const staff = await prisma.user.upsert({
    where: { id: 'staff-1' },
    update: {
      email: 'sam@clientflow.studio',
      name: 'Sam Torres',
      role: 'STAFF',
      isActive: true,
      emailVerifiedAt: date('2026-08-01T09:00:00.000Z'),
    },
    create: {
      id: 'staff-1',
      email: 'sam@clientflow.studio',
      name: 'Sam Torres',
      passwordHash: passwordHash('clientflow-demo'),
      role: 'STAFF',
      isActive: true,
      emailVerifiedAt: date('2026-08-01T09:00:00.000Z'),
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { id: 'user-client-1' },
    update: {
      email: 'jordan@riversidecoffee.com',
      name: 'Jordan Ellis',
      role: 'CLIENT',
      isActive: true,
      emailVerifiedAt: date('2026-06-01T09:00:00.000Z'),
    },
    create: {
      id: 'user-client-1',
      email: 'jordan@riversidecoffee.com',
      name: 'Jordan Ellis',
      passwordHash: passwordHash('riverside123'),
      role: 'CLIENT',
      isActive: true,
      emailVerifiedAt: date('2026-06-01T09:00:00.000Z'),
    },
  });

  const client = await prisma.client.upsert({
    where: { id: 'client-1' },
    update: {
      userId: clientUser.id,
      name: 'Jordan Ellis',
      email: 'jordan@riversidecoffee.com',
      companyName: 'Riverside Coffee Co.',
    },
    create: {
      id: 'client-1',
      userId: clientUser.id,
      name: 'Jordan Ellis',
      email: 'jordan@riversidecoffee.com',
      companyName: 'Riverside Coffee Co.',
    },
  });

  const clientTwoUser = await prisma.user.upsert({
    where: { id: 'user-client-2' },
    update: {
      email: 'maya@northstarwellness.com',
      name: 'Maya Patel',
      role: 'CLIENT',
      isActive: true,
      emailVerifiedAt: date('2026-06-15T09:00:00.000Z'),
    },
    create: {
      id: 'user-client-2',
      email: 'maya@northstarwellness.com',
      name: 'Maya Patel',
      passwordHash: passwordHash('northstar123'),
      role: 'CLIENT',
      isActive: true,
      emailVerifiedAt: date('2026-06-15T09:00:00.000Z'),
    },
  });

  const clientTwo = await prisma.client.upsert({
    where: { id: 'client-2' },
    update: {
      userId: clientTwoUser.id,
      name: 'Maya Patel',
      email: 'maya@northstarwellness.com',
      companyName: 'Northstar Wellness',
    },
    create: {
      id: 'client-2',
      userId: clientTwoUser.id,
      name: 'Maya Patel',
      email: 'maya@northstarwellness.com',
      companyName: 'Northstar Wellness',
    },
  });

  const clientThreeUser = await prisma.user.upsert({
    where: { id: 'user-client-3' },
    update: {
      email: 'leo@atelierforma.com',
      name: 'Leo Martins',
      role: 'CLIENT',
      isActive: true,
      emailVerifiedAt: date('2026-07-01T09:00:00.000Z'),
    },
    create: {
      id: 'user-client-3',
      email: 'leo@atelierforma.com',
      name: 'Leo Martins',
      passwordHash: passwordHash('atelier123'),
      role: 'CLIENT',
      isActive: true,
      emailVerifiedAt: date('2026-07-01T09:00:00.000Z'),
    },
  });

  const clientThree = await prisma.client.upsert({
    where: { id: 'client-3' },
    update: {
      userId: clientThreeUser.id,
      name: 'Leo Martins',
      email: 'leo@atelierforma.com',
      companyName: 'Atelier Forma',
    },
    create: {
      id: 'client-3',
      userId: clientThreeUser.id,
      name: 'Leo Martins',
      email: 'leo@atelierforma.com',
      companyName: 'Atelier Forma',
    },
  });

  const pendingClientUser = await prisma.user.upsert({
    where: { id: 'user-client-4' },
    update: {
      email: 'casey@northwindstudio.com',
      name: 'Casey Brooks',
      role: 'CLIENT',
      isActive: true,
      emailVerifiedAt: date('2026-08-12T08:00:00.000Z'),
    },
    create: {
      id: 'user-client-4',
      email: 'casey@northwindstudio.com',
      name: 'Casey Brooks',
      passwordHash: passwordHash('northwind123'),
      role: 'CLIENT',
      isActive: true,
      emailVerifiedAt: date('2026-08-12T08:00:00.000Z'),
    },
  });

  const pendingClient = await prisma.client.upsert({
    where: { id: 'client-4' },
    update: {
      userId: pendingClientUser.id,
      name: 'Casey Brooks',
      email: 'casey@northwindstudio.com',
      companyName: 'Northwind Studio',
    },
    create: {
      id: 'client-4',
      userId: pendingClientUser.id,
      name: 'Casey Brooks',
      email: 'casey@northwindstudio.com',
      companyName: 'Northwind Studio',
    },
  });

  const packages = [
    {
      id: 'pkg-landing-page',
      name: 'Landing Page',
      slug: 'landing-page',
      description: 'A single high-converting page for a launch or campaign.',
      price: '2500.00',
      estimatedDuration: '2–3 weeks',
      sortOrder: 1,
      translations: {
        de: { name: 'Landing Page', description: 'Eine einzelne, conversion-starke Seite für einen Launch oder eine Kampagne.' },
        sq: { name: 'Faqe Uljeje', description: 'Një faqe e vetme me konvertim të lartë për një lançim ose fushatë.' },
      },
    },
    {
      id: 'pkg-full-website',
      name: 'Full Website',
      slug: 'full-website',
      description: 'A complete multi-page marketing site.',
      price: '6500.00',
      estimatedDuration: '6–8 weeks',
      sortOrder: 2,
      translations: {
        de: { name: 'Komplette Website', description: 'Eine vollständige Marketing-Website mit mehreren Seiten.' },
        sq: { name: 'Faqe e Plotë', description: 'Një faqe marketingu e plotë me shumë nënfaqe.' },
      },
    },
    {
      id: 'pkg-web-app',
      name: 'Web App Build',
      slug: 'web-app-build',
      description: 'A custom web application, scoped individually.',
      price: '18000.00',
      estimatedDuration: '10–14 weeks',
      sortOrder: 3,
      translations: {
        de: { name: 'Web-App-Entwicklung', description: 'Eine individuelle Web-Anwendung, einzeln abgestimmt.' },
        sq: { name: 'Ndërtim Web App-i', description: 'Një aplikacion web i personalizuar, i përcaktuar veç e veç.' },
      },
    },
  ];

  for (const packageData of packages) {
    await prisma.package.upsert({
      where: { id: packageData.id },
      update: packageData,
      create: packageData,
    });
  }

  const projects = [
    {
      id: 'proj-1',
      packageId: 'pkg-full-website',
      name: 'Riverside Cafe — Full Website',
      status: 'DEVELOPMENT' as const,
      description: 'A complete multi-page website for Riverside Coffee Co.',
      createdAt: '2026-06-02T14:00:00.000Z',
      updatedAt: '2026-08-05T09:30:00.000Z',
      targetLaunchDate: '2026-09-15T00:00:00.000Z',
    },
    {
      id: 'proj-2',
      packageId: 'pkg-landing-page',
      name: 'Riverside Cafe — Landing Page Refresh',
      status: 'REVIEW' as const,
      description: 'A conversion-focused landing page refresh.',
      createdAt: '2026-05-10T14:00:00.000Z',
      updatedAt: '2026-08-08T16:00:00.000Z',
      targetLaunchDate: '2026-08-20T00:00:00.000Z',
    },
    {
      id: 'proj-3',
      clientId: clientTwo.id,
      packageId: 'pkg-landing-page',
      name: 'Northstar — Brand Site Relaunch',
      status: 'LAUNCHED' as const,
      description: 'The launched brand site for the wellness company.',
      createdAt: '2026-01-15T14:00:00.000Z',
      updatedAt: '2026-03-20T11:00:00.000Z',
      launchedAt: '2026-03-20T00:00:00.000Z',
      targetLaunchDate: '2026-03-20T00:00:00.000Z',
    },
    {
      id: 'proj-4',
      clientId: clientThree.id,
      packageId: 'pkg-web-app',
      name: 'Atelier Forma — Seasonal Menu Microsite',
      status: 'ON_HOLD' as const,
      description: 'A seasonal menu experience awaiting refreshed content.',
      createdAt: '2026-07-01T14:00:00.000Z',
      updatedAt: '2026-07-28T10:00:00.000Z',
      targetLaunchDate: '2026-10-15T00:00:00.000Z',
    },
    {
      id: 'proj-5',
      clientId: pendingClient.id,
      packageId: 'pkg-full-website',
      name: 'Northwind Studio — Full Website',
      status: 'PENDING' as const,
      description: 'A new website awaiting deposit payment before discovery.',
      createdAt: '2026-08-12T08:00:00.000Z',
      updatedAt: '2026-08-12T08:00:00.000Z',
      targetLaunchDate: '2026-10-30T00:00:00.000Z',
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: { ...project, clientId: project.clientId ?? client.id, createdAt: date(project.createdAt), updatedAt: date(project.updatedAt), targetLaunchDate: date(project.targetLaunchDate) },
      create: { ...project, clientId: project.clientId ?? client.id, createdAt: date(project.createdAt), updatedAt: date(project.updatedAt), targetLaunchDate: date(project.targetLaunchDate) },
    });
  }

  const projectClientIds: Record<string, string> = {
    'proj-1': client.id,
    'proj-2': client.id,
    'proj-3': clientTwo.id,
    'proj-4': clientThree.id,
    'proj-5': pendingClient.id,
  };

  const invoices = [
    ['inv-1', 'proj-1', 'DEPOSIT', 'Deposit — Full Website', '3250.00', 'PAID', '2026-06-02T14:10:00.000Z', '2026-06-10T00:00:00.000Z', '2026-06-03T08:20:00.000Z'],
    ['inv-2', 'proj-1', 'EXTRA', 'Extra — Additional landing sections', '450.00', 'FAILED', '2026-08-01T10:00:00.000Z', '2026-08-15T00:00:00.000Z', undefined],
    ['inv-3', 'proj-1', 'EXTRA', 'Extra — Rush timeline fee', '200.00', 'PAYMENT_PENDING', '2026-08-09T09:00:00.000Z', '2026-08-23T00:00:00.000Z', undefined],
    ['inv-4', 'proj-2', 'DEPOSIT', 'Deposit — Landing Page Refresh', '1250.00', 'PAID', '2026-05-10T14:10:00.000Z', '2026-05-17T00:00:00.000Z', '2026-05-11T09:00:00.000Z'],
    ['inv-5', 'proj-2', 'FINAL', 'Final payment — Landing Page Refresh', '1250.00', 'SENT', '2026-07-25T10:00:00.000Z', '2026-08-05T00:00:00.000Z', undefined],
    ['inv-6', 'proj-3', 'DEPOSIT', 'Deposit — Brand Site Relaunch', '1250.00', 'PAID', '2026-01-15T14:10:00.000Z', '2026-01-22T00:00:00.000Z', '2026-01-16T08:00:00.000Z'],
    ['inv-7', 'proj-3', 'FINAL', 'Final payment — Brand Site Relaunch', '1250.00', 'PAID', '2026-03-15T10:00:00.000Z', '2026-03-22T00:00:00.000Z', '2026-03-18T13:40:00.000Z'],
    ['inv-8', 'proj-3', 'EXTRA', 'Extra — Duplicate charge correction', '150.00', 'REFUNDED', '2026-03-19T09:00:00.000Z', '2026-03-26T00:00:00.000Z', '2026-03-19T09:05:00.000Z'],
    ['inv-9', 'proj-4', 'DEPOSIT', 'Deposit — Seasonal Menu Microsite', '3600.00', 'PAID', '2026-07-01T14:10:00.000Z', '2026-07-08T00:00:00.000Z', '2026-07-02T10:00:00.000Z'],
    ['inv-10', 'proj-4', 'EXTRA', 'Extra — Menu redesign add-on', '600.00', 'VOIDED', '2026-07-20T10:00:00.000Z', '2026-08-03T00:00:00.000Z', undefined],
    ['inv-11', 'proj-4', 'EXTRA', 'Extra — Menu redesign add-on (redraft)', '600.00', 'DRAFT', '2026-07-28T10:00:00.000Z', '2026-08-11T00:00:00.000Z', undefined],
    ['inv-12', 'proj-4', 'CUSTOM', 'Custom — Content strategy sprint', '900.00', 'SENT', '2026-08-04T10:00:00.000Z', '2026-08-08T00:00:00.000Z', undefined],
    ['inv-13', 'proj-5', 'DEPOSIT', 'Deposit — Full Website', '3250.00', 'SENT', '2026-08-12T08:00:00.000Z', '2026-08-19T00:00:00.000Z', undefined],
  ] as const;

  for (const [id, projectId, type, description, amount, status, createdAt, dueDate, paidAt] of invoices) {
    await prisma.invoice.upsert({
      where: { id },
      update: {
        projectId,
        clientId: projectClientIds[projectId],
        type,
        description,
        amount,
        status,
        dueDate: date(dueDate),
        createdAt: date(createdAt),
        paidAt: paidAt ? date(paidAt) : null,
        issuedAt: status === 'DRAFT' ? null : date(createdAt),
      },
      create: {
        id,
        projectId,
        clientId: projectClientIds[projectId],
        type,
        description,
        amount,
        status,
        dueDate: date(dueDate),
        createdAt: date(createdAt),
        paidAt: paidAt ? date(paidAt) : undefined,
        issuedAt: status === 'DRAFT' ? undefined : date(createdAt),
      },
    });
  }

  const notes = [
    ['note-1', 'proj-1', null, 'Project status changed from Design to Development.', true, '2026-07-20T09:00:00.000Z'],
    ['note-2', 'proj-1', staff.id, 'Kicking off the development sprint — first build preview coming next week.', false, '2026-07-20T09:05:00.000Z'],
    ['note-3', 'proj-1', clientUser.id, 'Loving the direction so far! Could we add a testimonials section to the homepage?', false, '2026-07-31T18:22:00.000Z'],
    ['note-4', 'proj-1', staff.id, 'Absolutely — added that as an extra. Sent a small invoice for the additional section, take a look when you get a chance.', false, '2026-08-01T10:02:00.000Z'],
    ['note-5', 'proj-1', null, "Payment failed for invoice 'Extra — Additional landing sections'.", true, '2026-08-02T07:00:00.000Z'],
    ['note-6', 'proj-2', null, 'Project status changed from Development to Review.', true, '2026-08-08T16:00:00.000Z'],
    ['note-7', 'proj-2', staff.id, 'The staging link is ready for your review — let us know about any final tweaks before we launch.', false, '2026-08-08T16:05:00.000Z'],
    ['note-8', 'proj-2', clientUser.id, 'Looks fantastic. One small typo on the About section — "Riverside" is misspelled in the second paragraph.', false, '2026-08-09T11:15:00.000Z'],
    ['note-9', 'proj-3', null, 'Project status changed from Review to Launched.', true, '2026-03-20T11:00:00.000Z'],
    ['note-10', 'proj-3', staff.id, "You're live! Congrats on the new site, Maya.", false, '2026-03-20T11:05:00.000Z'],
    ['note-11', 'proj-3', clientUser.id, 'Thank you — the whole team loves it!', false, '2026-03-20T19:40:00.000Z'],
    ['note-12', 'proj-4', null, 'Project status changed from Design to On Hold.', true, '2026-07-28T10:00:00.000Z'],
    ['note-13', 'proj-4', staff.id, "Pausing this one while you finalize the new seasonal menu. Just post a note here when you're ready to pick it back up.", false, '2026-07-28T10:04:00.000Z'],
  ] as const;

  for (const [id, projectId, authorId, content, isSystem, createdAt] of notes) {
    await prisma.note.upsert({
      where: { id },
      update: { projectId, authorId, content, isSystem, createdAt: date(createdAt) },
      create: { id, projectId, authorId, content, isSystem, createdAt: date(createdAt) },
    });
  }

  const notifications = [
    ['notif-1', 'PAYMENT_FAILED', 'Payment failed', "Your payment for 'Extra — Additional landing sections' didn't go through. Tap to try again.", false, '2026-08-02T07:00:00.000Z', 'proj-1', 'inv-2', undefined],
    ['notif-2', 'NEW_NOTE', 'New note from Sam Torres', 'The staging link is ready for your review — let us know about any final tweaks.', false, '2026-08-08T16:05:00.000Z', 'proj-2', undefined, undefined],
    ['notif-3', 'PROJECT_STAGE_CHANGED', 'Riverside Cafe — Landing Page Refresh moved to Review', 'Your project is now in the Review stage.', false, '2026-08-08T16:00:00.000Z', 'proj-2', undefined, undefined],
    ['notif-4', 'EXTRA_CHARGE_CREATED', 'New invoice: Extra — Rush timeline fee', 'A new invoice for $200.00 was added to Riverside Cafe — Full Website.', true, '2026-08-09T09:00:00.000Z', 'proj-1', 'inv-3', undefined],
    ['notif-5', 'PROJECT_STAGE_CHANGED', 'Riverside Cafe — Full Website moved to Development', 'Your project is now in the Development stage.', true, '2026-07-20T09:00:00.000Z', 'proj-1', undefined, undefined],
    ['notif-6', 'PAYMENT_SUCCEEDED', 'Payment received', "Thanks! Your final payment for 'Riverside Cafe — Brand Site Relaunch' was received.", true, '2026-03-18T13:40:00.000Z', 'proj-3', 'inv-7', undefined],
    ['notif-7', 'PROJECT_STAGE_CHANGED', 'Riverside Cafe — Seasonal Menu Microsite moved to On Hold', "We've paused this project. Post a note when you're ready to resume.", true, '2026-07-28T10:00:00.000Z', 'proj-4', undefined, undefined],
  ] as const;

  for (const [id, type, title, message, read, createdAt, projectId, invoiceId, requestId] of notifications) {
    await prisma.notification.upsert({
      where: { id },
      update: { userId: clientUser.id, type, title, message, projectId, invoiceId, requestId, readAt: read ? date(createdAt) : null, createdAt: date(createdAt) },
      create: { id, userId: clientUser.id, type, title, message, projectId, invoiceId, requestId, readAt: read ? date(createdAt) : undefined, createdAt: date(createdAt) },
    });
  }

  await prisma.notification.upsert({
    where: { id: 'notif-8' },
    update: {
      userId: staff.id,
      type: 'REQUEST_SUBMITTED',
      title: 'New project request',
      message: 'A new project request is waiting for review.',
      requestId: null,
      readAt: null,
      createdAt: date('2026-08-12T08:05:00.000Z'),
    },
    create: {
      id: 'notif-8',
      userId: staff.id,
      type: 'REQUEST_SUBMITTED',
      title: 'New project request',
      message: 'A new project request is waiting for review.',
      createdAt: date('2026-08-12T08:05:00.000Z'),
    },
  });

  const requests = [
    ['req-1', 'Dana Chen', 'dana@brightlaunch.io', 'Bright Launch', 'pkg-landing-page', 'PENDING', '2026-08-08T12:00:00.000Z', undefined],
    ['req-2', 'Marcus Webb', 'marcus@webbstudio.com', 'Webb Studio', 'pkg-full-website', 'APPROVED', '2026-08-01T09:00:00.000Z', '2026-08-03T15:00:00.000Z'],
    ['req-3', 'Priya Shah', 'priya@shahconsulting.com', 'Shah Consulting', 'pkg-landing-page', 'REJECTED', '2026-07-28T09:00:00.000Z', '2026-07-30T11:00:00.000Z'],
  ] as const;

  for (const [id, name, email, companyName, packageId, status, createdAt, reviewedAt] of requests) {
    await prisma.projectRequest.upsert({
      where: { id },
      update: { name, email, companyName, packageId, status, clientId: id === 'req-2' ? client.id : null, createdAt: date(createdAt), reviewedAt: reviewedAt ? date(reviewedAt) : null },
      create: { id, name, email, companyName, packageId, status, clientId: id === 'req-2' ? client.id : undefined, createdAt: date(createdAt), reviewedAt: reviewedAt ? date(reviewedAt) : undefined },
    });
  }

  await prisma.notification.update({
    where: { id: 'notif-8' },
    data: { requestId: 'req-1' },
  });

  console.log(`Seeded ${packages.length} packages, ${projects.length} projects, ${invoices.length} invoices, ${notes.length} notes, ${notifications.length + 1} notifications, and ${requests.length} requests.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
