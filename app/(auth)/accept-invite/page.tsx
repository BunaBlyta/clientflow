import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { LocaleText } from "@/components/locale-text";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelect } from "@/components/language-select";

export const metadata: Metadata = {
  title: "Accept invitation | Clientflow",
  description: "Set up your Clientflow studio dashboard account.",
};

export default function AcceptInvitePage() {
  return (
    <main className="flex min-h-screen bg-background">
      <section className="relative hidden flex-1 overflow-hidden bg-brand-sky-light px-12 py-10 lg:flex lg:flex-col">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-foreground">
          Clientflow
        </Link>

        <div className="relative z-10 mt-auto max-w-md pb-10">
          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.16em] text-foreground/60">
            <LocaleText id="auth.invited" />
          </p>
          <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
            <LocaleText id="auth.inviteHeroTitle" />
          </h1>
          <p className="mt-4 max-w-sm text-[14px] leading-6 text-foreground/65">
            <LocaleText id="auth.inviteHeroIntro" />
          </p>
        </div>

        <div className="absolute -right-20 top-24 size-80 rounded-full border border-white/60 bg-white/25" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full border border-white/50 bg-brand-sky/40" />
      </section>

      <section className="flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:w-[480px] lg:px-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="size-3.5" />
            <LocaleText id="nav.back" />
          </Link>
          <div className="mb-8">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-brand-accent">
              <LocaleText id="auth.setupAccount" />
            </p>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em]"><LocaleText id="auth.acceptInvitation" /></h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              <LocaleText id="auth.invitationIntro" />
            </p>
          </div>
          <Suspense fallback={<div className="h-56" />}>
            <AcceptInviteForm />
          </Suspense>
          <div className="mt-6 flex items-center justify-end gap-2"><LanguageSelect /><ThemeToggle /></div>
        </div>
      </section>
    </main>
  );
}
