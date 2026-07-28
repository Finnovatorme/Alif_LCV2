"use client";
import { motion } from "framer-motion";

export default function LoginBackgroundSvg() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <svg className="absolute inset-0 w-full h-full">
        {[...Array(12)].map((_, i) => (
          <motion.circle
            key={i}
            cx={Math.random() * 1200}
            cy={Math.random() * 1000}
            r={1.4 + Math.random() * 3.5}
            fill="#3a8bc9"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.7 + Math.random() * 0.15, 0.35],
              y: [0, -60 - Math.random() * 120, 0],
              x: [0, (Math.random() - 0.5) * 100, 0],
            }}
            transition={{
              duration: 12 + Math.random() * 14,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 0.7 + Math.random() * 2,
            }}
          />
        ))}
      </svg>

      <motion.div
        className="absolute left-[8%] top-[10%] w-40 h-48 rounded-full
             bg-linear-to-br from-[#5ab8e9]/40 via-[#3a8bc9]/20 to-transparent
             blur-3xl"
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.5, 0.75, 0.5],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute left-[18%] bottom-[15%] w-100 h-100 rounded-full 
                   bg-linear-to-tr from-[#3481c0]/35 via-[#5ab8e9]/15 to-transparent 
                   blur-3xl"
        animate={{
          scale: [1, 1.22, 1],
          opacity: [0.45, 0.68, 0.45],
          x: [0, -40, 0],
          y: [0, 35, 0],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />

      <motion.svg
        viewBox="0 0 180 180"
        className="absolute left-2 top-24 w-64 h-72 opacity-75 "
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5ab8e9" />
            <stop offset="50%" stopColor="#3a8bc9" />
            <stop offset="100%" stopColor="#2c6fa8" />
          </linearGradient>
        </defs>

        <circle
          cx="90"
          cy="90"
          r="78"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="4"
          strokeDasharray="6 14"
          opacity={0.85}
        />

        <circle
          cx="90"
          cy="90"
          r="58"
          fill="none"
          stroke="#5ab8e9"
          strokeWidth="3"
          opacity={0.35}
        />
      </motion.svg>

      <motion.div
        className="absolute left-[14%] top-[18%] w-4 h-4 rounded-full bg-white/70 
                   shadow-[0_0_20px_#3a8bc9cc] blur-sm"
        animate={{ scale: [1, 1.9, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute left-[28%] top-[32%] w-3 h-3 rounded-full bg-white/60 
                   shadow-[0_0_16px_#3481c0cc] blur-sm"
        animate={{ scale: [1, 1.7, 1], opacity: [0.45, 0.9, 0.45] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
    </div>
  );
}
