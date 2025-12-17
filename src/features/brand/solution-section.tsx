"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Image from "next/image";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface SolutionProps {
  label: string;
  heading: string;
  description: string;
  features: FeatureItem[];
  image: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  imageOnLeft?: boolean;
  background?: "white" | "gray" | "gradient";
  id?: string;
}

export function Solution({
  label,
  heading,
  description,
  features,
  image,
  imageOnLeft = false,
  background = "white",
  id,
}: SolutionProps) {
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

  const featureVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const getBgClass = () => {
    switch (background) {
      case "gray":
        return "bg-gray-50";
      case "gradient":
        return "bg-gradient-to-b from-blue-50 to-white";
      default:
        return "bg-white";
    }
  };

  return (
    <section id={id} className={`${getBgClass()} py-4 md:py-24`}>
      <motion.div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          <motion.div
            className={`order-1 flex items-center justify-center ${
              imageOnLeft ? "lg:order-1" : "lg:order-2"
            }`}
            variants={itemVariants}
          >
            <div className="flex h-full w-full items-center justify-center rounded-lg">
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="h-full w-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            className={`order-2 space-y-4 sm:space-y-8 ${
              imageOnLeft ? "lg:order-2" : "lg:order-1"
            }`}
            variants={itemVariants}
          >
            <motion.div
              className="inline-block rounded-full bg-white px-3 py-1 text-sm font-medium text-black shadow-sm ring-1 ring-inset ring-blue-200"
              variants={itemVariants}
            >
              {label}
            </motion.div>
            <motion.h2
              className="text-4xl font-bold tracking-tight text-slate-900"
              variants={itemVariants}
            >
              {heading}
            </motion.h2>
            <motion.div className="text-lg" variants={itemVariants}>
              {description}
            </motion.div>

            <motion.div
              className="space-y-4 pt-4 sm:space-y-6 sm:pt-6"
              variants={sectionVariants}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex gap-4"
                  variants={featureVariants}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-transparent">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">{feature.title}</div>
                    <div className="text-slate-700">{feature.description}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
