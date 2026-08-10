import type { ContactLead, ProjectRequest } from "@/lib/types";

export const projectRequests: ProjectRequest[] = [
  {
    id: "req_1",
    packageId: "pkg_website",
    prospectName: "Alina Rexha",
    prospectEmail: "alina@sagegardendesign.com",
    companyName: "Sage Garden Design",
    notes: "Need a new site before our fall catalog launch, ~6 pages, want a simple blog too.",
    status: "Pending",
    createdAt: "2026-08-09T13:10:00.000Z",
  },
  {
    id: "req_2",
    packageId: "pkg_landing",
    prospectName: "Jon Petrit",
    prospectEmail: "jon@petritlaw.com",
    companyName: "Petrit Law",
    notes: "One page for a new practice launch, needs a contact form and Google Maps embed.",
    status: "Approved",
    createdAt: "2026-07-28T09:00:00.000Z",
    decidedAt: "2026-07-29T10:00:00.000Z",
  },
  {
    id: "req_3",
    packageId: "pkg_landing",
    prospectName: "Kev Osei",
    prospectEmail: "kev@osei-fitness.com",
    companyName: "Osei Fitness",
    notes: "Budget doesn't match what we scoped after a call — passing for now.",
    status: "Rejected",
    createdAt: "2026-07-15T15:40:00.000Z",
    decidedAt: "2026-07-16T09:20:00.000Z",
  },
];

export const contactLeads: ContactLead[] = [
  {
    id: "lead_1",
    name: "Tomasz Wojcik",
    email: "tomasz@pivotlogix.com",
    company: "Pivot Logix",
    message:
      "We need an internal tool for tracking shipments — custom dashboard, a few integrations with our carriers' APIs. Open to a call this week.",
    createdAt: "2026-07-30T12:00:00.000Z",
  },
];
