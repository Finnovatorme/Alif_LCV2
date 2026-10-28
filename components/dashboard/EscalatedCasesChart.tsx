"use client";

import React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface EscalatedCasesChartProps {
  title?: string;
  total: number;
  max?: number;
}

export default function EscalatedCasesChart({
  title = "Escalated Cases",
  total = 0,
}: EscalatedCasesChartProps) {
  // Column distribution data highlighting the current escalations
  const barData = [
    { label: "Low", value: 0 },
    { label: "Medium", value: Math.max(0, total - 1) },
    { label: "High", value: total },
    { label: "Critical", value: 0 },
    { label: "Review", value: Math.max(1, total) },
  ];

  return (
    <Card className="flex flex-col h-full min-h-[220px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden group">
      <CardHeader className="pb-0 pt-5 px-5 flex flex-row items-center justify-between flex-none">
        <CardTitle className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
          {title}
        </CardTitle>
        <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pb-4 pt-1 px-5">
        <div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {total}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              High Priority
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Requires immediate review
          </p>
        </div>

        {/* Modern Rounded Vertical Bar Columns */}
        <div className="h-[75px] w-full mt-2 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "rgba(244, 63, 94, 0.95)",
                  color: "#ffffff",
                  fontSize: "11px",
                  padding: "4px 8px",
                  boxShadow: "0 4px 12px rgba(244, 63, 94, 0.25)",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Bar dataKey="value" radius={[6, 6, 2, 2]} maxBarSize={18}>
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.value > 0 ? "url(#roseGradient)" : "#f1f5f9"}
                    className={entry.value === 0 ? "dark:fill-gray-800" : ""}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
