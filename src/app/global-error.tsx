"use client";

import Error from "next/error";
import Link from "next/link";
import { useEffect } from "react";
import { getBaseUrl } from "@/trpc/shared";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
  console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="flex h-screen flex-col items-center justify-center space-y-4">
        <Link
          href={`${getBaseUrl()}/app`}
          className="absolute left-1/2 top-2 -translate-x-1/2 text-gray-400 underline"
        >
          Go back to Complēre
        </Link>
        <Error
          statusCode={500}
          title="An unexpected error has occurred"
          {...error}
        />
      </body>
    </html>
  );
}
