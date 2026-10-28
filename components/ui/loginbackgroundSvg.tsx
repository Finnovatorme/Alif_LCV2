"use client";
import { motion } from "framer-motion";

const PARTICLES = [
  { cx: 120, cy: 150, r: 2.5, opacity: 0.75, y: -80, x: 25, duration: 16, delay: 0.5 },
  { cx: 340, cy: 420, r: 3.2, opacity: 0.82, y: -120, x: -30, duration: 22, delay: 1.2 },
  { cx: 580, cy: 230, r: 1.8, opacity: 0.70, y: -70, x: 40, duration: 18, delay: 2.1 },
  { cx: 720, cy: 680, r: 4.1, opacity: 0.85, y: -150, x: -20, duration: 24, delay: 2.8 },
  { cx: 890, cy: 310, r: 2.2, opacity: 0.72, y: -90, x: 35, duration: 15, delay: 3.5 },
  { cx: 1050, cy: 540, r: 3.8, opacity: 0.80, y: -110, x: -45, duration: 20, delay: 4.1 },
  { cx: 210, cy: 750, r: 2.0, opacity: 0.68, y: -65, x: 15, duration: 17, delay: 4.8 },
  { cx: 450, cy: 890, r: 4.5, opacity: 0.84, y: -140, x: -35, duration: 25, delay: 5.4 },
  { cx: 670, cy: 120, r: 1.6, opacity: 0.74, y: -85, x: 30, duration: 19, delay: 6.0 },
  { cx: 820, cy: 820, r: 3.0, opacity: 0.78, y: -100, x: -25, duration: 21, delay: 6.7 },
  { cx: 960, cy: 190, r: 2.7, opacity: 0.81, y: -130, x: 40, duration: 23, delay: 7.3 },
  { cx: 1120, cy: 780, r: 3.5, opacity: 0.76, y: -95, x: -15, duration: 14, delay: 8.0 },
];

export default function LoginBackgroundSvg() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <svg className="absolute inset-0 w-full h-full">
        {PARTICLES.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill="#3a8bc9"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, p.opacity, 0.35],
              y: [0, p.y, 0],
              x: [0, p.x, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: p.delay,
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
