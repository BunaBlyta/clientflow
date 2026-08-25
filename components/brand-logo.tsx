import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ variant = "default" }: { variant?: "default" | "crm" }) {
  const isCrm = variant === "crm";

  return (
    <span className={cn(
      "relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-sm",
      isCrm && "bg-transparent",
    )} aria-hidden="true">
      <Image
        src={isCrm ? "/crm-light-logo-grey.png?v=transparent" : "/light-logo.png"}
        alt=""
        width={30}
        height={30}
        unoptimized={isCrm}
        className="size-7 object-cover dark:hidden"
      />
      <Image
        src="/dark-logo.png"
        alt=""
        width={30}
        height={30}
        className="hidden size-7 object-cover dark:block"
      />
    </span>
  );
}
