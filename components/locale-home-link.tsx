"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { localeHomePath, useLocale } from "@/lib/i18n";

/**
 * "Back to Clientflow" from a page that has no locale in its URL.
 *
 * The auth screens read their language from the stored preference, so a visitor
 * who came from `/de` should land back on `/de`, not on the English root.
 */
export function LocaleHomeLink({
  children,
  ...props
}: { children: ReactNode } & Omit<ComponentProps<typeof Link>, "href">) {
  const { locale } = useLocale();
  return (
    <Link href={localeHomePath(locale)} {...props}>
      {children}
    </Link>
  );
}
