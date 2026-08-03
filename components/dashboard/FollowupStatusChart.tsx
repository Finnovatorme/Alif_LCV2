"use client";
import React, { useState, useEffect } from "react";
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
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface FollowupStatusChartProps {
  title: string;
}

export default function FollowupStatusChart({ title }: FollowupStatusChartProps) {
  const language = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const [chartData, setChartData] = useState<any[]>([]);
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const resolvedUserId = user?.UserId || user?.userId || user?.Userid;
      if (!resolvedUserId) return;
      
      try {
        const bsUrl = process.env.BS_API_KEY || "http://173.208.180.149:8081";
        const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
        
        // Fetch Result options
        const resultRes = await axios.get(
          `${bsUrl}/api/CnfgVbValues/GetCnfgVbValues/COLLFOLLOWUPRESULT`,
          { params: { language } }
        );
        const resultOptions = resultRes.data.map((item: any) => item.VALDESC1);

        // Fetch Followup data
        const dataRes = await axios.get(
          `${hostUrl}/api/Dashboard/get-DashboardCustomerFollowupStatus`,
          { params: { UserID: resolvedUserId, language } }
        );

        const apiData = dataRes.data;
        const subResultsSet = new Set<string>();
        apiData.forEach((item: any) => {
          if (item.FOLLOWUPSUBRESULT) subResultsSet.add(item.FOLLOWUPSUBRESULT);
        });
        const subResults = Array.from(subResultsSet);
        setKeys(subResults);

        // Recharts prefers data grouped by the X-axis (Result)
        const formattedData = resultOptions.map((result: string) => {
          const dataPoint: any = { name: result };
          subResults.forEach((subResult) => {
            const match = apiData.find((item: any) => item.FOLLOWUPRESULT === result && item.FOLLOWUPSUBRESULT === subResult);
            dataPoint[subResult] = match ? match.CUSTOMERSCOUNT : 0;
          });
          return dataPoint;
        });

        setChartData(formattedData);
      } catch (error) {
        console.error("Error fetching follow-up status data:", error);
      }
    };
    
    if (user) fetchData();
  }, [user, language]);

  const COLORS = ["#0ea5e9", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

  return (
    <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(15,142,221,0.15)] h-full">
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
              {/* <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} /> */}
              {keys.map((key, index) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  stackId="a" 
                  fill={COLORS[index % COLORS.length]} 
                  radius={index === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
                  barSize={40} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
