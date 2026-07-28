"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import * as React from "react";

export function GradualSpacing({ text = "Gradual Spacing" }: { text: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <div className="flex space-x-1 justify-center ml-8">
      <AnimatePresence>
        {text.split("").map((char, i) => (
          <motion.p
            ref={ref}
            key={i}
            initial={{ opacity: 0, x: -18 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            exit="hidden"
            transition={{ duration: 0.9, delay: i * 0.1 }}
            className="text-xl text-center sm:text-4xl font-bold tracking-tighter md:text-5xl md:leading-16 text-[#3481c0] dark:text-[#53a4e2] "
          >
            {char === " " ? <span>&nbsp;</span> : char}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}
