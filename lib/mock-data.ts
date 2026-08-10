import type {
  Client,
  ContactLead,
  Invoice,
  Note,
  Notification,
  Package,
  Project,
  ProjectRequest,
  User,
} from "@/lib/types";

// All dates are relative to this fixed "now" so the seeded data (overdue invoices,
// relative timestamps) stays consistent across renders instead of drifting.
const NOW = new Date("2026-08-10T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

export const currentStaffUser: User = {
  id: "user-staff-1",
  email: "buna@tetbit.studio",
  name: "Buna",
  role: "STAFF",
  createdAt: daysAgo(120),
};

export const packages: Package[] = [
  {
    id: "pkg-landing",
    name: "Landing Page",
    slug: "landing-page",
    priceCents: 180000,
    isCustom: false,
    description: "A single high-converting page — hero, offer, proof, and a clear call to action.",
    features: ["1 page, fully responsive", "Copy + design included", "2 rounds of revisions", "Launch in ~2 weeks"],
    turnaroundDays: 14,
  },
  {
    id: "pkg-full-website",
    name: "Full Website",
    slug: "full-website",
    priceCents: 450000,
    isCustom: false,
    description: "A complete multi-page site for a business that needs more than one page can hold.",
    features: ["Up to 6 pages", "CMS for easy updates", "SEO-ready structure", "3 rounds of revisions"],
    turnaroundDays: 28,
  },
  {
    id: "pkg-web-app",
    name: "Web App Build",
    slug: "web-app-build",
    priceCents: null,
    isCustom: true,
    description: "A custom web application scoped to what your product actually needs.",
    features: ["Custom scope & pricing", "Auth, dashboards, integrations", "Dedicated project lead", "Timeline set after scoping call"],
    turnaroundDays: 45,
  },
];

export const clients: Client[] = [
  { id: "client-1", userId: "user-client-1", companyName: "Marlowe & Finch", contactName: "Ava Marlowe", email: "ava@marloweandfinch.com", phone: "+1 415 555 0114", createdAt: daysAgo(96) },
  { id: "client-2", userId: "user-client-2", companyName: "Northwind Coffee Co.", contactName: "Owen Reyes", email: "owen@northwindcoffee.com", createdAt: daysAgo(80) },
  { id: "client-3", userId: "user-client-3", companyName: "Ledger & Lime", contactName: "Priya Chandra", email: "priya@ledgerandlime.com", phone: "+1 212 555 0188", createdAt: daysAgo(70) },
  { id: "client-4", userId: "user-client-4", companyName: "Faircourt Studio", contactName: "Jonah Faircourt", email: "jonah@faircourtstudio.com", createdAt: daysAgo(58) },
  { id: "client-5", userId: "user-client-5", companyName: "Hazel & Rye", contactName: "Meredith Voss", email: "meredith@hazelandrye.com", createdAt: daysAgo(41) },
  { id: "client-6", userId: "user-client-6", companyName: "Verity Health Partners", contactName: "Daniel Osei", email: "daniel@verityhealth.com", phone: "+1 617 555 0142", createdAt: daysAgo(25) },
  { id: "client-7", userId: "user-client-7", companyName: "Basalt Outdoor", contactName: "Nina Kowalski", email: "nina@basaltoutdoor.com", createdAt: daysAgo(12) },
];

export const projects: Project[] = [
  { id: "proj-1", clientId: "client-1", packageId: "pkg-full-website", name: "Marlowe & Finch — Website Rebuild", status: "LAUNCHED", createdAt: daysAgo(96), updatedAt: daysAgo(5), targetLaunchDate: daysAgo(5) },
  { id: "proj-2", clientId: "client-2", packageId: "pkg-landing", name: "Northwind Coffee — Landing Page", status: "REVIEW", createdAt: daysAgo(80), updatedAt: daysAgo(2), targetLaunchDate: daysFromNow(6) },
  { id: "proj-3", clientId: "client-3", packageId: "pkg-web-app", name: "Ledger & Lime — Client Portal", status: "DEVELOPMENT", createdAt: daysAgo(70), updatedAt: daysAgo(3), targetLaunchDate: daysFromNow(20) },
  { id: "proj-4", clientId: "client-4", packageId: "pkg-full-website", name: "Faircourt Studio — Portfolio Site", status: "DESIGN", createdAt: daysAgo(58), updatedAt: daysAgo(4), targetLaunchDate: daysFromNow(15) },
  { id: "proj-5", clientId: "client-5", packageId: "pkg-landing", name: "Hazel & Rye — Landing Page", status: "DISCOVERY", createdAt: daysAgo(41), updatedAt: daysAgo(1), targetLaunchDate: daysFromNow(18) },
  { id: "proj-6", clientId: "client-6", packageId: "pkg-web-app", name: "Verity Health — Patient Intake App", status: "ON_HOLD", createdAt: daysAgo(25), updatedAt: daysAgo(9) },
  { id: "proj-7", clientId: "client-7", packageId: "pkg-landing", name: "Basalt Outdoor — Landing Page", status: "PENDING", createdAt: daysAgo(12), updatedAt: daysAgo(12) },
  { id: "proj-8", clientId: "client-2", packageId: "pkg-full-website", name: "Northwind Coffee — Wholesale Microsite", status: "CANCELLED", createdAt: daysAgo(60), updatedAt: daysAgo(40) },
];

export const invoices: Invoice[] = [
  { id: "inv-1", projectId: "proj-1", kind: "DEPOSIT", label: "Deposit", amountCents: 225000, status: "PAID", dueDate: daysAgo(90), paidAt: daysAgo(89), createdAt: daysAgo(96) },
  { id: "inv-2", projectId: "proj-1", kind: "FINAL", label: "Final payment", amountCents: 225000, status: "PAID", dueDate: daysAgo(8), paidAt: daysAgo(7), createdAt: daysAgo(14) },
  { id: "inv-3", projectId: "proj-2", kind: "DEPOSIT", label: "Deposit", amountCents: 90000, status: "PAID", dueDate: daysAgo(74), paidAt: daysAgo(73), createdAt: daysAgo(80) },
  { id: "inv-4", projectId: "proj-2", kind: "FINAL", label: "Final payment", amountCents: 90000, status: "SENT", dueDate: daysFromNow(4), createdAt: daysAgo(2) },
  { id: "inv-5", projectId: "proj-3", kind: "DEPOSIT", label: "Deposit", amountCents: 400000, status: "PAID", dueDate: daysAgo(64), paidAt: daysAgo(63), createdAt: daysAgo(70) },
  { id: "inv-6", projectId: "proj-3", kind: "EXTRA", label: "Extra — admin reporting module", amountCents: 120000, status: "PAYMENT_PENDING", dueDate: daysFromNow(5), createdAt: daysAgo(3) },
  { id: "inv-7", projectId: "proj-4", kind: "DEPOSIT", label: "Deposit", amountCents: 225000, status: "PAID", dueDate: daysAgo(52), paidAt: daysAgo(51), createdAt: daysAgo(58) },
  { id: "inv-8", projectId: "proj-5", kind: "DEPOSIT", label: "Deposit", amountCents: 90000, status: "SENT", dueDate: daysAgo(3), createdAt: daysAgo(6) },
  { id: "inv-9", projectId: "proj-6", kind: "DEPOSIT", label: "Deposit", amountCents: 500000, status: "PAID", dueDate: daysAgo(20), paidAt: daysAgo(19), createdAt: daysAgo(25) },
  { id: "inv-10", projectId: "proj-6", kind: "EXTRA", label: "Extra — HIPAA compliance review", amountCents: 80000, status: "FAILED", dueDate: daysAgo(2), createdAt: daysAgo(9) },
  { id: "inv-11", projectId: "proj-8", kind: "DEPOSIT", label: "Deposit", amountCents: 225000, status: "VOIDED", dueDate: daysAgo(50), createdAt: daysAgo(60) },
  { id: "inv-12", projectId: "proj-1", kind: "EXTRA", label: "Extra — copy revisions", amountCents: 35000, status: "REFUNDED", dueDate: daysAgo(30), paidAt: daysAgo(29), createdAt: daysAgo(32) },
];

export const notes: Note[] = [
  { id: "note-1", projectId: "proj-3", authorId: null, authorName: "System", authorRole: "SYSTEM", body: "Project moved from Design to Development.", createdAt: daysAgo(20) },
  { id: "note-2", projectId: "proj-3", authorId: "user-client-3", authorName: "Priya Chandra", authorRole: "CLIENT", body: "Could we add a CSV export to the reporting screen? Happy to cover the extra cost.", createdAt: daysAgo(4) },
  { id: "note-3", projectId: "proj-3", authorId: "user-staff-1", authorName: "Buna", authorRole: "STAFF", body: "Sure — scoped it as a small add-on, invoice sent for approval.", createdAt: daysAgo(3) },
  { id: "note-4", projectId: "proj-2", authorId: null, authorName: "System", authorRole: "SYSTEM", body: "Project moved from Development to Review.", createdAt: daysAgo(2) },
  { id: "note-5", projectId: "proj-2", authorId: "user-client-2", authorName: "Owen Reyes", authorRole: "CLIENT", body: "Loving the new hero section — can we swap the coffee bag photo for the roast-floor one?", createdAt: daysAgo(1) },
];

export const projectRequests: ProjectRequest[] = [
  { id: "req-1", packageId: "pkg-landing", prospectName: "Sana Iqbal", prospectEmail: "sana@irisandoak.com", companyName: "Iris & Oak", message: "Looking for a clean landing page for our new candle line, launching next month.", status: "PENDING", createdAt: daysAgo(1) },
  { id: "req-2", packageId: "pkg-full-website", prospectName: "Marcus Webb", prospectEmail: "marcus@webbstructural.com", companyName: "Webb Structural Engineering", message: "Need a proper multi-page site — current one is a single WordPress page from 2016.", status: "PENDING", createdAt: daysAgo(3) },
  { id: "req-3", packageId: "pkg-landing", prospectName: "Tori Blackwood", prospectEmail: "tori@blackwoodyoga.com", companyName: "Blackwood Yoga", status: "APPROVED", createdAt: daysAgo(14), reviewedAt: daysAgo(12) },
  { id: "req-4", packageId: "pkg-full-website", prospectName: "Elliot Price", prospectEmail: "elliot@pricefinancial.net", companyName: "Price Financial", message: "Budget is tight this quarter, exploring options.", status: "REJECTED", createdAt: daysAgo(22), reviewedAt: daysAgo(20) },
];

export const contactLeads: ContactLead[] = [
  { id: "lead-1", name: "Renata Souza", email: "renata@fieldnoteapp.com", companyName: "Fieldnote", message: "We need a custom web app for field data collection — offline-first, exports to our existing backend.", createdAt: daysAgo(2) },
  { id: "lead-2", name: "Callum Ashworth", email: "callum@driftline.co", message: "Interested in a booking + scheduling system for a small studio chain.", createdAt: daysAgo(6) },
];

export const notifications: Notification[] = [
  { id: "notif-1", userId: "user-staff-1", type: "REQUEST_SUBMITTED", title: "New project request", body: "Sana Iqbal requested a Landing Page for Iris & Oak.", read: false, createdAt: daysAgo(1), link: "/dashboard/projects?tab=requests" },
  { id: "notif-2", userId: "user-staff-1", type: "NEW_NOTE", title: "New note on Northwind Coffee — Landing Page", body: "Owen Reyes left a note about the hero photo.", read: false, createdAt: daysAgo(1), link: "/dashboard/projects/proj-2" },
  { id: "notif-3", userId: "user-staff-1", type: "EXTRA_CHARGE_CREATED", title: "Extra invoice sent", body: "Extra — admin reporting module sent for Ledger & Lime.", read: true, createdAt: daysAgo(3), link: "/dashboard/projects/proj-3" },
  { id: "notif-4", userId: "user-staff-1", type: "PAYMENT_FAILED", title: "Payment failed", body: "Verity Health Partners — HIPAA compliance review invoice failed.", read: true, createdAt: daysAgo(2), link: "/dashboard/projects/proj-6" },
  { id: "notif-5", userId: "user-staff-1", type: "PROJECT_STAGE_CHANGED", title: "Project moved to Review", body: "Northwind Coffee — Landing Page is now in Review.", read: true, createdAt: daysAgo(2), link: "/dashboard/projects/proj-2" },
];

// --- Lookup helpers ---

export function getPackage(id: string): Package | undefined {
  return packages.find((p) => p.id === id);
}

export function getClient(id: string): Client | undefined {
  return clients.find((c) => c.id === id);
}

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function invoicesForProject(projectId: string): Invoice[] {
  return invoices.filter((i) => i.projectId === projectId);
}

export function notesForProject(projectId: string): Note[] {
  return notes
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function clientTotalBilledCents(clientId: string): number {
  const projectIds = projects.filter((p) => p.clientId === clientId).map((p) => p.id);
  return invoices
    .filter((i) => projectIds.includes(i.projectId) && i.status === "PAID")
    .reduce((sum, i) => sum + i.amountCents, 0);
}
