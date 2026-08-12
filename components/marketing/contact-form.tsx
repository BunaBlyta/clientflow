export function ContactForm() {
  return (
    <section id="contact" className="border-t border-border">
      <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">Custom web app build</h2>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Every custom build starts with a conversation. Tell us what you&apos;re building and we&apos;ll
          reach out to scope it — pricing and timeline follow from there.
        </p>
        <p className="mt-8 text-[14px] text-muted-foreground">
          Online submission isn&apos;t wired up yet. Email us at{" "}
          <a
            href="mailto:buna@tetbit.studio?subject=Custom%20web%20app%20build%20inquiry"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-brand-accent"
          >
            buna@tetbit.studio
          </a>{" "}
          to start the conversation.
        </p>
      </div>
    </section>
  );
}
