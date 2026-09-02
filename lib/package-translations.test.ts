import { describe, expect, it } from "vitest";
import { readPackageTranslations } from "@/lib/package-translations";
import { packageDescription, packageDuration, packageName } from "@/lib/package-copy";
import type { ManagedPackage } from "@/lib/types";

function pkg(overrides: Partial<ManagedPackage> = {}): ManagedPackage {
  return {
    id: "pkg-1",
    name: "Full Website",
    slug: "full-website",
    description: "A complete multi-page marketing site.",
    price: 6500,
    currency: "usd",
    estimatedDuration: "6–8 weeks",
    sortOrder: 2,
    ...overrides,
  };
}

describe("readPackageTranslations", () => {
  it("keeps a well-formed payload and trims it", () => {
    expect(readPackageTranslations({ de: { name: "  Komplette Website  ", description: "Text" } })).toEqual({
      de: { name: "Komplette Website", description: "Text" },
    });
  });

  it("drops blank fields so a locale falls back to English", () => {
    expect(readPackageTranslations({ de: { name: "Komplette Website", description: "   " } })).toEqual({
      de: { name: "Komplette Website" },
    });
  });

  it("returns null when everything is blank, which clears the column", () => {
    expect(readPackageTranslations({ de: { name: "", description: "" } })).toBeNull();
    expect(readPackageTranslations(null)).toBeNull();
  });

  it("rejects unknown locales and wrong shapes", () => {
    expect(readPackageTranslations({ fr: { name: "Site" } })).toBeUndefined();
    expect(readPackageTranslations({ en: { name: "Full Website" } })).toBeUndefined();
    expect(readPackageTranslations({ de: { name: 42 } })).toBeUndefined();
    expect(readPackageTranslations([{ de: {} }])).toBeUndefined();
    expect(readPackageTranslations("de")).toBeUndefined();
  });

  it("rejects a field beyond the length limit", () => {
    expect(readPackageTranslations({ de: { name: "x".repeat(2_001) } })).toBeUndefined();
  });
});

describe("package copy", () => {
  it("uses the stored English for the default locale even when a translation exists", () => {
    const withGerman = pkg({ translations: { de: { name: "Komplette Website" } } });
    expect(packageName(withGerman, "en")).toBe("Full Website");
    expect(packageName(withGerman, "de")).toBe("Komplette Website");
  });

  it("falls back per field, so a half-translated package still reads", () => {
    const halfTranslated = pkg({ translations: { de: { name: "Komplette Website" } } });
    expect(packageDescription(halfTranslated, "de")).toBe("A complete multi-page marketing site.");
  });

  it("falls back to English for a locale with no entry", () => {
    const withGerman = pkg({ translations: { de: { name: "Komplette Website" } } });
    expect(packageName(withGerman, "sq")).toBe("Full Website");
  });

  it("reflects an edit to the English columns in every locale that has no override", () => {
    const renamed = pkg({ name: "Marketing Site", translations: { de: { description: "Beschreibung" } } });
    expect(packageName(renamed, "de")).toBe("Marketing Site");
  });

  it("translates only the unit in a duration", () => {
    expect(packageDuration((key) => (key === "marketing.weeks" ? "Wochen" : key), "6–8 weeks")).toBe("6–8 Wochen");
  });
});
