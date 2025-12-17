"use client";

import { config } from "@/app/(external)/legal/config";
import { GradientContainer } from "@/components/complere/gradient";
import { Logo } from "@/components/complere/logo";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { ArrowRightIcon, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function Hero({ hasSession }: { hasSession: boolean }) {
  const { data: events } = api.events.list.useQuery();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const nextEvent = events?.entries[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <GradientContainer className="overflow-hidden rounded-3xl">
      <motion.div
        className="container p-2"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.header
          className="mt-0 flex items-center justify-between py-4 md:mt-2"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <Image
              src="/logo/logo-primary-resized.png"
              alt="Complēre Logo"
              width={166}
              height={32}
              // className="h-10 w-auto md:h-8"
            />
            {nextEvent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="hidden md:block"
              >
                <Link
                  href={nextEvent.event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 rounded-full bg-black/60 px-4 py-1 text-sm text-white hover:bg-black/80"
                >
                  Join the next beta onboarding session on{" "}
                  {new Date(nextEvent.event.start_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </Link>
              </motion.div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            <Link href="#about" className="text-sm font-medium">
              About
            </Link>
            <Link href="#toolkit" className="text-sm font-medium">
              Toolkit
            </Link>
            <Link href="#research" className="text-sm font-medium">
              Research
            </Link>
            <Link href="#resources" className="text-sm font-medium">
              Resources
            </Link>
            {hasSession ? (
              <Link href="/app">
                <Button effect="shineHover" variant="default">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div>
                <Link href={config.registerUrl}>
                  <Button effect="shineHover" variant="default">
                    Join Complēre Beta
                  </Button>
                </Link>
                <Link href={config.loginUrl}>
                  <Button effect="shineHover" variant="link">
                    Sign in
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="text-black"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </motion.header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white pt-16 md:hidden">
            <div className="flex h-full flex-col items-center justify-start space-y-8 p-8">
              <button
                className="absolute right-4 top-4"
                onClick={toggleMobileMenu}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
              <Logo />
              {nextEvent && (
                <Link
                  href={nextEvent.event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-black/60 px-4 py-1 text-sm text-white hover:bg-black/80"
                >
                  Join the next beta onboarding session on{" "}
                  {new Date(nextEvent.event.start_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </Link>
              )}
              <div className="flex flex-col items-center space-y-6">
                <Link
                  href="#about"
                  className="text-lg font-medium"
                  onClick={toggleMobileMenu}
                >
                  About
                </Link>
                <Link
                  href="#toolkit"
                  className="text-lg font-medium"
                  onClick={toggleMobileMenu}
                >
                  Toolkit
                </Link>
                <Link
                  href="#research"
                  className="text-lg font-medium"
                  onClick={toggleMobileMenu}
                >
                  Research
                </Link>
                <Link
                  href="#resources"
                  className="text-lg font-medium"
                  onClick={toggleMobileMenu}
                >
                  Resources
                </Link>
                <Link href={config.registerUrl} onClick={toggleMobileMenu}>
                  <Button effect="shineHover" variant="default">
                    Join Complēre Beta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Hero Content */}
        <motion.div className="mt-8 text-left lg:mt-32" variants={itemVariants}>
          <motion.h1
            className="font-bold tracking-tight"
            variants={itemVariants}
          >
            <div className="mb-4 text-2xl uppercase sm:text-xl md:text-2xl lg:text-3xl">
              Powered by AI
            </div>

            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              Built for Philanthropy
            </div>
          </motion.h1>
          <motion.div
            className="mt-4 text-base sm:mt-6 sm:text-lg md:text-xl"
            variants={itemVariants}
          >
            Complēre is your research, evaluation and reporting sidekick,
            delivering grounded insights, and designed to be questioned,
            challenged, and improved by experts like you.
          </motion.div>

          <motion.div
            className="mt-8 flex justify-start space-x-4 pb-12 sm:mt-10 lg:mt-12 lg:pb-20"
            variants={itemVariants}
          >
            {hasSession ? (
              <Link href="/app">
                <Button effect="shineHover" variant="default">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href={config.registerUrl}>
                <Button
                  effect="expandIcon"
                  icon={ArrowRightIcon}
                  iconPlacement="right"
                >
                  Join Beta
                </Button>
              </Link>
            )}
            <Link href="#about">
              <Button effect="shineHover" variant="outline">
                Learn more
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </GradientContainer>
  );
}
