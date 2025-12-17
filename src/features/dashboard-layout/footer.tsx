import Link from "next/link";
import React from "react";

export const footerLinks = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  // {
  //   href: "/legal/fulfillment",
  //   label: "Fulfillment, Payment, and Refund Policy",
  // },
] as const;

export function Footer() {
  return (
    <div className="z-20 w-full bg-transparent shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 flex h-14 items-center gap-x-4 md:mx-8">
        <p className="text-left text-xs leading-loose text-muted-foreground md:text-sm">
          © {new Date().getFullYear()} Complere, LLC
        </p>
        {footerLinks.map((link) => (
          <React.Fragment key={link.href}>
            |
            <Link
              href={link.href}
              target="_blank"
              className="text-xs leading-loose text-muted-foreground underline md:text-sm"
            >
              {link.label}
            </Link>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
