"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart as PieIcon } from "lucide-react";

interface ProductsPieChartProps {
  title?: string;
  data: Array<{ id: number; value: number; label: string }>;
}

export default function ProductsPieChart({ title = "FollowUps", data }: ProductsPieChartProps) {
  // Consistent color mapping for each category
  const STATUS_COLORS: Record<string, string> = {
    Pending: "#3b82f6",
    Completed: "#10b981",
    Escalated: "#f43f5e",
  };

  const validData = data || [];
  const totalCount = validData.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const hasData = validData.some((d) => d.value > 0);

  const pieData = hasData
    ? validData
    : [{ id: -1, label: "No Data", value: 1, isEmpty: true }];

  return (
    <Card className="flex flex-col h-full min-h-[220px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden group">
      <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between flex-none">
        <CardTitle className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
          {title}
        </CardTitle>
        <div className="w-7 h-7 rounded-full bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
          <PieIcon className="w-3.5 h-3.5" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pb-4 pt-1 px-5">
        <div className="relative h-[90px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={40}
                paddingAngle={hasData ? 3 : 0}
                dataKey="value"
                stroke="none"
                cornerRadius={hasData ? 4 : 0}
              >
                {pieData.map((entry: any, index: number) => {
                  const color =
                    STATUS_COLORS[entry.label] ||
                    ["#3b82f6", "#10b981", "#f43f5e", "#8b5cf6"][index % 4];
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isEmpty ? "#f1f5f9" : color}
                      className={entry.isEmpty ? "dark:fill-gray-800" : ""}
                    />
                  );
                })}
              </Pie>
              {hasData && (
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    fontSize: "11px",
                    padding: "6px 12px",
                    backgroundColor: "#1e293b",
                    color: "#ffffff",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-black text-gray-900 dark:text-white leading-none">
              {totalCount}
            </span>
            <span className="text-[9px] font-medium text-gray-400">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1 w-full mt-1">
          {validData.map((item, index) => {
            const color =
              STATUS_COLORS[item.label] ||
              ["#3b82f6", "#10b981", "#f43f5e", "#8b5cf6"][index % 4];
            return (
              <div
                key={index}
                className="flex items-center justify-between w-full text-[11px] leading-tight"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[95px]">
                    {item.label}
                  </span>
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100 ml-1">
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
