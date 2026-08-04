"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "@/utils/axios";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { Actions } from "./components/Actions";
import { FinancialCustomerDetails } from "./components/FinancialCustomerDetails";
import { DemographicCustomerDetails } from "./components/DemographicCustomerDetails";

export const followupCustomerDetailsGet = async (params: Record<string, any>) => {
  try {
    const hostUrl = process.env.HOST_API_KEY;
    const response = await axios.get(
      `${hostUrl}/api/Customer/get-CustomerDetails`,
      { params }
    );
    const followupCustomerData = (response.data || []).map((item: any, index: number) => {
      return { ...item, id: index + 1 };
    });
    return followupCustomerData;
  } catch (error: any) {
    return { error: error?.message || "Error fetching customer details" };
  }
};

export const followupDetailsGet = async (params: Record<string, any>) => {
  try {
    const hostUrl = process.env.HOST_API_KEY;
    const response = await axios.get(
      `${hostUrl}/api/TranFollowUpDetails/get-FollowUpDetails`,
      { params: params?.params ? params.params : params }
    );
    const followupData = (response.data || []).map((item: any, index: number) => {
      return { ...item, id: index + 1 };
    });
    return followupData;
  } catch (error: any) {
    return { error: error?.message || "Error fetching followup details" };
  }
};

export default function FollowupActionsPage() {
  const reduxParams = useSelector(dashboardParams);
  const selectedLanguage = useSelector(languageParams);

  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState<Record<string, any>>({});
  const [followupDetails, setFollowupDetails] = useState<Record<string, any>>({});
  const [cifId, setCifId] = useState<number | string>(1);
  const [language, setLanguage] = useState<number>(1);

  useEffect(() => {
    let activeCifId: number | string = 1;
    let activeLang: number = selectedLanguage === "ar" ? 2 : 1;

    if (reduxParams && (reduxParams.CIFID || reduxParams.CifId || reduxParams.APPID || reduxParams.id)) {
      activeCifId = reduxParams.CIFID || reduxParams.CifId || reduxParams.APPID || reduxParams.id;
      if (reduxParams.language) activeLang = reduxParams.language;
    } else {
      const saved = localStorage.getItem("followupParams");
      const savedAppId = localStorage.getItem("selectedAppId");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.CIFID || parsed.CifId || parsed.APPID || parsed.id) {
            activeCifId = parsed.CIFID || parsed.CifId || parsed.APPID || parsed.id;
          }
          if (parsed.language) activeLang = parsed.language;
        } catch (e) {
          console.error("Error parsing saved followup params", e);
        }
      } else if (savedAppId) {
        activeCifId = savedAppId;
      }
    }

    setCifId(activeCifId);
    setLanguage(activeLang);

    const loadData = async () => {
      setLoading(true);
      try {
        const queryParams = { CIFID: activeCifId, language: activeLang };

        const [custRes, folRes] = await Promise.all([
          followupCustomerDetailsGet(queryParams),
          followupDetailsGet(queryParams),
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
    <div className="flex flex-col gap-8 p-6 lg:p-8 min-h-screen font-sans">
      {/* Action Bar Component */}
      <Actions
        cifId={cifId}
        customerDetails={customerDetails}
        followupDetails={followupDetails}
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
