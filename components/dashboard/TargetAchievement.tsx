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
import { Target } from "lucide-react";

interface TargetAchievementProps {
  title: string;
  allocated?: number;
  achieved?: number;
  data?: any;
}

export default function TargetAchievement({
  title,
  allocated = 0,
  achieved = 0,
  data: dataProp,
}: TargetAchievementProps) {
  const language = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const [data, setData] = useState({ allocated: 0, achieved: 0 });

  const processData = (rawData: any) => {
    if (!rawData) return;
    const resolved = rawData?.data || rawData;
    if (Array.isArray(resolved) && resolved.length > 0) {
      const item = resolved[0];
      setData({
        allocated: item.TARGET_ALLOCATED || 0,
        achieved: item.ACHIEVED || 0,
      });
    } else if (resolved?.PENDING_FOLLOWUP || resolved?.COMPLETE_FOLLOWUP || resolved?.ESCALATED_CASES) {
      const total =
        (resolved.PENDING_FOLLOWUP?.length || 0) +
        (resolved.COMPLETE_FOLLOWUP?.length || 0) +
        (resolved.ESCALATED_CASES?.length || 0);
      const done = resolved.COMPLETE_FOLLOWUP?.length || 0;
      setData({
        allocated: total,
        achieved: done,
      });
    }
  };

  useEffect(() => {
    if (dataProp) {
      processData(dataProp);
      return;
    }

    const fetchData = async () => {
      const resolvedUserId = user?.UserId || user?.userId || user?.Userid;
      if (!resolvedUserId) return;
      try {
        const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
        const response = await axios.get(
          `${hostUrl}/api/Dashboard`,
          {
            params: { UserID: resolvedUserId, language },
          }
        );
        processData(response.data);
      } catch (err) {
        console.error("Target achievement api error:", err);
      }
    };
    if (user) fetchData();
  }, [dataProp, user, language]);

  const displayAllocated = data.allocated || allocated;
  const displayAchieved = data.achieved || achieved;

  // Dummy data for the sparkline background
  const sparklineData = [
    { value: 20 }, { value: 30 }, { value: 25 }, { value: 40 }, { value: 35 }, { value: 50 }, { value: displayAchieved }
  ];

  return (
    <Card className="flex flex-col h-full min-h-[220px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden group">
      <div className="absolute inset-0 opacity-20 transition-opacity duration-300 group-hover:opacity-40 rounded-3xl overflow-hidden pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between relative z-10 flex-none">
        <CardTitle className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
          {title}
        </CardTitle>
        <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Target className="w-3.5 h-3.5" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 relative z-10 flex flex-col justify-end pb-4 pt-1 px-5">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider block">Achieved</span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{displayAchieved}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium block">Allocated</span>
              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{displayAllocated}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round(((displayAchieved || 0) / Math.max(displayAllocated || 1, 1)) * 100))}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
