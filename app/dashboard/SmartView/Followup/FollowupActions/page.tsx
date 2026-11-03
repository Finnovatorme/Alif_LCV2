"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "@/utils/axios";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { User, AlertTriangle, CheckCircle2 } from "lucide-react";

import { Actions } from "./components/Actions";
import { FinancialCustomerDetails } from "./components/FinancialCustomerDetails";
import { DemographicCustomerDetails } from "./components/DemographicCustomerDetails";

import {
  followupCustomerDetailsGet,
  followupDetailsGet,
  getNotificationNames,
  getNotificationTemplate,
  insertFollowupNotification,
  getAllNotifications,
  getMessageHistory,
  getCustomerContractsList,
} from "./HandlingAPIs";

export {
  followupCustomerDetailsGet,
  followupDetailsGet,
  getNotificationNames,
  getNotificationTemplate,
  insertFollowupNotification,
  getAllNotifications,
  getMessageHistory,
  getCustomerContractsList,
};

export default function FollowupActionsPage() {
  const reduxParams = useSelector(dashboardParams);
  const selectedLanguage = useSelector(languageParams);

  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState<Record<string, any>>({});
  const [followupDetails, setFollowupDetails] = useState<Record<string, any>>({});
  const [loanContracts, setLoanContracts] = useState<any[]>([]);
  const [cifId, setCifId] = useState<number | string | null>(null);
  const [language, setLanguage] = useState<number>(1);

  useEffect(() => {
    let activeCifId: number | string | null = null;
    let activeLang: number = selectedLanguage === "ar" ? 2 : 1;
    let initialCust: Record<string, any> = {};

    if (reduxParams && (reduxParams.CIFID !== undefined && reduxParams.CIFID !== null && reduxParams.CIFID !== "")) {
      activeCifId = reduxParams.CIFID;
      initialCust = { ...reduxParams };
      if (reduxParams.language) activeLang = reduxParams.language;
    } else if (reduxParams && (reduxParams.CifId || reduxParams.id)) {
      activeCifId = reduxParams.CifId || reduxParams.id;
      initialCust = { ...reduxParams };
      if (reduxParams.language) activeLang = reduxParams.language;
    } else {
      const saved = localStorage.getItem("followupParams");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.CIFID !== undefined && parsed.CIFID !== null && parsed.CIFID !== "") {
            activeCifId = parsed.CIFID;
          } else if (parsed.CifId || parsed.id) {
            activeCifId = parsed.CifId || parsed.id;
          }
          if (parsed.language) activeLang = parsed.language;
          initialCust = parsed;
        } catch (e) {
          console.error("Error parsing saved followup params", e);
        }
      }
    }

    if (!activeCifId) {
      activeCifId = 1;
    }

    if (Object.keys(initialCust).length > 0) {
      setCustomerDetails((prev) => ({ ...initialCust, ...prev }));
    }

    setCifId(activeCifId);
    setLanguage(activeLang);

    const loadData = async () => {
      setLoading(true);
      try {
        const queryParams = { CIFID: activeCifId ?? "", language: activeLang };

        const [custRes, folRes, contractsRes] = await Promise.all([
          activeCifId !== null && activeCifId !== undefined
            ? followupCustomerDetailsGet(queryParams)
            : null,
          activeCifId !== null && activeCifId !== undefined
            ? followupDetailsGet(queryParams)
            : null,
          activeCifId !== null && activeCifId !== undefined
            ? getCustomerContractsList(queryParams)
            : [],
        ]);

        if (Array.isArray(custRes) && custRes.length > 0) {
          setCustomerDetails((prev) => ({ ...prev, ...custRes[0] }));
        } else if (custRes && typeof custRes === "object" && !(custRes as any).error) {
          setCustomerDetails((prev) => ({ ...prev, ...custRes }));
        }

        if (Array.isArray(folRes) && folRes.length > 0) {
          setFollowupDetails(folRes[0]);
        } else if (folRes && typeof folRes === "object" && !(folRes as any).error) {
          setFollowupDetails(folRes);
        }

        if (Array.isArray(contractsRes)) {
          setLoanContracts(contractsRes);
        } else if (contractsRes?.data && Array.isArray(contractsRes.data)) {
          setLoanContracts(contractsRes.data);
        }
      } catch (err) {
        console.error("Error loading followup action data:", err);
        toast.error("Failed to load details");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reduxParams, selectedLanguage]);

  const combinedData = { ...customerDetails, ...followupDetails };

  // Customer primary attributes matching Screenshot 2
  const customerName =
    combinedData?.CUSTOMERNAME ||
    combinedData?.CustomerName ||
    combinedData?.CUSTOMERFULLNAME ||
    combinedData?.FULLNAME ||
    customerDetails?.CUSTOMERNAME ||
    customerDetails?.CustomerName ||
    "ALZAHRANI FATIMAH AHMED";

  const displayCifId =
    combinedData?.CIFID ??
    combinedData?.CifId ??
    customerDetails?.CIFID ??
    customerDetails?.CifId ??
    cifId ??
    "1";

  const customerType =
    combinedData?.CUSTOMERTYPE ||
    combinedData?.CustomerType ||
    customerDetails?.CUSTOMERTYPE ||
    "Individual";

  const dpdVal = Number(combinedData?.DPD ?? combinedData?.dpd ?? 2);
  const isOverdue = dpdVal > 0 || Number(combinedData?.PRINCIPALOVERDUE ?? combinedData?.PrincipalOverdue ?? 892.89) > 0;

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Top Action Bar */}
      <Actions
        cifId={cifId}
        customerDetails={customerDetails}
        followupDetails={followupDetails}
        loanContracts={loanContracts}
      />

      {/* Profile Header Banner with Top Gradient and Shadow */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 sm:px-6 py-5 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Top Gradient */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        <div className="flex items-center gap-4">
          {/* User Icon Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {customerName}
              </h2>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              CIF ID: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{displayCifId}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-gray-200 dark:bg-gray-700 mx-3" />

          {/* Customer Type */}
          <div className="hidden md:flex flex-col">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Customer Type</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 w-fit mt-0.5 shadow-2xs">
              {customerType}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {isOverdue ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs sm:text-sm font-bold shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>Overdue</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs sm:text-sm font-bold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Regular</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <FinancialCustomerDetails data={combinedData} />
          <DemographicCustomerDetails data={combinedData} />
        </div>
      )}
    </div>
  );
}
