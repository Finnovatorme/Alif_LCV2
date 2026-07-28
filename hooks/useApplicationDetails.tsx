"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "@/utils/axios";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";

export interface ApplicationData {
  APPID: number;
  APPLICATIONTYPE: string;
  CUSTOMERFULLNAME: string;
  EMAIL: string | null;
  MOBILENUMBER: string;
  PRODUCTNAME: string;
  SUBPRODUCTNAME: string;
  REQUESTAMOUNT: number;
  REQUESTTENURE: number;
  FINANCIERNAME: string;
  MAKEDATE: string;
  BRANCHNAME: string;
  SALESCHANNEL: string;
  PROVIDEDINCOME: string;
  PROVIDEDLIABILITIES: string;
  IDNUMBER: string;
  CIFID: string;
  STAGENAME: string;
  MOBILEVERIFICATION: Boolean;
  PRODUCTCODE: string;
  SUBPRODUCTCODE: string;
}

export const useApplicationDetails = (appId?: number) => {
  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const language = useSelector(languageParams);

  useEffect(() => {
    if (!appId) return;

    const fetchApplication = async () => {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
        const res = await axios.get(
          `${baseUrl}/api/APPL_APPLICATION`,
          {
            params: { APPID: appId, Language: language },
          },
        );

        setData(res.data?.[0]);
      } catch {
        setError("Failed to load application details");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [appId, language]);

  return { data, loading, error };
};
