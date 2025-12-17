"use client";

import { config } from "@/app/(external)/legal/config";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export function CTA() {
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

  return (
    <section className="bg-white py-12 sm:py-20">
      <motion.div
        className="mx-auto max-w-3xl p-10 text-center text-black"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        <motion.h2 className="mb-6 text-3xl font-bold" variants={itemVariants}>
          Ready to transform your foundation's impact?
        </motion.h2>
        <motion.div className="mb-8 text-lg" variants={itemVariants}>
          Join foundation professionals already using Complēre to enhance their
          grantmaking, evaluation, and strategic planning processes.
        </motion.div>
        <motion.div
          className="flex justify-center space-x-4"
          variants={itemVariants}
        >
          <Link href={config.registerUrl}>
            <Button variant={"default"}>Join Beta</Button>
          </Link>
          {/* <Button
            variant="outline"
            className="rounded-full border-white px-8 py-6 text-white hover:bg-white/10"
          >
            Schedule a Demo
          </Button> */}
        </motion.div>
      </motion.div>
    </section>
  );
}
