"use client";

import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, TrendingUp } from "lucide-react";

interface CompletedFollowupChartProps {
  title?: string;
  total: number;
  max?: number;
}

export default function CompletedFollowupChart({
  title = "Completed Followup",
  total = 0,
}: CompletedFollowupChartProps) {
  // Smooth curve sparkline points leading to the total
  const sparkData = [
    { name: "Day 1", value: Math.max(0, Math.floor(total * 0.2)) },
    { name: "Day 2", value: Math.max(0, Math.floor(total * 0.35)) },
    { name: "Day 3", value: Math.max(0, Math.floor(total * 0.5)) },
    { name: "Day 4", value: Math.max(0, Math.floor(total * 0.7)) },
    { name: "Day 5", value: Math.max(0, Math.floor(total * 0.85)) },
    { name: "Day 6", value: total },
  ];

  return (
    <Card className="flex flex-col h-full min-h-[220px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden group">
      <CardHeader className="pb-0 pt-5 px-5 flex flex-row items-center justify-between flex-none">
        <CardTitle className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
          {title}
        </CardTitle>
        <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pb-4 pt-1 px-5">
        <div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {total}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              Active
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Successfully closed cases
          </p>
        </div>

        {/* Smooth Emerald Area Sparkline */}
        <div className="h-[75px] w-full mt-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "rgba(16, 185, 129, 0.95)",
                  color: "#ffffff",
                  fontSize: "11px",
                  padding: "4px 8px",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#completedGradient)"
                dot={{ r: 3, fill: "#10b981", strokeWidth: 1.5, stroke: "#ffffff" }}
                activeDot={{ r: 5, fill: "#059669" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
