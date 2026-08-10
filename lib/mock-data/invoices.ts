import type { Invoice } from "@/lib/types";

export const invoices: Invoice[] = [
  // proj_1 — Launched, fully paid
  {
    id: "inv_1",
    projectId: "proj_1",
    label: "Deposit",
    amountUsd: 2250,
    status: "Paid",
    createdAt: "2026-06-12T09:10:00.000Z",
    paidAt: "2026-06-12T15:22:00.000Z",
  },
  {
    id: "inv_2",
    projectId: "proj_1",
    label: "Final payment",
    amountUsd: 2250,
    status: "Paid",
    createdAt: "2026-07-24T09:00:00.000Z",
    paidAt: "2026-07-24T16:40:00.000Z",
  },
  // proj_2 — Review, deposit paid, final sent (due soon)
  {
    id: "inv_3",
    projectId: "proj_2",
    label: "Deposit",
    amountUsd: 2250,
    status: "Paid",
    createdAt: "2026-06-20T09:10:00.000Z",
    paidAt: "2026-06-21T08:05:00.000Z",
  },
  {
    id: "inv_4",
    projectId: "proj_2",
    label: "Final payment",
    amountUsd: 2250,
    status: "Sent",
    dueDate: "2026-08-15T00:00:00.000Z",
    createdAt: "2026-08-08T11:00:00.000Z",
  },
  // proj_3 — Development, deposit paid, one overdue extra charge
  {
    id: "inv_5",
    projectId: "proj_3",
    label: "Deposit",
    amountUsd: 600,
    status: "Paid",
    createdAt: "2026-07-05T09:10:00.000Z",
    paidAt: "2026-07-05T13:00:00.000Z",
  },
  {
    id: "inv_6",
    projectId: "proj_3",
    label: "Extra: additional product photography page",
    amountUsd: 250,
    status: "Sent",
    dueDate: "2026-08-01T00:00:00.000Z",
    createdAt: "2026-07-22T09:00:00.000Z",
  },
  // proj_4 — Design, deposit payment currently processing
  {
    id: "inv_7",
    projectId: "proj_4",
    label: "Deposit",
    amountUsd: 4000,
    status: "Payment Pending",
    createdAt: "2026-08-05T10:00:00.000Z",
  },
  // proj_5 — Discovery, deposit invoice just issued
  {
    id: "inv_8",
    projectId: "proj_5",
    label: "Deposit",
    amountUsd: 600,
    status: "Sent",
    dueDate: "2026-08-16T00:00:00.000Z",
    createdAt: "2026-08-04T09:00:00.000Z",
  },
  // A voided and a failed example, for state coverage in the UI
  {
    id: "inv_9",
    projectId: "proj_2",
    label: "Extra: stock photography licensing (voided — client sourced their own)",
    amountUsd: 150,
    status: "Voided",
    createdAt: "2026-07-10T09:00:00.000Z",
  },
  {
    id: "inv_10",
    projectId: "proj_3",
    label: "Extra: rush delivery fee (card declined, retry pending)",
    amountUsd: 300,
    status: "Failed",
    createdAt: "2026-08-06T09:00:00.000Z",
  },
];
