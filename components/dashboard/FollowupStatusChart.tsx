"use client";

import React, { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { useAuth } from "@/hooks/useAuth";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

interface FollowupStatusChartProps {
  title: string;
  data?: any;
}

export default function FollowupStatusChart({ title, data }: FollowupStatusChartProps) {
  const selectedLanguage = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const [chartData, setChartData] = useState<any[]>([]);

  const language = selectedLanguage === "ar" || selectedLanguage === 2 ? 2 : 1;

  const processData = (rawData: any) => {
    if (!rawData) return;
    const resolved = rawData?.data || rawData;

    let list: any[] = [];
    if (resolved?.CUSTOMERBYFOLLOWUPSTATUS && Array.isArray(resolved.CUSTOMERBYFOLLOWUPSTATUS)) {
      list = resolved.CUSTOMERBYFOLLOWUPSTATUS;
    } else if (Array.isArray(resolved)) {
      list = resolved;
    }

    if (list.length > 0) {
      // Group by FOLLOWUPRESULT
      const groups: Record<
        string,
        { total: number; subResults: Record<string, number> }
      > = {};

      list.forEach((item: any) => {
        const rawRes = item.FOLLOWUPRESULT ? String(item.FOLLOWUPRESULT).trim() : "";
        const resultLabel = rawRes || "Pending Result";
        const rawSub = item.FOLLOWUPSUBRESULT ? String(item.FOLLOWUPSUBRESULT).trim() : "";
        const subLabel = rawSub || "Unspecified";
        const count = Number(item.CUSTOMERSCOUNT ?? 1);

        if (!groups[resultLabel]) {
          groups[resultLabel] = { total: 0, subResults: {} };
        }
        groups[resultLabel].total += count;
        groups[resultLabel].subResults[subLabel] =
          (groups[resultLabel].subResults[subLabel] || 0) + count;
      });

      const formatted = Object.entries(groups).map(([name, info], index) => {
        const gradients = [
          "statusGradBlue",
          "statusGradViolet",
          "statusGradEmerald",
          "statusGradAmber",
          "statusGradRose",
        ];
        return {
          name,
          value: info.total,
          subResults: info.subResults,
          gradientId: gradients[index % gradients.length],
        };
      });

      // Sort by total descending
      formatted.sort((a, b) => b.value - a.value);
      setChartData(formatted);
      return;
    }

    // Fallback if legacy arrays passed
    if (resolved?.PENDING_FOLLOWUP || resolved?.COMPLETE_FOLLOWUP || resolved?.ESCALATED_CASES) {
      const pendingList = resolved.PENDING_FOLLOWUP || [];
      const completeList = resolved.COMPLETE_FOLLOWUP || [];
      const escalatedList = resolved.ESCALATED_CASES || [];

      setChartData([
        { name: "Pending", value: pendingList.length, gradientId: "statusGradBlue", subResults: {} },
        { name: "Completed", value: completeList.length, gradientId: "statusGradEmerald", subResults: {} },
        { name: "Escalated", value: escalatedList.length, gradientId: "statusGradRose", subResults: {} },
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
      console.error("FollowupStatusChart fetch error:", err);
    }
  };

  useEffect(() => {
    if (data) {
      processData(data);
    } else if (user) {
      fetchData();
    }
  }, [data, user, language]);

  const totalCases = chartData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] flex flex-col h-full">
      {/* Top Accent Gradient Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-sky-500 to-emerald-500" />

      <CardHeader className="pb-2 pt-6 px-5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold tracking-wide text-gray-900 dark:text-white">
            {title}
          </CardTitle>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Total Followup Cases: <span className="font-mono font-bold text-violet-600 dark:text-violet-400">{totalCases}</span>
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-6 px-2 lg:px-4 flex flex-col justify-end">
        <div className="h-[280px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -15, bottom: 45 }}
            >
              <defs>
                <linearGradient id="statusGradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="statusGradViolet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
                <linearGradient id="statusGradEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="statusGradAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="statusGradRose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
              </defs>

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
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    const subList = Object.entries(row.subResults || {});
                    return (
                      <div className="rounded-xl border border-gray-700 bg-[#0f172a] p-3 text-xs text-white shadow-2xl max-w-xs">
                        <div className="font-bold text-sky-400 mb-1 flex items-center justify-between gap-3">
                          <span>{row.name}</span>
                          <span className="font-mono text-white text-sm">{row.value}</span>
                        </div>
                        {subList.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-800 space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Sub-reasons breakdown:</span>
                            {subList.map(([sub, count]: any) => (
                              <div key={sub} className="flex justify-between gap-3 text-[11px] text-gray-300">
                                <span className="truncate">{sub}:</span>
                                <span className="font-mono font-semibold text-white">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={`url(#${entry.gradientId})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </div>
  );
}
