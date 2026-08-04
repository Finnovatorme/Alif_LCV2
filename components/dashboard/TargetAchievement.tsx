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

interface TargetAchievementProps {
  title: string;
  allocated?: number;
  achieved?: number;
}

export default function TargetAchievement({ title, allocated = 0, achieved = 0 }: TargetAchievementProps) {
  const language = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const [data, setData] = useState({ allocated: 0, achieved: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const resolvedUserId = user?.UserId || user?.userId || user?.Userid;
      if (!resolvedUserId) return;
      try {
        const hostUrl = process.env.HOST_API_KEY;
        const response = await axios.get(
          `${hostUrl}/api/Dashboard/get-DashboardCollectionAcheivement`,
          {
            params: { UserID: resolvedUserId, language },
          }
        );
        if (response.data && response.data.length > 0) {
          const item = response.data[0];
          setData({
            allocated: item.TARGET_ALLOCATED || 0,
            achieved: item.ACHIEVED || 0,
          });
        }
      } catch (err) {
        console.error("Target achievement api error:", err);
      }
    };
    if (user) fetchData();
  }, [user, language]);

  const displayAllocated = data.allocated || allocated;
  const displayAchieved = data.achieved || achieved;

  // Dummy data for the sparkline background
  const sparklineData = [
    { value: 20 }, { value: 30 }, { value: 25 }, { value: 40 }, { value: 35 }, { value: 50 }, { value: displayAchieved }
  ];

  return (
    <Card className="flex flex-col h-full min-h-[220px] bg-white dark:bg-gray-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group">
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

      <CardHeader className="pb-2 pt-6 relative z-10">
        <CardTitle className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 relative z-10 flex flex-col justify-end pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-sm text-gray-500 font-medium">Achieved</span>
            <span className="text-3xl font-extrabold text-emerald-500 dark:text-emerald-400">{displayAchieved}</span>
          </div>
          <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-800 pt-2">
            <span className="text-sm text-gray-500 font-medium">Allocated</span>
            <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{displayAllocated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
