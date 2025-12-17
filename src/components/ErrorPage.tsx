'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Footer } from "@/features/dashboard-layout/footer";
import React from "react";

export default function ErrorPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };


  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative h-16 w-16">
              <Image src="/logo/logo-secondary.png" alt="Secondary Logo" width={64} height={64} />
            </div>
            <div className="relative h-24 w-24">
              <Image src="/logo/logo-primary.png" alt="Primary Logo" width={1123 / 8} height={400 / 8} />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Something went wrong
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {isLoggedIn
                ? "We couldn’t load the page. Try going back to the dashboard."
                : "We couldn’t load the page. Try reloading and logging in again."}
            </p>
          </div>

          {isLoggedIn ? (
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/app">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          ) : (
            <Button onClick={handleReload} variant="outline" size="lg" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reload
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
