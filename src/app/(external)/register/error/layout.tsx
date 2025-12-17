import Image from "next/image";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container prose mx-auto w-[4/5] p-4 text-center ">
      <Link href="/app">
        <Image
          src="/logo/logo-primary.png"
          alt="Complēre"
          width={1123 / 8}
          height={400 / 8}
        />
      </Link>
      {children}
    </div>
  );
}
