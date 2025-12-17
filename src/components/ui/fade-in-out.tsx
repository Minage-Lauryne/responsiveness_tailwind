"use client";

import { AnimatePresence, motion } from "framer-motion";

export function FadeInOut({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={"hidden"}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
