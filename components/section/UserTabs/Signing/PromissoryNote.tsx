"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { toast } from "sonner";
import { promissoryNoteGet } from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

export type PromissoryNoteApi = {
  TWTRECID?: number;
  APPID?: number;
  DOCUMENTID?: number;
  DOCUMENTNAME?: string;
  REQUIREDVALIDATION?: string;
  RECSTATUS?: boolean;
  MAKER?: string;
  MAKEDATE?: string;
  [key: string]: any;
};

interface PromissoryNoteRow extends PromissoryNoteApi {
  id: number;
}

export default function PromissoryNote() {
  const router = useRouter();
  const appParams = useSelector(dashboardParams);
  const language = useSelector(languageParams);

  const [records, setRecords] = useState<PromissoryNoteRow[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: fallback APPID from localStorage (client-side only)
  const [lsAppId, setLsAppId] = useState<string>("");

  useEffect(() => {
    try {
      const v =
        typeof window !== "undefined"
          ? localStorage.getItem("APPID") ||
            localStorage.getItem("appid") ||
            localStorage.getItem("appId") ||
            localStorage.getItem("AppId") ||
            ""
          : "";
      setLsAppId(v ? String(v) : "");
    } catch {
      setLsAppId("");
    }
  }, []);

  // safe number convert
  const toNum = (v: any, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fetchRecords = async () => {
    // ✅ NEW: use redux APPID first, otherwise localStorage APPID
    const resolvedAppId =
      appParams?.APPID ?? (lsAppId ? Number(lsAppId) : undefined);
    if (!resolvedAppId) return;

    try {
      setLoading(true);

      const params = { APPID: resolvedAppId, language };
      const response = await promissoryNoteGet(params);

      console.log("PromissoryNote API:", response);

      const data = Array.isArray(response) ? response : [];

      const mapped: PromissoryNoteRow[] = data.map((item: any) => ({
        ...item,
        id: toNum(item.TWTRECID),
        DOCUMENTNAME: item.DOCUMENTNAME ?? "-",
        REQUIREDVALIDATION: item.REQUIREDVALIDATION ?? "-",
        RECSTATUS: Boolean(item.RECSTATUS),
      }));

      setRecords(mapped);

      if (mapped.length > 0)
        toast.success("Promissory Note data fetched successfully");
      else toast.info("No Promissory Note data found");
    } catch (error) {
      console.error("Fetch error:", error);
      setRecords([]);
      toast.error("Failed to fetch Promissory Note data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ NEW: trigger when redux APPID arrives, localStorage APPID loads, or language switches
    if (appParams?.APPID || lsAppId) {
      fetchRecords();
    }
  }, [appParams?.APPID, lsAppId, language]);

  const columns: ColumnDef<PromissoryNoteRow>[] = useMemo(
    () => [
      { id: "select", header: "Select" },
      { id: "actions", header: "Actions" },

      { accessorKey: "Tophrecid", header: "Record ID" },
      { accessorKey: "Countryofissuance", header: "Country of Issuance" },
      { accessorKey: "Cityofissuance", header: "City of Issuance" },
      { accessorKey: "Countryofpayment", header: "Country of Payment" },
      { accessorKey: "Cityofpayment", header: "City of Payment" },
      { accessorKey: "Promissorynotetype", header: "Promissory Note Type" },
      { accessorKey: "Referencenumber", header: "Reference Number" },

      {
        accessorKey: "RECSTATUS",
        header: "STATUS",
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
        ),
      },
    ],
    [],
  );

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <h1 className="text-3xl font-bold">Promissory Note</h1>
      </div>

      <ReusableDataTable<PromissoryNoteRow>
        initialData={records}
        columns={columns}
        loading={loading}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </>
  );
}
