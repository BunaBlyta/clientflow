"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { currentStaffUser } from "@/lib/mock-data";
import { formatCurrency, initials } from "@/lib/format";
import { EditPackageDialog } from "@/components/dashboard/edit-package-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">Settings</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Manage service packages, your team, and business details.
        </p>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="profile">Business profile</TabsTrigger>
        </TabsList>
        <TabsContent value="packages" className="mt-4">
          <PackagesSection />
        </TabsContent>
        <TabsContent value="team" className="mt-4">
          <TeamSection />
        </TabsContent>
        <TabsContent value="profile" className="mt-4">
          <BusinessProfileSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PackagesSection() {
  const packages = useAppStore((s) => s.packages);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground">
        The single source of truth for the public pricing page and internal project creation.
      </p>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {packages.map((pkg) => (
          <div key={pkg.id} className="flex items-start justify-between gap-4 p-5">
            <div>
              <p className="text-[14px] font-medium">{pkg.name}</p>
              <p className="mt-1 max-w-md text-[13px] text-muted-foreground">{pkg.description}</p>
              <p className="mt-2 text-[13px]">
                {pkg.isCustom ? "Custom pricing" : formatCurrency(pkg.priceCents!)} ·{" "}
                {pkg.turnaroundDays}-day turnaround · {pkg.features.length} features
              </p>
            </div>
            <EditPackageDialog pkg={pkg} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamSection() {
  const inviteStaff = useAppStore((s) => s.inviteStaff);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    inviteStaff(email.trim());
    toast.success("Invitation sent", { description: `${email} can now set up their account.` });
    setEmail("");
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border">
        <div className="flex items-center gap-2.5 p-4">
          <Avatar className="size-7">
            <AvatarFallback className="text-[11px]">{initials(currentStaffUser.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[13px] font-medium">{currentStaffUser.name}</p>
            <p className="text-[12px] text-muted-foreground">{currentStaffUser.email}</p>
          </div>
          <span className="ml-auto text-[12px] text-muted-foreground">You</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-[15px] font-medium">Invite a teammate</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            They&apos;ll get an email to set a password and join the dashboard.
          </p>
        </div>
        <form onSubmit={handleInvite} className="flex max-w-sm items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="teammate@tetbit.studio"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            <Mail />
            Send invite
          </Button>
        </form>
      </div>
    </div>
  );
}

function BusinessProfileSection() {
  const [studioName, setStudioName] = useState("Clientflow Studio");
  const [supportEmail, setSupportEmail] = useState(currentStaffUser.email);
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Business profile saved");
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="studioName">Studio name</Label>
        <Input id="studioName" value={studioName} onChange={(e) => setStudioName(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="supportEmail">Support email</Label>
        <Input
          id="supportEmail"
          type="email"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Button type="submit" className="mt-2 self-start">
        Save changes
      </Button>
    </form>
  );
}
