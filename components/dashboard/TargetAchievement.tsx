"use client";

import React, { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/utils/axios";
import { Target, TrendingUp } from "lucide-react";

interface TargetAchievementProps {
  title?: string;
  allocated?: number;
  achieved?: number;
  data?: any;
}

export default function TargetAchievement({
  title = "Target General",
  allocated: allocatedProp = 0,
  achieved: achievedProp = 0,
  data: dataProp,
}: TargetAchievementProps) {
  const selectedLanguage = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const [data, setData] = useState({
    allocated: 0,
    achieved: 0,
    customersCount: 0,
  });

  const language = selectedLanguage === "ar" || selectedLanguage === 2 ? 2 : 1;

  const processData = (rawData: any) => {
    if (!rawData) return;
    const resolved = rawData?.data || rawData;

    // 1. Direct or nested under COLLECTIONACHEIVEMENT from /api/CollectorsDashboard
    let item: any = null;
    if (resolved?.COLLECTIONACHEIVEMENT) {
      item = Array.isArray(resolved.COLLECTIONACHEIVEMENT)
        ? resolved.COLLECTIONACHEIVEMENT[0]
        : resolved.COLLECTIONACHEIVEMENT;
    } else if (Array.isArray(resolved) && resolved.length > 0) {
      item = resolved[0];
    } else if (
      typeof resolved === "object" &&
      (resolved.ALLOCATEDTARGET !== undefined ||
        resolved.ACHEIVEDTARGET !== undefined ||
        resolved.TARGET_ALLOCATED !== undefined)
    ) {
      item = resolved;
    }

    if (
      item &&
      (item.ALLOCATEDTARGET !== undefined ||
        item.ACHEIVEDTARGET !== undefined ||
        item.TARGET_ALLOCATED !== undefined ||
        item.ACHIEVED !== undefined)
    ) {
      setData({
        allocated: Number(item.ALLOCATEDTARGET ?? item.TARGET_ALLOCATED ?? 0),
        achieved: Number(item.ACHEIVEDTARGET ?? item.ACHIEVED ?? 0),
        customersCount: Number(item.CUSTOMERSCOUNT ?? 0),
      });
      return;
    }

    // 2. Fallback if dashboard follow-up counts are passed
    if (
      resolved?.PENDING_FOLLOWUP ||
      resolved?.COMPLETE_FOLLOWUP ||
      resolved?.ESCALATED_CASES
    ) {
      const total =
        (resolved.PENDING_FOLLOWUP?.length || 0) +
        (resolved.COMPLETE_FOLLOWUP?.length || 0) +
        (resolved.ESCALATED_CASES?.length || 0);
      const done = resolved.COMPLETE_FOLLOWUP?.length || 0;
      setData({
        allocated: total,
        achieved: done,
        customersCount: total,
      });
    }
  };

  useEffect(() => {
    if (dataProp) {
      processData(dataProp);
      return;
    }

    const fetchData = async () => {
      const resolvedUserId =
        user?.UserId || user?.userId || user?.Userid || user?.username;
      if (!resolvedUserId) return;
      try {
        const hostUrl =
          process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
        const response = await axios.get(
          `${hostUrl}/api/CollectorsDashboard`,
          {
            params: {
              UserID: resolvedUserId,
              UserId: resolvedUserId,
              language,
              RecStatus: true,
            },
          }
        );
        processData(response.data);
      } catch (err) {
        console.error("Target achievement api error:", err);
      }
    };
    if (user) fetchData();
  }, [dataProp, user, language]);

  const displayAllocated = data.allocated || allocatedProp;
  const displayAchieved = data.achieved || achievedProp;
  const percentage =
    displayAllocated > 0
      ? Math.round((displayAchieved / displayAllocated) * 100)
      : 0;

  const formatVal = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return "0";
    return Number(val).toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
  };

  // Harmonized sparkline points for smooth aesthetic curve
  const baseVal = Math.max(displayAllocated, 100);
  const sparklineData = [
    { name: "P1", value: Math.round(baseVal * 0.35) },
    { name: "P2", value: Math.round(baseVal * 0.55) },
    { name: "P3", value: Math.round(baseVal * 0.48) },
    { name: "P4", value: Math.round(baseVal * 0.8) },
    { name: "P5", value: Math.round(baseVal * 0.7) },
    { name: "P6", value: Math.round(baseVal * 1.05) },
  ];

  return (
    <Card className="flex flex-col h-full min-h-[220px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden group">
      <CardHeader className="pb-0 pt-5 px-5 flex flex-row items-center justify-between flex-none">
        <CardTitle className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
          {title}
        </CardTitle>
        <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Target className="w-3.5 h-3.5" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pb-4 pt-1 px-5">
        <div>
          {/* Main Achieved Value + Percentage */}
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                {formatVal(displayAchieved)}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase shrink-0">
                SAR
              </span>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              {percentage}%
            </span>
          </div>

          {/* Target and Cases Sub-info */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1">
            <span>
              Target:{" "}
              <strong className="text-gray-700 dark:text-gray-300 font-semibold">
                {formatVal(displayAllocated)} SAR
              </strong>
            </span>
            {data.customersCount > 0 && (
              <span className="text-gray-400 dark:text-gray-500 font-normal">
                {data.customersCount} Cases
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
        </div>

        {/* Smooth Emerald Area Sparkline matching other cards */}
        <div className="h-[75px] w-full mt-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sparklineData}
              margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "rgba(16, 185, 129, 0.95)",
                  color: "#ffffff",
                  fontSize: "11px",
                  padding: "4px 8px",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#targetGradient)"
                dot={{
                  r: 2.5,
                  fill: "#10b981",
                  strokeWidth: 1.5,
                  stroke: "#ffffff",
                }}
                activeDot={{ r: 4.5, fill: "#059669" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
