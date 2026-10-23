"use client";
import React, { useEffect, useState } from "react";
import axios from "@/utils/axios";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface HorizontalBarChartProps {
  title: string;
}

export default function HorizontalBarChartComponent({ title }: HorizontalBarChartProps) {
  const language = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const resolvedUserId = user?.UserId || user?.userId || user?.Userid;
      if (!resolvedUserId) return;
      const hostUrl = process.env.HOST_API_KEY;
      const response = await axios.get(
        `${hostUrl}/api/Dashboard/get-DashboardCollectionPerformance`,
        {
          params: { UserID: resolvedUserId, language },
        }
      );

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const item = response.data[0];
        setChartData([
          { name: "Fully Paid", value: item.FULLYPAID || 0 },
          { name: "Partially Paid", value: item.PARTIALPAID || 0 },
          { name: "Not Paid", value: item.NOTPAID || 0 },
        ]);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error("API error:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, language]);

  return (
    <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-300 hover:shadow-md h-full">
      <Card className="flex flex-col h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] border-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
        <CardHeader className="pb-4 pt-8">
          <CardTitle className="text-center text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-6 px-4 lg:px-8">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  cursor={{ fill: "rgba(15, 142, 221, 0.05)" }}
                />
                <Bar dataKey="value" fill="url(#colorUvHoriz)" radius={[0, 6, 6, 0]} barSize={20} />
                <defs>
                  <linearGradient id="colorUvHoriz" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
