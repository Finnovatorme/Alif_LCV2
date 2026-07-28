"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { toast } from "sonner";
import { ArrowLeftIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { auditTrailGet } from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { useRouter } from "next/navigation";

export type AuditTrailApi = {
  AUDITRECID?: number;
  APPID?: number;
  ACTION?: string;
  ENTITYNAME?: string;
  PERFORMEDBY?: string;
  PERFORMEDDATE?: string;
  RECSTATUS?: boolean;
  [key: string]: any;
};

interface AuditTrailRow extends AuditTrailApi {
  id: number;
}

export default function AuditTrail() {
  const router = useRouter();
  const appParams = useSelector(dashboardParams);
  const language = useSelector(languageParams);

  const [records, setRecords] = useState<AuditTrailRow[]>([]);
  const [loading, setLoading] = useState(false);

  // safe number convert
  const toNum = (v: any, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fetchRecords = async () => {
    if (!appParams?.APPID) return;

    try {
      setLoading(true);

      const params = { APPID: appParams.APPID, Language: language };
      const response = await auditTrailGet(params);

      console.log("AuditTrail API:", response);

      const data = Array.isArray(response) ? response : [];

      const mapped: AuditTrailRow[] = data.map((item: any) => ({
        ...item,
        id: toNum(item.AUDITRECID),
        ACTION: item.ACTION ?? "-",
        ENTITYNAME: item.ENTITYNAME ?? "-",
        PERFORMEDBY: item.PERFORMEDBY ?? "-",
        RECSTATUS: Boolean(item.RECSTATUS),
      }));

      setRecords(mapped);

      if (mapped.length > 0)
        toast.success("Audit Trail data fetched successfully");
      else toast.info("No Audit Trail data found");
    } catch (error) {
      console.error("Fetch error:", error);
      setRecords([]);
      toast.error("Failed to fetch Audit Trail data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appParams?.APPID) {
      fetchRecords();
    }
  }, [appParams?.APPID, language]);

  const columns: ColumnDef<AuditTrailRow>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { accessorKey: "SEQUENCE", header: "Sequence" },
      { accessorKey: "APPLICATIONSTATUS", header: "Application Status" },
      { accessorKey: "WORKFLOWNAME", header: "Actions" },
      { accessorKey: "STAGENAME", header: "Stage Name" },
      { accessorKey: "STARTDATE", header: "Start Date" },
      { accessorKey: "ENDDATE", header: "End Date" },
      { accessorKey: "STAGEEXPIRYDATE", header: "Stage Expiry Date" },
      { accessorKey: "STAGEUSER", header: "Stage User" },
      { accessorKey: "STAGESTATUS", header: "Stage Status" },
      { accessorKey: "COMMENTS", header: "Comments" },
    ],
    [language],
  );

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Audit Trail</h1>
      </div>

      <ReusableDataTable<AuditTrailRow>
        initialData={records}
        columns={columns}
        loading={loading}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </>
  );
}

