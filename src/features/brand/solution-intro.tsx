"use client";

import { motion } from "framer-motion";
import { Heading, Subheading } from "./text";
import Image from "next/image";

export function SolutionIntro() {
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="bg-[#e9f8fd] py-2 ">
      <motion.div
        id="about"
        className="container p-2"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <motion.div className="my-4 space-y-6 sm:my-20" variants={itemVariants}>
          <Subheading>
            <div className="flex items-center gap-2">Meet</div>
          </Subheading>
          <Heading>
            <Image
              src="/logo/logo-primary-332x64.png"
              alt="Complēre Logo"
              width={332}
              height={64}
              // className="h-10 w-auto md:h-8"
            />
          </Heading>
          <motion.div className="max-w-prose text-lg" variants={itemVariants}>
            Complēre is designed by experienced philanthropic and nonprofit
            leaders specifically to inform critical funding decisions. Complēre
            allows you to search, organize and 'interact with' vetted research,
            launch deep thinking projects, and inform your strategic thinking
            processes.
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
