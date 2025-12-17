import { GradientContainer } from "@/components/complere/gradient";
import { Logo } from "@/components/complere/logo";
import { ArrowRightIcon } from "lucide-react";
import { headers as getHeaders } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MarketingPanel } from "@/components/complere/marketing-panel";
import { AIDisclaimer } from "@/components/complere/ai-disclaimer";

export default async function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (session?.user.name) {
    return redirect("/app");
  }
  if (session) {
    return redirect("/onboarding");
  }

  return (
    <div className="flex h-screen w-full">
      <div className="flex w-full max-w-md flex-col justify-between px-4 md:mt-[160px] lg:max-w-2xl">
        <div className="flex flex-col items-center ">
          <Link href="/" className="mb-6 cursor-pointer hover:opacity-80">
            <Logo />
          </Link>
          <div className="mb-6 w-full">{children}</div>
          <p className="text-center text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link
              href="/legal/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <AIDisclaimer />
      </div>

      <MarketingPanel />
    </div>
  );
}
