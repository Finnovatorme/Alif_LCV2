"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A radial chart with stacked sections";

const chartData = [{ month: "january", desktop: 1260, mobile: 570 }];

const chartConfig = {
  desktop: {
    label: "Desktop",
    dotClass: "bg-[#3b82f6] border-[#3b82f6]",
    legendClass: "bg-[#3b82f6]",
  },
  mobile: {
    label: "Mobile",
    dotClass: "bg-[#22c55e] border-[#22c55e]",
    legendClass: "bg-[#22c55e]",
  },
} satisfies ChartConfig;

export function ChartRadialStacked() {
  const totalVisitors = chartData[0].desktop + chartData[0].mobile;

  return (
    <Card className="flex flex-col bg-[#fafafa] dark:bg-[#161616]">
      <CardHeader className="items-center pb-0 text-center">
        <CardTitle className="text-2xl font-bold">My Queue</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-h-37.5 max-w-37.5"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={70}
            outerRadius={90}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 12}
                          className="fill-foreground text-xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 2}
                          className="fill-muted-foreground text-sm"
                        >
                          Visitors
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </PolarRadiusAxis>

            <RadialBar
              dataKey="desktop"
              stackId="a"
              cornerRadius={5}
              fill="#3b82f6"
              className="stroke-transparent stroke-2"
            />

            <RadialBar
              dataKey="mobile"
              stackId="a"
              cornerRadius={5}
              fill="#22c55e"
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
