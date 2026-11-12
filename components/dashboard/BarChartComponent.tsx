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
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

interface BarChartProps {
  title: string;
  data?: any;
}

export default function BarChartComponent({ title, data }: BarChartProps) {
  const selectedLanguage = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const [chartData, setChartData] = useState<any[]>([]);

  const language = selectedLanguage === "ar" || selectedLanguage === 2 ? 2 : 1;

  const processData = (rawData: any) => {
    if (!rawData) return;
    const resolved = rawData?.data || rawData;

    // 1. Direct array or nested under CUSTOMERSBYGROUP from /api/CollectorsDashboard
    let list: any[] = [];
    if (Array.isArray(resolved)) {
      list = resolved;
    } else if (resolved?.CUSTOMERSBYGROUP && Array.isArray(resolved.CUSTOMERSBYGROUP)) {
      list = resolved.CUSTOMERSBYGROUP;
    }

    if (list.length > 0) {
      const formattedData = list.map((item: any) => ({
        name: item.LCALLOCATIONGROUP || item.name || "Unassigned",
        value: Number(item.CUSTOMERSCOUNT ?? item.value ?? 0),
      }));
      setChartData(formattedData);
      return;
    }

    // 2. Fallback if raw cases are passed
    if (resolved?.PENDING_FOLLOWUP || resolved?.COMPLETE_FOLLOWUP || resolved?.ESCALATED_CASES) {
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
      return;
    }

    setChartData([]);
  };

  const fetchChartData = async () => {
    try {
      const resolvedUserId = user?.UserId || user?.userId || user?.Userid || user?.username;
      if (!resolvedUserId) return;
      const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
      const response = await axios.get(`${hostUrl}/api/CollectorsDashboard`, {
        params: { UserID: resolvedUserId, UserId: resolvedUserId, language },
      });
      processData(response.data);
    } catch (err) {
      console.error("BarChartComponent fetch error:", err);
    }
  };

  useEffect(() => {
    if (data) {
      processData(data);
    } else if (user) {
      fetchChartData();
    }
  }, [data, user, language]);

  const totalCustomers = chartData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] flex flex-col h-full">
      {/* Top Accent Gradient Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500" />

      <CardHeader className="pb-2 pt-6 px-5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold tracking-wide text-gray-900 dark:text-white">
            {title}
          </CardTitle>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Total Cases: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{totalCustomers}</span>
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-6 px-2 lg:px-4 flex flex-col justify-end">
        <div className="h-[280px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                angle={-30}
                textAnchor="end"
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                }}
                cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
                formatter={(val: any) => [`${val} Customers`, "Count"]}
              />
              <Bar dataKey="value" fill="url(#blueBarGradient)" radius={[6, 6, 0, 0]} barSize={28} />
              <defs>
                <linearGradient id="blueBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </div>
  );
}
