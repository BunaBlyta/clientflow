import type { Translate } from './i18n';
import type { ThemeColors } from './theme';
import type { InvoiceStatus, ProjectStatus, RequestStatus } from './types';

export const PROJECT_STAGES: ProjectStatus[] = ['PENDING', 'DISCOVERY', 'DESIGN', 'DEVELOPMENT', 'REVIEW', 'LAUNCHED'];

interface StatusMeta {
  label: string;
  text: string;
  bg: string;
  border: string;
}

const projectStatusKeys: Record<ProjectStatus, Parameters<Translate>[0]> = {
  PENDING: 'status.pending', DISCOVERY: 'status.discovery', DESIGN: 'status.design', DEVELOPMENT: 'status.development',
  REVIEW: 'status.review', LAUNCHED: 'status.launched', CANCELLED: 'status.cancelled', ON_HOLD: 'status.onHold',
};

const invoiceStatusKeys: Record<InvoiceStatus, Parameters<Translate>[0]> = {
  DRAFT: 'status.draft', SENT: 'status.due', PAYMENT_PENDING: 'status.processing', PAID: 'status.paid',
  FAILED: 'status.failed', VOIDED: 'status.voided', REFUNDED: 'status.refunded',
};

const requestStatusKeys: Record<RequestStatus, Parameters<Translate>[0]> = {
  PENDING: 'status.pendingReview', APPROVED: 'status.approved', REJECTED: 'status.notApproved',
};

export function getProjectStatusLabel(status: ProjectStatus, t: Translate) {
  return t(projectStatusKeys[status]);
}

export function getProjectStatusMeta(status: ProjectStatus, colors: ThemeColors, t: Translate): StatusMeta {
  const label = getProjectStatusLabel(status, t);
  if (status === 'LAUNCHED') return { label, text: colors.success, bg: colors.successBg, border: colors.successBorder };
  if (status === 'CANCELLED') return { label, text: colors.danger, bg: colors.dangerBg, border: colors.dangerBorder };
  if (status === 'ON_HOLD') return { label, text: colors.warning, bg: colors.warningBg, border: colors.warningBorder };
  if (status === 'PENDING') return { label, text: colors.neutral, bg: colors.neutralBg, border: colors.neutralBorder };
  return { label, text: colors.accentPressed, bg: colors.accentSoft, border: colors.accentSoft };
}

export function getInvoiceStatusMeta(status: InvoiceStatus, colors: ThemeColors, t: Translate): StatusMeta {
  const label = t(invoiceStatusKeys[status]);
  if (status === 'PAID') return { label, text: colors.success, bg: colors.successBg, border: colors.successBorder };
  if (status === 'FAILED') return { label, text: colors.danger, bg: colors.dangerBg, border: colors.dangerBorder };
  if (status === 'SENT' || status === 'PAYMENT_PENDING') return { label, text: colors.warning, bg: colors.warningBg, border: colors.warningBorder };
  return { label, text: colors.neutral, bg: colors.neutralBg, border: colors.neutralBorder };
}

export function getOverdueMeta(colors: ThemeColors, t: Translate): StatusMeta {
  return { label: t('status.overdue'), text: colors.danger, bg: colors.dangerBg, border: colors.dangerBorder };
}

export function getRequestStatusMeta(status: RequestStatus, colors: ThemeColors, t: Translate): StatusMeta {
  const label = t(requestStatusKeys[status]);
  if (status === 'APPROVED') return { label, text: colors.success, bg: colors.successBg, border: colors.successBorder };
  if (status === 'REJECTED') return { label, text: colors.danger, bg: colors.dangerBg, border: colors.dangerBorder };
  return { label, text: colors.warning, bg: colors.warningBg, border: colors.warningBorder };
}

const invoiceKindKeys: Record<string, Parameters<Translate>[0]> = {
  DEPOSIT: 'status.deposit', FINAL: 'status.finalPayment', EXTRA: 'status.extra', CUSTOM: 'status.custom',
};

export function getInvoiceKindLabel(kind: string, t: Translate) {
  return t(invoiceKindKeys[kind] ?? 'status.custom');
}
