import { CircleDot, CreditCard, MessageSquare, Rocket } from "lucide-react";

const steps = [
  {
    icon: CircleDot,
    title: "Request or scope",
    description: "Pick a fixed-price package and submit a request, or tell us about a custom build.",
  },
  {
    icon: CreditCard,
    title: "Approve & pay a deposit",
    description: "We review your request. Once approved, you pay a deposit through the mobile app to kick things off.",
  },
  {
    icon: MessageSquare,
    title: "Track & collaborate",
    description: "Watch your project move through Discovery, Design, Development, and Review — with notes both ways.",
  },
  {
    icon: Rocket,
    title: "Launch",
    description: "Pay the final invoice and we ship it. Every status change is logged, so nothing gets lost.",
  },
];

export function ProcessSection() {
  return (
    <section id="how-it-works" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">How it works</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            One path from a first request to a launched site — visible the whole way through.
          </p>
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title}>
              <div className="flex items-center gap-2 text-brand-accent">
                <step.icon className="size-4" />
                <span className="text-[13px] font-medium">Step {i + 1}</span>
              </div>
              <h3 className="mt-3 text-[15px] font-medium">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
