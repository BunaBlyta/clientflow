import { Apple, Bell, PlayCircle, ReceiptText, Smartphone } from "lucide-react";

export function MobileAppSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">
            Track your project from your phone
          </h2>
          <p className="mt-2 max-w-md text-[14px] text-muted-foreground">
            Once your request is approved, the Clientflow app is where you pay, follow progress,
            leave notes, and get notified the moment something changes.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {[
              { icon: Smartphone, label: "Live project stage tracker" },
              { icon: ReceiptText, label: "Invoices and secure payment" },
              { icon: Bell, label: "Push notifications for every update" },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 text-[14px]">
                <item.icon className="size-4 text-brand-accent" />
                {item.label}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] text-muted-foreground">
              <Apple className="size-4" />
              App Store — coming soon
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] text-muted-foreground">
              <PlayCircle className="size-4" />
              Google Play — coming soon
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[280px]">
          <div className="rounded-[32px] border border-border bg-secondary/40 p-3">
            <div className="flex flex-col gap-3 rounded-[24px] bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">Marlowe &amp; Finch</span>
                <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[11px] font-medium text-brand-accent">
                  Design
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {["Discovery", "Design", "Development", "Review", "Launched"].map((stage, i) => (
                  <div
                    key={stage}
                    className={
                      i <= 1
                        ? "h-1.5 flex-1 rounded-full bg-brand-accent"
                        : "h-1.5 flex-1 rounded-full bg-muted"
                    }
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="font-medium text-status-success">Paid</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">Final payment</span>
                  <span className="font-medium text-muted-foreground">Not yet due</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
