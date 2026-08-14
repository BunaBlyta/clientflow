import Image from "next/image";

export function BrandLogo() {
  return (
    <span className="relative size-7 shrink-0 overflow-hidden" aria-hidden="true">
      <Image
        src="/light-logo.png"
        alt=""
        width={30}
        height={30}
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
