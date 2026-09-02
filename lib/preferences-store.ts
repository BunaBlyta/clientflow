import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Locale } from "@/lib/locales";

export const EMPTY_TABLE_FILTERS: Record<string, string> = Object.freeze({});

type PreferencesState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  tableSort: Record<string, { key: string; direction: "asc" | "desc" }>;
  setTableSort: (table: string, sort: { key: string; direction: "asc" | "desc" }) => void;
  tableFilters: Record<string, Record<string, string>>;
  setTableFilter: (table: string, key: string, value: string) => void;
};

function initialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("clientflow_locale");
  if (stored === "de" || stored === "sq" || stored === "en") return stored;
  const browserLocale = window.navigator.language.toLowerCase();
  return browserLocale.startsWith("de") ? "de" : browserLocale.startsWith("sq") ? "sq" : "en";
}

const serverStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: initialLocale(),
      setLocale: (locale) => set({ locale }),
      tableSort: {},
      setTableSort: (table, sort) => set((state) => ({ tableSort: { ...state.tableSort, [table]: sort } })),
      tableFilters: {},
      setTableFilter: (table, key, value) => set((state) => ({ tableFilters: { ...state.tableFilters, [table]: { ...state.tableFilters[table], [key]: value } } })),
    }),
    {
      name: "clientflow_preferences",
      storage: createJSONStorage(() => (typeof window === "undefined" ? serverStorage : window.localStorage)),
    },
  ),
);
