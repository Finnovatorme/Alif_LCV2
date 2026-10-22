"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProductsPieChartProps {
  title?: string;
  data: Array<{ id: number; value: number; label: string }>;
}

export default function ProductsPieChart({ title = "Products", data }: ProductsPieChartProps) {
  const COLORS = ["#0ea5e9", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];
  const validData = data || [];
  
  // If all values are 0, show a gray donut instead of a blank space
  const hasData = validData.some((d) => d.value > 0);
  const pieData = hasData 
    ? validData 
    : [{ id: -1, label: "No Data", value: 1, isEmpty: true }];

  return (
    <Card className="flex flex-col h-full min-h-[220px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all duration-300 shadow-sm hover:shadow-md">
      <CardHeader className="p-0 pt-5 pb-2 items-center flex-none">
        <CardTitle className="text-sm font-bold text-gray-500 dark:text-gray-400 text-center tracking-wider uppercase">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 pb-5 pt-0 flex flex-col justify-start items-center px-4 w-full h-full">
        <div className="h-[80px] w-full flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={36}
                paddingAngle={hasData ? 2 : 0}
                dataKey="value"
                stroke="none"
                cornerRadius={hasData ? 4 : 0}
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isEmpty ? "#f1f5f9" : COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              {hasData && (
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)", fontSize: "12px", padding: "6px 12px" }}
                  itemStyle={{ color: "#333" }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1 w-full mt-2">
          {validData.map((item, index) => (
            <div key={index} className="flex items-center justify-between w-full text-[11px] leading-tight">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[90px]">
                  {item.label}
                </span>
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100 ml-1">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
