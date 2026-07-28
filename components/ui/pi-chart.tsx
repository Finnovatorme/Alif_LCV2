"use client";

import { Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A simple pie chart";

const chartData = [
  { browser: "murahabaConsumable", visitors: 5, fill: "#2563eb" }, // dark blue
  { browser: "murahabaService", visitors: 5, fill: "#3b82f6" }, // normal blue
  { browser: "tawarruq", visitors: 80, fill: "#60a5fa" }, // light blue
  { browser: "ijarah", visitors: 10, fill: "#93c5fd" }, // very light blue
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  murahabaConsumable: {
    label: "Murahaba Consumable",
    dotClass: "bg-[#2563eb] border-[#2563eb]",
    legendClass: "bg-[#2563eb]",
  },
  murahabaService: {
    label: "Murahaba Service",
    dotClass: "bg-[#3b82f6] border-[#3b82f6]",
    legendClass: "bg-[#3b82f6]",
  },
  tawarruq: {
    label: "Tawarruq",
    dotClass: "bg-[#60a5fa] border-[#60a5fa]",
    legendClass: "bg-[#60a5fa]",
  },
  ijarah: {
    label: "Ijarah",
    dotClass: "bg-[#93c5fd] border-[#93c5fd]",
    legendClass: "bg-[#93c5fd]",
  },
} satisfies ChartConfig;

export function ChartPieSimple() {
  return (
    <Card className="flex flex-col h-full bg-[#fafafa] dark:bg-[#161616] border-none shadow-none">
      <CardHeader className="items-center pb-0 text-center">
        <CardTitle className="text-2xl font-bold">Products</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex items-center justify-center pb-4 pt-4">
        <div className="flex flex-row items-center gap-6">
          <ChartContainer config={chartConfig} className="w-30 h-30">
            <PieChart width={120} height={120}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="visitors"
                nameKey="browser"
                innerRadius={0}
                outerRadius={60}
                stroke="none"
              />
            </PieChart>
          </ChartContainer>

          <div className="flex flex-col gap-1 text-[11px] font-medium text-gray-700 dark:text-gray-300">
            {chartData.map((item) => (
              <div key={item.browser} className="flex items-center gap-1.5 h-3">
                <div
                  className="w-2.5 h-2.5 rounded-[1px] shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="leading-none tracking-tight">
                  {chartConfig[item.browser as keyof typeof chartConfig].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
