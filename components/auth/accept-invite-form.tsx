"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { isValidEmail } from "@/lib/validation";

type SetPasswordResponse = {
  user?: { role?: string };
  error?: string;
};

export function AcceptInviteForm() {
  const router = useRouter();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError(t("auth.emailRequired"));
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError(t("common.invalidEmail"));
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, code, password }),
      });
      const result = (await response.json().catch(() => null)) as SetPasswordResponse | null;

      if (!response.ok) {
        setError(result?.error ?? t("auth.invitationError"));
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError(t("auth.invitationUnexpected"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="invite-email">{t("auth.email")}</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-code">{t("auth.invitationCode")}</Label>
        <Input
          id="invite-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder={t("auth.codePlaceholder")}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-password">{t("auth.newPassword")}</Label>
        <Input
          id="invite-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={t("auth.passwordLength")}
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <p role="alert" className="border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
          {error}
        </p>
      )}

      <Button type="submit" className="h-9 w-full" disabled={isSubmitting || !email || code.length !== 6 || !password}>
        {isSubmitting && <LoaderCircle className="size-3.5 animate-spin" />}
        {isSubmitting ? t("auth.settingUp") : t("auth.accept")}
      </Button>
    </form>
  );
}
