import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, var(--brand-sky-light) 0%, transparent 70%), radial-gradient(40% 40% at 85% 10%, var(--brand-sky) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 pb-20 text-center sm:px-6 sm:pt-32 sm:pb-28">
        <span className="rounded-full border border-border bg-background px-3 py-1 text-[13px] font-medium text-muted-foreground">
          Web design &amp; development studio
        </span>
        <h1 className="mt-6 text-[32px] leading-[1.15] font-semibold tracking-tight text-balance">
          A clear path from request to launch — and everything after.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground text-balance">
          Pick a package, tell us about your project, and track it from a first
          conversation to a live site — all in one place, with a mobile app that
          keeps you posted along the way.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" render={<a href="#packages" />}>
            See packages
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" render={<a href="#contact" />}>
            Talk to us about a custom build
          </Button>
        </div>
      </div>
    </section>
  );
}
