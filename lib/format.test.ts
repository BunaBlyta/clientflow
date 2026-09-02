import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/format";
import { formatRelativeTime } from "@/lib/relative-time";

const ALBANIAN: Record<string, string> = {
  "time.minutesAgo": "{count} min më parë",
  "time.hoursAgo": "{count} orë më parë",
  "time.daysAgo": "{count} ditë më parë",
  "time.monthsAgo": "{count} muaj më parë",
};

function t(key: string, values?: Record<string, string | number>) {
  const template = ALBANIAN[key] ?? (key === "common.justNow" ? "just now" : key);
  return values
    ? Object.entries(values).reduce((r, [name, value]) => r.replaceAll(`{${name}}`, String(value)), template)
    : template;
}
const MARCH_20 = "2026-03-20T10:00:00.000Z";

describe("formatDate", () => {
  it("localizes the month name", () => {
    expect(formatDate(MARCH_20, "en")).toBe("Mar 20, 2026");
    expect(formatDate(MARCH_20, "de")).toBe("20. März 2026");
  });

  it("spells the month out in Albanian rather than abbreviating it", () => {
    expect(formatDate(MARCH_20, "sq")).toBe("20 mars 2026");
  });

  // Chrome 151 resolves sq-AL to en-US and returns English month names, while
  // Node ships the data — so Albanian must not go through Intl at all.
  it("formats Albanian without Intl, so a browser missing the data still gets Albanian", () => {
    const withoutAlbanianIcu = { ...Intl, DateTimeFormat: undefined } as unknown as typeof Intl;
    const original = globalThis.Intl;
    globalThis.Intl = withoutAlbanianIcu;
    try {
      expect(formatDate(MARCH_20, "sq")).toBe("20 mars 2026");
    } finally {
      globalThis.Intl = original;
    }
  });

  it("covers every month", () => {
    const names = Array.from({ length: 12 }, (_, month) =>
      formatDate(new Date(Date.UTC(2026, month, 15)).toISOString(), "sq").split(" ")[1]);
    expect(names).toEqual([
      "janar", "shkurt", "mars", "prill", "maj", "qershor",
      "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor",
    ]);
  });
});

describe("formatRelativeTime", () => {
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

  it("keeps the compact English wording the column was built for", () => {
    expect(formatRelativeTime(ago(5), "en", t)).toBe("5m ago");
    expect(formatRelativeTime(ago(180), "en", t)).toBe("3h ago");
  });

  it("localizes the units", () => {
    expect(formatRelativeTime(ago(180), "de", t)).toContain("Std");
    expect(formatRelativeTime(ago(180), "sq", t)).toBe("3 orë më parë");
  });

  it("uses the translated string under a minute", () => {
    expect(formatRelativeTime(ago(0), "en", t)).toBe("just now");
  });

  it("steps up through hours, days, and months", () => {
    expect(formatRelativeTime(ago(60 * 24 * 2), "en", t)).toBe("2d ago");
    expect(formatRelativeTime(ago(60 * 24 * 90), "en", t)).toBe("3mo ago");
  });
});
