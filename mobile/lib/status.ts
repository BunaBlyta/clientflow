import { color } from './theme';
import type { InvoiceStatus, ProjectStatus, RequestStatus } from './types';

export const PROJECT_STAGES: ProjectStatus[] = [
  'PENDING',
  'DISCOVERY',
  'DESIGN',
  'DEVELOPMENT',
  'REVIEW',
  'LAUNCHED',
];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PENDING: 'Pending',
  DISCOVERY: 'Discovery',
  DESIGN: 'Design',
  DEVELOPMENT: 'Development',
  REVIEW: 'Review',
  LAUNCHED: 'Launched',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};

interface StatusMeta {
  label: string;
  text: string;
  bg: string;
  border: string;
}

export const PROJECT_STATUS_META: Record<ProjectStatus, StatusMeta> = {
  PENDING: { label: 'Pending', text: color.neutral, bg: color.neutralBg, border: color.neutralBorder },
  DISCOVERY: { label: 'Discovery', text: color.accentPressed, bg: color.accentSoft, border: '#C7E5FF' },
  DESIGN: { label: 'Design', text: color.accentPressed, bg: color.accentSoft, border: '#C7E5FF' },
  DEVELOPMENT: { label: 'Development', text: color.accentPressed, bg: color.accentSoft, border: '#C7E5FF' },
  REVIEW: { label: 'Review', text: color.accentPressed, bg: color.accentSoft, border: '#C7E5FF' },
  LAUNCHED: { label: 'Launched', text: color.success, bg: color.successBg, border: color.successBorder },
  CANCELLED: { label: 'Cancelled', text: color.danger, bg: color.dangerBg, border: color.dangerBorder },
  ON_HOLD: { label: 'On Hold', text: color.warning, bg: color.warningBg, border: color.warningBorder },
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, StatusMeta> = {
  DRAFT: { label: 'Draft', text: color.neutral, bg: color.neutralBg, border: color.neutralBorder },
  SENT: { label: 'Due', text: color.warning, bg: color.warningBg, border: color.warningBorder },
  PAYMENT_PENDING: { label: 'Processing', text: color.warning, bg: color.warningBg, border: color.warningBorder },
  PAID: { label: 'Paid', text: color.success, bg: color.successBg, border: color.successBorder },
  FAILED: { label: 'Failed', text: color.danger, bg: color.dangerBg, border: color.dangerBorder },
  VOIDED: { label: 'Voided', text: color.neutral, bg: color.neutralBg, border: color.neutralBorder },
  REFUNDED: { label: 'Refunded', text: color.neutral, bg: color.neutralBg, border: color.neutralBorder },
};

// An overdue SENT/FAILED invoice gets its own pill rather than reusing "Due".
export const OVERDUE_META: StatusMeta = {
  label: 'Overdue',
  text: color.danger,
  bg: color.dangerBg,
  border: color.dangerBorder,
};

export const REQUEST_STATUS_META: Record<RequestStatus, StatusMeta> = {
  PENDING: { label: 'Pending review', text: color.warning, bg: color.warningBg, border: color.warningBorder },
  APPROVED: { label: 'Approved', text: color.success, bg: color.successBg, border: color.successBorder },
  REJECTED: { label: 'Not approved', text: color.danger, bg: color.dangerBg, border: color.dangerBorder },
};

export const INVOICE_KIND_LABEL: Record<string, string> = {
  DEPOSIT: 'Deposit',
  FINAL: 'Final payment',
  EXTRA: 'Extra',
};
