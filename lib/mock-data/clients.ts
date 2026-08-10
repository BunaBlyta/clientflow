import type { Client, Staff } from "@/lib/types";

export const staffUsers: Staff[] = [
  {
    id: "staff_1",
    role: "staff",
    name: "Buna",
    email: "buna@tetbit.studio",
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "staff_2",
    role: "staff",
    name: "Elira Krasniqi",
    email: "elira@tetbit.studio",
    createdAt: "2026-06-01T09:00:00.000Z",
  },
];

export const clients: Client[] = [
  {
    id: "client_1",
    role: "client",
    name: "Dren Hoxha",
    email: "dren@northbrewcoffee.com",
    company: "Northbrew Coffee Co.",
    createdAt: "2026-06-10T14:00:00.000Z",
  },
  {
    id: "client_2",
    role: "client",
    name: "Sara Malstrom",
    email: "sara@haventherapy.com",
    company: "Haven Therapy Group",
    createdAt: "2026-06-18T10:30:00.000Z",
  },
  {
    id: "client_3",
    role: "client",
    name: "Marco Bellini",
    email: "marco@bellinifoods.it",
    company: "Bellini Foods Import",
    createdAt: "2026-07-02T11:15:00.000Z",
  },
  {
    id: "client_4",
    role: "client",
    name: "Priya Nair",
    email: "priya@fernwellclinic.com",
    company: "Fernwell Clinic",
    createdAt: "2026-07-20T08:45:00.000Z",
  },
  {
    id: "client_5",
    role: "client",
    name: "Tomasz Wojcik",
    email: "tomasz@pivotlogix.com",
    company: "Pivot Logix",
    createdAt: "2026-08-01T16:20:00.000Z",
  },
];
