"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, FileText, DollarSign, Activity, CheckCircle, ShieldAlert } from "lucide-react";
import axios from "@/utils/axios";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ContractDetailsPage() {
  const router = useRouter();
  const reduxParams = useSelector(dashboardParams);
  const selectedLanguage = useSelector(languageParams);

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<Record<string, any> | null>(null);
  const [cifId, setCifId] = useState<number | string>(1);
  const [language, setLanguage] = useState<number>(1);

  useEffect(() => {
    let activeCifId: number | string = 1;
    let activeLang: number = selectedLanguage === "ar" ? 2 : 1;

    if (reduxParams && (reduxParams.CIFID || reduxParams.CifId)) {
      activeCifId = reduxParams.CIFID || reduxParams.CifId;
      if (reduxParams.language) activeLang = reduxParams.language;
    } else {
      const saved = localStorage.getItem("searchContractParams");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.CIFID || parsed.CifId) activeCifId = parsed.CIFID || parsed.CifId;
          if (parsed.language) activeLang = parsed.language;
        } catch (e) {
          console.error("Error parsing saved params", e);
        }
      }
    }

    setCifId(activeCifId);
    setLanguage(activeLang);

    const fetchCustomerSummary = async () => {
      setLoading(true);
      try {
        const hostUrl = process.env.HOST_API_KEY;
        const response = await axios.get(
          `${hostUrl}/api/Customer/get-CustomerSummary`,
          {
            params: {
              CIFID: activeCifId,
              language: activeLang,
            },
          }
        );

        const data = response.data;
        if (Array.isArray(data)) {
          setSummaryData(data[0] || {});
        } else if (data && typeof data === "object") {
          setSummaryData(data);
        } else {
          setSummaryData({});
        }
      } catch (err) {
        console.error("Error fetching Customer Summary:", err);
        toast.error("Failed to load customer summary details");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerSummary();
  }, [reduxParams, selectedLanguage]);

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-10 min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a] font-sans">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/SmartView/SearchContracts")}
            className="h-10 px-4 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search Contracts
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Contract Details
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customer Summary for CIF ID #{cifId}
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          Language: {language === 2 ? "Arabic" : "English"}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : summaryData ? (
        <>
          {/* Key KPI Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-blue-200 to-transparent dark:from-blue-900/40">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[15px] p-5 flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Customer Name
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {summaryData.CUSTOMERNAME || summaryData.CUSTOMERFULLNAME || summaryData.NAME || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-indigo-200 to-transparent dark:from-indigo-900/40">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[15px] p-5 flex items-center gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    CIF ID
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {summaryData.CIFID || cifId}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-emerald-200 to-transparent dark:from-emerald-900/40">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[15px] p-5 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Total Overdue
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {summaryData.TOTALOVERDUEAMOUNT ?? summaryData.TOTALOVERDUE ?? "0.00"}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-purple-200 to-transparent dark:from-purple-900/40">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[15px] p-5 flex items-center gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {summaryData.STATUS || summaryData.RECSTATUS || "Active"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Summary Details Grid */}
          <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(15,142,221,0.15)]">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] p-6 lg:p-8 border border-white/40 dark:border-gray-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                Detailed Summary Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(summaryData).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/60 flex flex-col gap-1"
                  >
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {val === null || val === undefined || String(val).trim() === ""
                        ? "—"
                        : typeof val === "boolean"
                          ? val
                            ? "Yes"
                            : "No"
                          : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-gray-500">
          No customer summary details found for CIF ID #{cifId}.
        </div>
      )}
    </div>
  );
}
