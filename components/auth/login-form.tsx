"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { isValidEmail } from "@/lib/validation";

type LoginResponse = {
  user?: { role?: string };
  error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
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
    if (!password) {
      setError(t("auth.passwordRequired"));
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const result = (await response.json()) as LoginResponse;

      if (!response.ok) {
        if (response.status === 400) {
          setError(t("auth.emailPasswordRequired"));
        } else if (response.status === 401) {
          setError(t("auth.invalidCredentials"));
        } else if (response.status === 429) {
          const retryAfter = Number(response.headers.get("Retry-After"));
          setError(
            retryAfter > 0
              ? t("auth.tooManyAttemptsWait", { minutes: Math.max(1, Math.ceil(retryAfter / 60)) })
              : t("auth.tooManyAttempts"),
          );
        } else if (response.status >= 500) {
          setError(t("auth.serverUnavailable"));
        } else {
          setError(result.error ?? t("auth.loginError"));
        }
        return;
      }

      if (result.user?.role !== "STAFF") {
        setError(t("auth.staffOnly"));
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next");
      const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      router.replace(destination);
      router.refresh();
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder")}
          className="auth-field"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <span className="text-[12px] text-muted-foreground">{t("auth.contactAdmin")}</span>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={t("auth.passwordPlaceholder")}
          className="auth-field"
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

      <Button type="submit" className="h-9 w-full" disabled={isSubmitting || !email || !password}>
        {isSubmitting && <LoaderCircle className="size-3.5 animate-spin" />}
        {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
      </Button>
    </form>
  );
}
