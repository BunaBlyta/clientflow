"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Mail, RefreshCw } from "lucide-react";
import { formatMajorCurrency, initials } from "@/lib/format";
import { EditPackageDialog } from "@/components/dashboard/edit-package-dialog";
import { CreatePackageDialog } from "@/components/dashboard/create-package-dialog";
import { fetchJson } from "@/lib/fetch-json";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ManagedPackage, StaffMember } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { LanguageSelect } from "@/components/language-select";
import { ThemeToggle } from "@/components/theme-toggle";

export function SettingsContent() {
  const { t } = useLocale();
  return (
    <Tabs defaultValue="packages">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="packages">{t("nav.packages")}</TabsTrigger>
        <TabsTrigger value="team">{t("settings.team")}</TabsTrigger>
        <TabsTrigger value="display">{t("settings.display")}</TabsTrigger>
      </TabsList>
      <TabsContent value="packages" keepMounted className="mt-4">
        <PackagesSection />
      </TabsContent>
      <TabsContent value="team" keepMounted className="mt-4">
        <TeamSection />
      </TabsContent>
      <TabsContent value="display" keepMounted className="mt-4">
        <DisplaySection />
      </TabsContent>
    </Tabs>
  );
}

function DisplaySection() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      <div className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-[14px] font-medium">{t("settings.theme")}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("settings.themeIntro")}</p>
        </div>
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-[14px] font-medium">{t("settings.language")}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("settings.languageIntro")}</p>
        </div>
        <LanguageSelect showIcon={false} />
      </div>
    </div>
  );
}

function PackagesSection() {
  const { t } = useLocale();
  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPackages = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const packageData = await fetchJson<ManagedPackage[]>("/api/packages", "We couldn't load the packages.", signal);
      if (!Array.isArray(packageData)) throw new Error("The server returned an unexpected package response.");
      if (!signal?.aborted) setPackages(packageData);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the packages.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadPackages(controller.signal));
    return () => controller.abort();
  }, [loadPackages]);

  if (isLoading) return <LoadingState label={t("common.loading")} />;

  if (error) {
    return (
      <ErrorState title={t("settings.packagesFailed")} error={error} onRetry={() => void loadPackages()} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          {t("settings.packagesIntro")}
        </p>
        <CreatePackageDialog
          onCreated={(pkg) => setPackages((current) => [...current, pkg].sort((a, b) => a.sortOrder - b.sortOrder))}
        />
      </div>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {packages.map((pkg) => {
          const isEditing = editingPackageId === pkg.id;
          return (
            <div key={pkg.id} className={isEditing ? "p-5" : "flex items-start justify-between gap-4 p-5"}>
              {isEditing ? (
                <EditPackageDialog
                  pkg={pkg}
                  isEditing
                  onEdit={() => setEditingPackageId(pkg.id)}
                  onCancel={() => setEditingPackageId(null)}
                  onUpdated={(updatedPackage) => {
                    setPackages((current) =>
                      current.map((currentPackage) =>
                        currentPackage.id === updatedPackage.id ? updatedPackage : currentPackage,
                      ),
                    );
                  }}
                  onDeactivated={() =>
                    setPackages((current) => current.filter((currentPackage) => currentPackage.id !== pkg.id))
                  }
                />
              ) : (
                <>
                  <div>
                    <p className="text-[14px] font-medium">{pkg.name}</p>
                    <p className="mt-1 max-w-md text-[13px] text-muted-foreground">{pkg.description}</p>
                    <p className="mt-2 text-[13px]">
                      {formatMajorCurrency(pkg.price, pkg.currency)} · {pkg.estimatedDuration ?? "Duration to be scoped"}
                    </p>
                  </div>
                  <EditPackageDialog
                    pkg={pkg}
                    isEditing={false}
                    onEdit={() => setEditingPackageId(pkg.id)}
                    onCancel={() => setEditingPackageId(null)}
                    onUpdated={(updatedPackage) =>
                      setPackages((current) =>
                        current.map((currentPackage) =>
                          currentPackage.id === updatedPackage.id ? updatedPackage : currentPackage,
                        ),
                      )
                    }
                    onDeactivated={() =>
                      setPackages((current) => current.filter((currentPackage) => currentPackage.id !== pkg.id))
                    }
                  />
                </>
              )}
            </div>
          );
        })}
        {packages.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">{t("settings.noPackages")}</p>
        )}
      </div>
    </div>
  );
}

function TeamSection() {
  const { t } = useLocale();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [resendingStaffId, setResendingStaffId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<{ staffId: string; message: string } | null>(null);

  const loadTeam = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [staffData, currentUser] = await Promise.all([
        fetchJson<StaffMember[]>("/api/staff", "We couldn't load the team.", signal),
        fetchJson<{ id: string }>("/api/auth/me", "We couldn't load your account.", signal),
      ]);

      if (!Array.isArray(staffData) || !currentUser || typeof currentUser.id !== "string") {
        throw new Error("The server returned an unexpected team response.");
      }

      if (!signal?.aborted) {
        setStaff(staffData);
        setCurrentUserId(currentUser.id);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the team.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadTeam(controller.signal));
    return () => controller.abort();
  }, [loadTeam]);

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) return;

    setIsInviting(true);
    try {
      const result = await fetchJson<{ emailSent?: boolean }>(
        "/api/staff/invite",
        "We couldn't send the invitation.",
        undefined,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, name: trimmedName }),
        },
      );

      setName("");
      setEmail("");
      await loadTeam();
      if (result.emailSent === false) {
        toast.error("Invitation created, but the email could not be sent", {
          description: "The teammate is listed below. Use Resend to try the email again.",
        });
      } else {
        toast.success("Invitation sent", { description: `${trimmedEmail} can now set up their account.` });
      }
    } catch (caughtError) {
      toast.error(caughtError instanceof Error ? caughtError.message : "We couldn't send the invitation.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleResend(staffMember: StaffMember) {
    setResendingStaffId(staffMember.id);
    setResendError(null);

    try {
      const result = await fetchJson<{ emailSent: boolean }>(
        `/api/staff/${encodeURIComponent(staffMember.id)}/resend-invitation`,
        "We couldn't resend the invitation.",
        undefined,
        { method: "POST" },
      );

      if (!result.emailSent) throw new Error("The invitation email could not be sent. Try again.");
      toast.success("Invitation resent", { description: `A fresh sign-in code was sent to ${staffMember.email}.` });
    } catch (caughtError) {
      setResendError({
        staffId: staffMember.id,
        message: caughtError instanceof Error ? caughtError.message : "We couldn't resend the invitation.",
      });
    } finally {
      setResendingStaffId(null);
    }
  }

  if (isLoading) return <LoadingState label={t("settings.teamLoading")} />;
  if (error) return <ErrorState title={t("settings.teamFailed")} error={error} onRetry={() => void loadTeam()} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border">
        {staff.map((staffMember) => (
          <div key={staffMember.id} className="flex items-center gap-4 border-b border-border p-5 last:border-0">
            <Avatar className="size-7"><AvatarFallback className="text-[11px]">{initials(staffMember.name)}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{staffMember.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">{staffMember.email}</p>
              {resendError?.staffId === staffMember.id && <p role="alert" className="mt-1 text-[11px] text-status-danger">{resendError.message}</p>}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-3">
              {currentUserId === staffMember.id && <span className="text-[12px] text-muted-foreground">{t("settings.you")}</span>}
              {!staffMember.isActive && (
                <>
                  <Badge className="bg-status-warning/10 text-status-warning">{t("settings.invited")}</Badge>
                  <Button type="button" variant="ghost" size="sm" disabled={resendingStaffId !== null} onClick={() => void handleResend(staffMember)}>
                    {resendingStaffId === staffMember.id && <LoaderCircle className="animate-spin" />}
                    {resendingStaffId === staffMember.id ? t("common.sending") : t("settings.resend")}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
        {staff.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">{t("settings.noTeam")}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-[15px] font-medium">{t("settings.inviteTitle")}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("settings.inviteIntro")}</p>
        </div>
        <form onSubmit={handleInvite} className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-name">{t("settings.name")}</Label>
            <Input id="invite-name" className="h-10" type="text" placeholder={t("settings.teammatePlaceholder")} value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">{t("auth.email")}</Label>
            <Input id="invite-email" className="h-10" type="email" placeholder="teammate@tetbit.studio" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="mt-1 border-t border-border pt-5">
            <Button className="w-full" type="submit" disabled={isInviting}>{isInviting ? <LoaderCircle className="animate-spin" /> : <Mail />}{isInviting ? t("common.sending") : t("settings.sendInvite")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex min-h-40 items-center justify-center border border-border"><div className="flex items-center gap-2 text-[13px] text-muted-foreground"><LoaderCircle className="size-4 animate-spin text-brand-accent" />{label}</div></div>;
}

function ErrorState({ title, error, onRetry }: { title: string; error: string; onRetry: () => void }) {
  return <div className="flex min-h-40 flex-col items-center justify-center border border-status-danger/30 px-6 text-center"><p className="text-[13px] font-medium text-status-danger">{title}</p><p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" size="sm" onClick={onRetry}><RefreshCw />Try again</Button></div>;
}
