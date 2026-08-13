"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MobileReturnAction({
  href,
  fallbackHref,
}: {
  href: string;
  fallbackHref: string;
}) {
  const [openFailed, setOpenFailed] = useState(false);

  function handleOpen(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setOpenFailed(false);

    let timeoutId: number | undefined;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    try {
      window.location.assign(href);
      timeoutId = window.setTimeout(() => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (document.visibilityState === "visible") setOpenFailed(true);
      }, 1500);
    } catch {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setOpenFailed(true);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button nativeButton={false} render={<a href={href} onClick={handleOpen} />}>
        Return to app
      </Button>
      <p className="max-w-sm text-[12px] leading-relaxed text-muted-foreground">
        If nothing happens, this browser cannot open the Clientflow app link. You need
        a native Clientflow build installed; Expo web cannot handle this link. You can
        <a className="ml-1 text-foreground underline underline-offset-2" href={fallbackHref}>
          continue in the browser
        </a>
        .
      </p>
      {openFailed && (
        <p className="text-[12px] text-status-warning" role="status">
          Clientflow did not open here. Continue in the browser instead.
        </p>
      )}
    </div>
  );
}
