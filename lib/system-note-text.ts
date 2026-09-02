import { localizedStatusLabel } from "@/lib/notification-text";

type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * System notes are the project's audit trail. Like notifications, the server
 * writes them as English sentences, so the two shapes it produces are matched
 * back to message keys here.
 *
 * Notes written by people are left exactly as typed — translating someone's
 * own words in an immutable feed would misrepresent what they wrote.
 */
const STATUS_CHANGED = /^Project status changed from (.+) to (.+)\.$/;
const PAYMENT_CONFIRMED = /^(Deposit|Custom invoice) payment confirmed\. Project moved to (.+)\.$/;

export function localizeSystemNote(content: string, t: Translate): string {
  const statusChange = content.match(STATUS_CHANGED);
  if (statusChange) {
    return t("notes.statusChanged", {
      from: localizedStatusLabel(statusChange[1], t),
      to: localizedStatusLabel(statusChange[2], t),
    });
  }

  const payment = content.match(PAYMENT_CONFIRMED);
  if (payment) {
    const key = payment[1] === "Deposit" ? "notes.depositConfirmed" : "notes.customInvoiceConfirmed";
    return t(key, { status: localizedStatusLabel(payment[2], t) });
  }

  return content;
}
