"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { LoaderCircle, Mail, Plus, RefreshCw } from "lucide-react";
import { formatDate, formatMajorCurrency, initials } from "@/lib/format";
import { EditPackageDialog } from "@/components/dashboard/edit-package-dialog";
import { CreatePackageDialog } from "@/components/dashboard/create-package-dialog";
import { FieldHint } from "@/components/dashboard/field-hint";
import { fetchJson } from "@/lib/fetch-json";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ManagedPackage, StaffMember } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

export type SettingsTab = "packages" | "team";

type SettingsContentProps = {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
};

function SettingsHeaderAction({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.querySelector<HTMLElement>("[data-settings-header-action]"));
  }, []);

  return target ? createPortal(children, target) : null;
}

export function SettingsContent({ activeTab, onTabChange }: SettingsContentProps) {
  const { t } = useLocale();
  const [isPackageEditing, setIsPackageEditing] = useState(false);
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (value === "packages" || value === "team") onTabChange(value);
      }}
    >
      <TabsList className={isPackageEditing ? "hidden" : "grid w-full grid-cols-2"}>
        <TabsTrigger value="packages">{t("nav.packages")}</TabsTrigger>
        <TabsTrigger value="team">{t("settings.team")}</TabsTrigger>
      </TabsList>
      <TabsContent value="packages" keepMounted className="mt-5">
        <PackagesSection isActive={activeTab === "packages"} onEditingChange={setIsPackageEditing} />
      </TabsContent>
      <TabsContent value="team" keepMounted className="mt-5">
        <TeamSection isActive={activeTab === "team"} />
      </TabsContent>
    </Tabs>
  );
}

function PackagesSection({
  isActive,
  onEditingChange,
}: {
  isActive: boolean;
  onEditingChange: (isEditing: boolean) => void;
}) {
  const { t } = useLocale();
  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePackageCreated = useCallback((pkg: ManagedPackage) => {
    setPackages((current) => [...current, pkg].sort((a, b) => a.sortOrder - b.sortOrder));
  }, []);

  const startEditing = useCallback(
    (packageId: string) => {
      setEditingPackageId(packageId);
      onEditingChange(true);
    },
    [onEditingChange],
  );

  const stopEditing = useCallback(() => {
    setEditingPackageId(null);
    setIsCreatingPackage(false);
    onEditingChange(false);
  }, [onEditingChange]);

  const startCreating = useCallback(() => {
    setEditingPackageId(null);
    setIsCreatingPackage(true);
    onEditingChange(true);
  }, [onEditingChange]);

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

  const editingPackage = packages.find((pkg) => pkg.id === editingPackageId);

  if (isCreatingPackage) {
    return (
      <CreatePackageDialog
        inline
        onCreated={(createdPackage) => {
          handlePackageCreated(createdPackage);
          stopEditing();
        }}
        onCancel={stopEditing}
      />
    );
  }

  if (editingPackage) {
    return (
      <div className="settings-package-edit-shell rounded-lg border border-border">
        <EditPackageDialog
          pkg={editingPackage}
          isEditing
          onEdit={() => startEditing(editingPackage.id)}
          onCancel={stopEditing}
          onUpdated={(updatedPackage) => {
            setPackages((current) =>
              current.map((currentPackage) =>
                currentPackage.id === updatedPackage.id ? updatedPackage : currentPackage,
              ),
            );
          }}
          onDeactivated={() => setPackages((current) => current.filter((pkg) => pkg.id !== editingPackage.id))}
        />
      </div>
    );
  }

  return (
    <>
      {isActive && (
        <SettingsHeaderAction>
          <Button type="button" size="sm" onClick={startCreating}>
            <Plus />
            {t("settings.newPackage")}
          </Button>
        </SettingsHeaderAction>
      )}
      <div className="settings-package-list h-[360px] overflow-y-auto rounded-lg border border-border">
        <div className="flex flex-col divide-y divide-border">
        {packages.map((pkg) => {
          const isEditing = editingPackageId === pkg.id;
          return (
            <div key={pkg.id} className={isEditing ? "p-5" : "flex items-start justify-between gap-4 p-5"}>
              {isEditing ? (
                <EditPackageDialog
                  pkg={pkg}
                  isEditing
                  onEdit={() => startEditing(pkg.id)}
                  onCancel={stopEditing}
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
                    onEdit={() => startEditing(pkg.id)}
                    onCancel={stopEditing}
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
    </>
  );
}

function TeamSection({ isActive }: { isActive: boolean }) {
  const { t } = useLocale();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [resendingStaffId, setResendingStaffId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<{ staffId: string; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "email", string>>>({});

  const toggleInviteForm = useCallback(() => {
    setIsInviteFormOpen((open) => !open);
  }, []);

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
    const nextFieldErrors: Partial<Record<"name" | "email", string>> = {};
    if (!trimmedName) nextFieldErrors.name = t("common.required");
    if (!trimmedEmail) nextFieldErrors.email = t("common.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) nextFieldErrors.email = t("common.invalidEmail");
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

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
      setFieldErrors({});
      setIsInviteFormOpen(false);
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
    <>
      {isActive && (
        <SettingsHeaderAction>
          <Button type="button" size="sm" onClick={toggleInviteForm}>
            <Plus />
            {t("settings.inviteTitle")}
          </Button>
        </SettingsHeaderAction>
      )}
      <div className="h-[360px] overflow-y-auto rounded-lg border border-border">
        <div className="flex flex-col divide-y divide-border">
        {staff.map((staffMember) => (
          <div key={staffMember.id} className="flex items-center gap-4 p-5">
            <Avatar className="size-7"><AvatarFallback className="text-[11px]">{initials(staffMember.name)}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{staffMember.name}</p>
              <p className="mt-1 truncate text-[13px] text-muted-foreground">{staffMember.email}</p>
              <p className="mt-2 text-[13px] text-muted-foreground">{t("settings.joined")}: {formatDate(staffMember.createdAt)}</p>
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
      </div>

      {isInviteFormOpen && (
        <div className="rounded-lg border border-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-medium">{t("settings.inviteTitle")}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{t("settings.inviteIntro")}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsInviteFormOpen(false)}>
              {t("common.cancel")}
            </Button>
          </div>
          <form noValidate onSubmit={handleInvite} className="mt-5 flex w-full flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label htmlFor="invite-name">{t("settings.name")}</Label>
                <FieldHint id="invite-name-error" message={fieldErrors.name} />
              </div>
              <Input id="invite-name" className="h-10" type="text" placeholder={t("settings.teammatePlaceholder")} value={name} onChange={(event) => { setName(event.target.value); setFieldErrors((current) => ({ ...current, name: undefined })); }} required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "invite-name-error" : undefined} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label htmlFor="invite-email">{t("auth.email")}</Label>
                <FieldHint id="invite-email-error" message={fieldErrors.email} />
              </div>
              <Input id="invite-email" className="h-10" type="email" placeholder="teammate@tetbit.studio" value={email} onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: undefined })); }} required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "invite-email-error" : undefined} />
            </div>
            <div className="border-t border-border pt-5">
              <Button className="w-full" type="submit" disabled={isInviting}>{isInviting ? <LoaderCircle className="animate-spin" /> : <Mail />}{isInviting ? t("common.sending") : t("settings.sendInvite")}</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex min-h-40 items-center justify-center border border-border"><div className="flex items-center gap-2 text-[13px] text-muted-foreground"><LoaderCircle className="size-4 animate-spin text-brand-accent" />{label}</div></div>;
}

function ErrorState({ title, error, onRetry }: { title: string; error: string; onRetry: () => void }) {
  return <div className="flex min-h-40 flex-col items-center justify-center border border-status-danger/30 px-6 text-center"><p className="text-[13px] font-medium text-status-danger">{title}</p><p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" size="sm" onClick={onRetry}><RefreshCw />Try again</Button></div>;
}
