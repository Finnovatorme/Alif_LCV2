"use client";

import React, { useEffect, useState } from "react";
import axios from "@/utils/axios";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { useAuth } from "@/hooks/useAuth";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

interface HorizontalBarChartProps {
  title: string;
  data?: any;
}

export default function HorizontalBarChartComponent({ title, data }: HorizontalBarChartProps) {
  const selectedLanguage = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const [chartData, setChartData] = useState<any[]>([]);

  const language = selectedLanguage === "ar" || selectedLanguage === 2 ? 2 : 1;

  const processData = (rawData: any) => {
    if (!rawData) return;
    const resolved = rawData?.data || rawData;

    // 1. From /api/CollectorsDashboard: COLLECTIONPERFORMANCE
    let item: any = null;
    if (resolved?.COLLECTIONPERFORMANCE) {
      item = Array.isArray(resolved.COLLECTIONPERFORMANCE)
        ? resolved.COLLECTIONPERFORMANCE[0]
        : resolved.COLLECTIONPERFORMANCE;
    } else if (Array.isArray(resolved) && resolved.length > 0) {
      item = resolved[0];
    } else if (typeof resolved === "object" && (resolved.FULLYPAID !== undefined || resolved.NOTPAID !== undefined)) {
      item = resolved;
    }

    if (item && (item.FULLYPAID !== undefined || item.PARTIALPAID !== undefined || item.NOTPAID !== undefined)) {
      setChartData([
        {
          name: "Fully Paid",
          value: Number(item.FULLYPAID || 0),
          fill: "#10b981",
          gradientId: "fullyPaidGradient",
        },
        {
          name: "Partially Paid",
          value: Number(item.PARTIALPAID || 0),
          fill: "#f59e0b",
          gradientId: "partialPaidGradient",
        },
        {
          name: "Not Paid",
          value: Number(item.NOTPAID || 0),
          fill: "#f43f5e",
          gradientId: "notPaidGradient",
        },
      ]);
      return;
    }

    // 2. Fallback calculation if raw cases are passed
    if (resolved?.PENDING_FOLLOWUP || resolved?.COMPLETE_FOLLOWUP || resolved?.ESCALATED_CASES) {
      const allCases = [
        ...(resolved.PENDING_FOLLOWUP || []),
        ...(resolved.COMPLETE_FOLLOWUP || []),
        ...(resolved.ESCALATED_CASES || []),
      ];
      let fullyPaid = 0;
      let partialPaid = 0;
      let notPaid = 0;

      allCases.forEach((caseItem: any) => {
        const overdue = Number(caseItem.TOTALOVERDUEAMOUNT || 0);
        const collected = Number(caseItem.TOTALAMOUNTCOLLECTED || 0);
        if (overdue <= 0 && collected > 0) {
          fullyPaid++;
        } else if (overdue > 0 && collected > 0) {
          partialPaid++;
        } else {
          notPaid++;
        }
      });

      setChartData([
        {
          name: "Fully Paid",
          value: fullyPaid,
          fill: "#10b981",
          gradientId: "fullyPaidGradient",
        },
        {
          name: "Partially Paid",
          value: partialPaid,
          fill: "#f59e0b",
          gradientId: "partialPaidGradient",
        },
        {
          name: "Not Paid",
          value: notPaid,
          fill: "#f43f5e",
          gradientId: "notPaidGradient",
        },
      ]);
      return;
    }

    setChartData([]);
  };

  const fetchData = async () => {
    try {
      const resolvedUserId = user?.UserId || user?.userId || user?.Userid || user?.username;
      if (!resolvedUserId) return;
      const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
      const response = await axios.get(`${hostUrl}/api/CollectorsDashboard`, {
        params: { UserID: resolvedUserId, UserId: resolvedUserId, language },
      });
      processData(response.data);
    } catch (err) {
      console.error("HorizontalBarChartComponent fetch error:", err);
    }
  };

  useEffect(() => {
    if (data) {
      processData(data);
    } else if (user) {
      fetchData();
    }
  }, [data, user, language]);

  const total = chartData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] flex flex-col h-full">
      {/* Top Accent Gradient Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />

      <CardHeader className="pb-2 pt-6 px-5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold tracking-wide text-gray-900 dark:text-white">
            {title}
          </CardTitle>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Total Accounts: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{total}</span>
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-6 px-3 lg:px-5 flex flex-col justify-end">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 15, right: 30, left: 45, bottom: 15 }}
            >
              <defs>
                <linearGradient id="fullyPaidGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="partialPaidGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="notPaidGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
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
                formatter={(val: any) => [`${val} Accounts`, "Count"]}
                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={`url(#${entry.gradientId})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Small Legend Pill Below */}
        <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Paid: {chartData.find((d) => d.name === "Fully Paid")?.value || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Partial: {chartData.find((d) => d.name === "Partially Paid")?.value || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Unpaid: {chartData.find((d) => d.name === "Not Paid")?.value || 0}</span>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
