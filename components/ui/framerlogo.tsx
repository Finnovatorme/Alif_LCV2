"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function MotionLogo() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.6,
        rotate: -10,
        y: -10,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: 0,
        y: 0,
      }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1], // smooth spring-like
      }}
      // whileHover={{
      //   scale: 1.08,
      //   rotate: 2,
      // }}
      className="flex items-center"
    >
      <Image
        src="/assets/FULL-LOGO.png"
        alt="Logo"
        width={64}
        height={64}
        className="object-contain"
        priority
      />
    </motion.div>
  );
}
