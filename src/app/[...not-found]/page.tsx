import Image from "next/image";
import Link from "next/link";
import { getBaseUrl } from "@/trpc/shared";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/features/dashboard-layout/footer";

export default function NotFoundPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="relative h-20 w-20">
            <Image
              src="/logo/logo-secondary.png" 
              alt="Complere Secondary Logo"
              width={64}
              height={64}
            />
          </div>
          <div className="relative h-24 w-24">
            <Image
              src="/logo/logo-primary.png"
              alt="Complere"
              width={1123 / 8}
              height={400 / 8}
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              404: Page not found
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Sorry, we couldn't find the page you're looking for.
            </p>
          </div>

          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href={`${getBaseUrl()}/app`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
