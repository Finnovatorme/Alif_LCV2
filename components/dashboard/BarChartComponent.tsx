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

interface BarChartProps {
  title: string;
  data?: any;
}

export default function BarChartComponent({ title, data }: BarChartProps) {
  const language = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const [chartData, setChartData] = useState<any[]>([]);

  const processData = (rawData: any) => {
    if (!rawData) return;
    const resolved = rawData?.data || rawData;
    if (Array.isArray(resolved) && resolved.length > 0) {
      const formattedData = resolved.map((item: any) => ({
        name: item.LCALLOCATIONGROUP || item.name || "",
        value: item.CUSTOMERSCOUNT || item.value || 0,
      }));
      setChartData(formattedData);
    } else if (resolved?.PENDING_FOLLOWUP || resolved?.COMPLETE_FOLLOWUP || resolved?.ESCALATED_CASES) {
      const allCases = [
        ...(resolved.PENDING_FOLLOWUP || []),
        ...(resolved.COMPLETE_FOLLOWUP || []),
        ...(resolved.ESCALATED_CASES || []),
      ];
      const counts: Record<string, number> = {};
      allCases.forEach((item: any) => {
        const group = item.LCALLOCATIONGROUP || "Unassigned";
        counts[group] = (counts[group] || 0) + 1;
      });
      const formattedData = Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }));
      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  };

  const fetchChartData = async () => {
    try {
      const resolvedUserId = user?.UserId || user?.userId || user?.Userid;
      if (!resolvedUserId) return;
      const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
      const response = await axios.get(
        `${hostUrl}/api/Dashboard`,
        {
          params: { UserID: resolvedUserId, language },
        }
      );
      processData(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (data) {
      processData(data);
    } else if (user) {
      fetchChartData();
    }
  }, [data, user, language]);

  return (
    <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-300 hover:shadow-md h-full">
      <Card className="flex flex-col h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] border-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
        <CardHeader className="pb-4 pt-8">
          <CardTitle className="text-center text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-6 px-4 lg:px-8">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  cursor={{ fill: "rgba(15, 142, 221, 0.05)" }}
                />
                <Bar dataKey="value" fill="url(#colorUv)" radius={[6, 6, 0, 0]} barSize={40} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.9} />
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
