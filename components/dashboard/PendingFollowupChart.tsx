"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock } from "lucide-react";

interface PendingFollowupChartProps {
  title?: string;
  total: number;
  max?: number;
}

export default function PendingFollowupChart({
  title = "Pending Followup",
  total = 0,
  max = 20,
}: PendingFollowupChartProps) {
  const safeMax = Math.max(max, total, 1);
  const percentage = Math.min(Math.round((total / safeMax) * 100), 100);

  // SVG circular progress calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <Card className="flex flex-col h-full min-h-[220px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden group">
      <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between flex-none">
        <CardTitle className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
          {title}
        </CardTitle>
        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Clock className="w-3.5 h-3.5" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center pb-5 pt-1 px-4">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="none"
              className="text-gray-100 dark:text-gray-800"
            />
            {/* Animated progress ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="url(#pendingGradient)"
              strokeWidth="7"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">
              {total}
            </span>
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
              of {safeMax}
            </span>
          </div>
        </div>
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          {percentage}% in progress
        </div>
      </CardContent>
    </Card>
  );
}
