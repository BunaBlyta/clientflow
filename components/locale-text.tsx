"use client";

import type { ElementType, ComponentPropsWithoutRef } from "react";
import { useLocale } from "@/lib/i18n";

export function LocaleText<T extends ElementType = "span">({
  id,
  as,
  values,
  ...props
}: { id: string; as?: T; values?: Record<string, string | number> } & Omit<ComponentPropsWithoutRef<T>, "children">) {
  const { t } = useLocale();
  const Component = (as ?? "span") as ElementType;
  return <Component {...props}>{t(id, values)}</Component>;
}
