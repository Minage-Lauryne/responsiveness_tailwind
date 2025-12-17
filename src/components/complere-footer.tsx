"use client";

import Image from "next/image";
import Link from "next/link";

export function ComplereFooter({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <footer
        className={`${className} items-left bottom-0 left-0 my-0 flex w-full items-center justify-between border-t border-gray-200 bg-white px-4 py-0 align-middle`}
      >
        <div className="flex items-center">
          <Link href="/">
            <Image
              priority
              src="/logo/logo-primary.png"
              alt="Complēre"
              className="h-auto w-auto"
              width={1123 / 25}
              height={400 / 25}
            />
          </Link>
          <div className="ml-4 flex flex-col">
            <span className="">
              ©{` `}
              {new Date().getFullYear()}
              {` `}
            </span>
          </div>
        </div>

        {children}
      </footer>
    </>
  );
}
