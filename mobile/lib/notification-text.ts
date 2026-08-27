import type { Translate } from './i18n';
import { getProjectStatusLabel } from './status';
import type { Notification } from './types';

const SYSTEM_NEW_NOTE_BODY = 'A new note was posted to your project.';

/**
 * New-note notifications carry the note body itself. Other notification
 * bodies are server-authored templates (even when they contain names or
 * invoice descriptions) and must stay on the deterministic i18n path.
 */
export function getUserAuthoredNotificationBody(notification: Notification): string | null {
  if (notification.type !== 'NEW_NOTE' || notification.body === SYSTEM_NEW_NOTE_BODY) return null;
  return notification.body;
}

const statusByEnglishLabel: Record<string, Parameters<typeof getProjectStatusLabel>[0]> = {
  Pending: 'PENDING',
  Discovery: 'DISCOVERY',
  Design: 'DESIGN',
  Development: 'DEVELOPMENT',
  Review: 'REVIEW',
  Launched: 'LAUNCHED',
  Cancelled: 'CANCELLED',
  'On Hold': 'ON_HOLD',
};

function localizedStatus(value: string, t: Translate): string {
  const status = statusByEnglishLabel[value.replace(/[.!?]+$/, '')];
  return status ? getProjectStatusLabel(status, t) : value;
}

export function getLocalizedNotificationText(notification: Notification, t: Translate) {
  let title = notification.title;
  let body = notification.body;

  switch (notification.type) {
    case 'REQUEST_SUBMITTED':
      title = t('notifications.requestSubmittedTitle');
      if (notification.body === 'A new project request needs your review.') body = t('notifications.requestSubmittedBody');
      else {
        const bodyMatch = notification.body.match(/^(.+) requested a (.+)\.$/);
        if (bodyMatch) body = t('notifications.requestSubmittedDetailBody', { requester: bodyMatch[1], package: bodyMatch[2] });
      }
      break;
    case 'REQUEST_APPROVED':
      title = t('notifications.requestApprovedTitle');
      if (notification.body === 'Your project request was approved.') body = t('notifications.requestApprovedBody');
      else if (notification.body === 'Your project is ready. Your deposit invoice is available to pay.') body = t('notifications.projectReadyBody');
      break;
    case 'REQUEST_REJECTED':
      title = t('notifications.requestRejectedTitle');
      if (notification.body === 'There is an update to your project request.') body = t('notifications.requestRejectedBody');
      else if (notification.body === 'Your project request was not approved at this time.') body = t('notifications.requestNotApprovedBody');
      break;
    case 'INVOICE_ISSUED':
    case 'EXTRA_CHARGE_CREATED': {
      const titleMatch = notification.title.match(/^New invoice:\s*(.+)$/);
      if (titleMatch) {
        title = t('notifications.newInvoiceTitle', { label: titleMatch[1] });
        const bodyMatch = notification.body.match(/^A new invoice for (.+) was added to (.+)\.$/);
        if (bodyMatch) body = t('notifications.invoiceCreatedBody', { amount: bodyMatch[1], project: bodyMatch[2] });
      } else if (notification.type === 'EXTRA_CHARGE_CREATED' && notification.title === 'Additional invoice ready') {
        title = t('notifications.additionalInvoiceTitle');
        if (notification.body === 'An additional invoice is ready to review.') body = t('notifications.additionalInvoiceBody');
      } else if (notification.type === 'EXTRA_CHARGE_CREATED' && notification.title === 'Additional invoice sent') {
        title = t('notifications.additionalInvoiceSentTitle');
        const descriptionMatch = notification.body.match(/^(.+) is ready to review and pay\.$/);
        body = descriptionMatch
          ? t('notifications.invoiceDescriptionBody', { description: descriptionMatch[1] })
          : t('notifications.invoiceReadyToPayBody');
      } else if (notification.title === 'Invoice ready') {
        title = t('notifications.invoiceReadyTitle');
        if (notification.body === 'A new invoice is ready to review.') body = t('notifications.invoiceReadyBody');
      } else if (notification.title === 'Invoice sent' || notification.title === 'Invoice issued') {
        // Custom invoices created from a converted inquiry use the legacy
        // "Invoice issued" title even though the notification is the same
        // sent-for-payment event as the existing "Invoice sent" variant.
        title = t('notifications.invoiceSentTitle');
        const descriptionMatch = notification.body.match(/^(.+) is ready to review and pay\.$/);
        body = descriptionMatch
          ? t('notifications.invoiceDescriptionBody', { description: descriptionMatch[1] })
          : t('notifications.invoiceReadyToPayBody');
      }
      break;
    }
    case 'PAYMENT_SUCCEEDED': {
      title = t('notifications.paymentSucceededTitle');
      const bodyMatch = notification.body.match(/^Thanks! Your (?:final )?payment for ['“](.+?)['”] was received\.$/);
      if (bodyMatch) body = t('notifications.paymentSucceededBody', { invoice: bodyMatch[1] });
      else if (notification.body === 'Your payment was confirmed.') body = t('notifications.paymentConfirmedBody');
      else if (notification.body === 'Your invoice payment was confirmed.') body = t('notifications.invoicePaymentConfirmedBody');
      break;
    }
    case 'PAYMENT_FAILED': {
      title = notification.title === 'Payment update' ? t('notifications.paymentUpdateTitle') : t('notifications.paymentFailedTitle');
      const bodyMatch = notification.body.match(/^Your payment for ['“](.+?)['”] (?:didn't|didn’t) go through\. Tap to try again\.$/);
      if (bodyMatch) body = t('notifications.paymentFailedBody', { invoice: bodyMatch[1] });
      else if (notification.body === 'Your payment could not be completed.') body = t('notifications.paymentIncompleteBody');
      else if (notification.body === 'Your invoice payment could not be completed.') body = t('notifications.invoicePaymentIncompleteBody');
      break;
    }
    case 'PROJECT_STAGE_CHANGED': {
      const titleMatch = notification.title.match(/^(.+) moved to (.+)$/);
      if (titleMatch) {
        title = t('notifications.stageChangedTitle', {
          project: titleMatch[1],
          status: localizedStatus(titleMatch[2], t),
        });
      } else if (notification.title === 'Project status updated') {
        title = t('notifications.stageUpdatedTitle');
      }
      const bodyMatch = notification.body.match(/^Your project is now in the (.+) stage\.$/);
      if (bodyMatch) body = t('notifications.stageChangedBody', { status: localizedStatus(bodyMatch[1], t) });
      else if (/^We've paused this project\./.test(notification.body)) body = t('notifications.projectPausedBody');
      else if (notification.body === 'Your project status has changed.') body = t('notifications.stageUpdatedBody');
      else {
        const transitionMatch = notification.body.match(/^Your project moved from (.+) to (.+)\.$/);
        if (transitionMatch) {
          body = t('notifications.stageTransitionBody', {
            from: localizedStatus(transitionMatch[1], t),
            to: localizedStatus(transitionMatch[2], t),
          });
        }
      }
      break;
    }
    case 'NEW_NOTE': {
      const titleMatch = notification.title.match(/^New note from (.+)$/);
      if (titleMatch) title = t('notifications.newNoteTitle', { author: titleMatch[1] });
      else if (notification.title === 'New project note') title = t('notifications.newProjectNoteTitle');
      if (notification.body === SYSTEM_NEW_NOTE_BODY) body = t('notifications.newProjectNoteBody');
      break;
    }
  }

  return { title, body };
}
