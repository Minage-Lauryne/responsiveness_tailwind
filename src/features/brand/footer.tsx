"use client";

import { NewsletterModal } from "@/components/newsletter-modal";
import { config } from "@/app/(external)/legal/config";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export function BrandFooter() {
  const [emailCopied, setEmailCopied] = useState(false);
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText("support@complere.ai");
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <>
      <footer className="rounded-t-xl bg-gray-900 py-8 text-white sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col items-center justify-between space-y-6 sm:space-y-0 md:flex-row">
            <div className="flex items-center">
              <Image
                src="/logo/logo-primary-white.png"
                alt="Complēre Logo"
                width={2940}
                height={567}
                className="h-10 w-auto md:h-16"
              />
              {/* <span className="ml-2 text-lg font-medium text-white sm:text-xl">
                Complere
              </span> */}
            </div>
            <div className="flex space-x-6">
              <Link
                href="https://www.linkedin.com/in/ryan-petersen-1a09493/"
                className="transform text-gray-400 transition-colors duration-200 hover:scale-110 hover:text-gray-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <div>
                <h3 className="mb-4 text-base font-bold text-gray-300 sm:text-lg">
                  Human-in-the-Loop Assurance Statement
                </h3>
                <div className="text-sm leading-relaxed text-gray-400 sm:text-base">
                  At Complēre.ai, we believe AI is a powerful tool—but not a
                  substitute for human judgment. All deep research questions are
                  reviewed by experienced subject matter experts, and all vetted
                  sources are curated by professionals who have spent decades
                  identifying the best available evidence, conducting
                  meta-analyses, and applying benefit-cost models to guide both
                  state and philanthropic budgets. Every part of Complēre has
                  been built by people with long-standing experience in
                  philanthropy and direct service nonprofit work—ensuring that
                  critical thinking, context, and community insight remain at
                  the core of every output.
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-base font-bold text-gray-300 sm:text-lg">
                  Research Integrity
                </h3>
                <div className="text-sm leading-relaxed text-gray-400 sm:text-base">
                  Complēre's core knowledge base is built on a foundation of
                  high-quality, peer-reviewed, and policy-relevant research
                  curated by experts with decades of experience in
                  evidence-based philanthropy, economic analysis, and direct
                  service. The studies we include reflect rigorous
                  standards—drawing from meta-analyses, longitudinal data, and
                  cost-benefit frameworks used by state agencies and leading
                  funders to guide investment decisions.
                </div>
                <div className="mt-4 text-sm leading-relaxed text-gray-400 sm:text-base">
                  Our database is continuously updated to reflect new findings,
                  and we welcome user contributions. Funders and practitioners
                  can recommend research for expert review and possible
                  inclusion—ensuring that Complēre remains a living resource
                  grounded in both community insight and the evolving evidence
                  base. We stand behind the integrity of the work we share, so
                  you can move from insight to action with confidence.
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="text-center sm:text-left">
                <h3 className="mb-4 text-base font-bold text-gray-300 sm:text-lg">
                  Contact
                </h3>
                <ul className="space-y-2 text-sm text-gray-400 sm:text-base">
                  <li className="flex items-center justify-center sm:justify-start">
                    <button
                      onClick={copyEmail}
                      className="group flex items-center space-x-2 transition-colors hover:text-white"
                    >
                      <span>
                        support@complere.ai {emailCopied && " Copied!"}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-4 w-4 transition-opacity ${
                          emailCopied
                            ? "text-green-400"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </li>
                </ul>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="mb-4 text-base font-bold text-gray-300 sm:text-lg">
                  Quick Links
                </h3>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li className="text-gray-400">
                    <Link
                      href="/legal/terms"
                      className="underline transition-colors hover:text-white"
                    >
                      Terms
                    </Link>
                  </li>
                  <li className="text-gray-400">
                    <Link
                      href="/legal/privacy"
                      className="underline transition-colors hover:text-white"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li className="text-gray-400">
                    <button
                      onClick={() => setNewsletterModalOpen(true)}
                      className="underline transition-colors hover:text-white"
                    >
                      Newsletter
                    </button>
                  </li>
                  <li className="text-gray-400">
                    <Link
                      href={config.registerUrl}
                      className="underline transition-colors hover:text-white"
                    >
                      Beta Sign Up
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-gray-400 sm:pt-8">
            <div className="text-xs sm:text-sm">
              © {year}
              {` `}
              Complere, LLC.
            </div>
          </div>
        </div>
      </footer>

      <NewsletterModal
        open={newsletterModalOpen}
        onOpenChange={setNewsletterModalOpen}
      />
    </>
  );
}
