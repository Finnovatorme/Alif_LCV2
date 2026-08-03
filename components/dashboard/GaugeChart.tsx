"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GaugeChartProps {
  title: string;
  total: number;
  chartData: number; // Represents the max value
}

export default function GaugeChart({ title, total, chartData }: GaugeChartProps) {
  // Ensure chartData is at least equal to total so the gauge doesn't overflow
  const max = Math.max(total, chartData, 1);
  const data = [
    { name: "Value", value: total },
    { name: "Remaining", value: max - total },
  ];

  const COLORS = ["url(#gaugeGradient)", "#f1f5f9"];

  return (
    <Card className="flex flex-col h-full min-h-[220px] bg-white dark:bg-gray-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
      <CardHeader className="pb-0 pt-6 items-center flex-none">
        <CardTitle className="text-sm font-bold text-gray-500 dark:text-gray-400 text-center tracking-wider uppercase">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 relative flex flex-col justify-end items-center pb-8">
        <div className="absolute inset-0 flex flex-col justify-end items-center bottom-8">
          <div className="h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={5}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="text-3xl font-extrabold text-gray-900 dark:text-white z-10 mt-auto pt-[80px]">
          {total}
        </div>
      </CardContent>
    </Card>
  );
}
