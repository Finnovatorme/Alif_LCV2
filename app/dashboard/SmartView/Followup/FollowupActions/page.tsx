"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "@/utils/axios";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
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

    if (reduxParams && (reduxParams.CIFID !== undefined && reduxParams.CIFID !== null && reduxParams.CIFID !== "")) {
      activeCifId = reduxParams.CIFID;
      if (reduxParams.language) activeLang = reduxParams.language;
    } else if (reduxParams && (reduxParams.CifId || reduxParams.id)) {
      activeCifId = reduxParams.CifId || reduxParams.id;
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
        } catch (e) {
          console.error("Error parsing saved followup params", e);
        }
      }
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
          setCustomerDetails(custRes[0]);
        } else if (custRes && typeof custRes === "object" && !custRes.error) {
          setCustomerDetails(custRes);
        }

        if (Array.isArray(folRes) && folRes.length > 0) {
          setFollowupDetails(folRes[0]);
        } else if (folRes && typeof folRes === "object" && !folRes.error) {
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

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Action Bar Component */}
      <Actions
        cifId={cifId}
        customerDetails={customerDetails}
        followupDetails={followupDetails}
        loanContracts={loanContracts}
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Financial Customer Details */}
          <FinancialCustomerDetails data={combinedData} />

          {/* Right Panel: Demographic Customer Details */}
          <DemographicCustomerDetails data={combinedData} />
        </div>
      )}
    </div>
  );
}
