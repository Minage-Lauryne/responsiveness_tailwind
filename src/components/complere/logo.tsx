import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-pretty text-xl tracking-tighter text-gray-950 data-[dark]:text-white">
      <Image
        src="/logo/logo-primary.png"
        alt="Complēre Logo"
        width={2940}
        height={567}
        className="h-10 w-auto md:h-16"
      />
    </div>
  );
}
