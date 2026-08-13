"use client";

import type { MouseEvent } from "react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const subscribeToNothing = () => () => {};
const getLocalDevelopmentSnapshot = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const getServerSnapshot = () => false;

export function MobileReturnAction({
  href,
  fallbackHref,
  expoWebHref,
}: {
  href: string;
  fallbackHref: string;
  expoWebHref: string;
}) {
  const [openFailed, setOpenFailed] = useState(false);
  const isLocalDevelopment = useSyncExternalStore(
    subscribeToNothing,
    getLocalDevelopmentSnapshot,
    getServerSnapshot,
  );

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
      {isLocalDevelopment && (
        <Button
          variant="secondary"
          nativeButton={false}
          render={<a href={expoWebHref} />}
        >
          Open Expo web app
        </Button>
      )}
      {openFailed && (
        <p className="text-[12px] text-status-warning" role="status">
          Clientflow did not open here. Continue in the browser instead.
        </p>
      )}
    </div>
  );
}
