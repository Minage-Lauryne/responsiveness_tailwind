import Link from "next/link";
import Image from "next/image";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container prose mx-auto w-[4/5] p-4 text-justify">
      <Link href="/">
        {/*               // 1123 × 400 original, so: */}
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
