"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { History, Eye } from "lucide-react";
import { getTransactionAuditTrail } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { formatDateTimeKSA } from "@/utils/helpers";

export default function AuditTrail({ loanId, cifId }: { loanId?: string; cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getTransactionAuditTrail({ 
          Loanid: loanId, 
          Cifid: cifId, 
          tranId: null,
          language 
        });
        const list = Array.isArray(response) ? response : (response?.data?.data || response?.data || []);
        setData(list.map((item: any, idx: number) => ({ ...item, id: idx + 1 })));
      } catch (error) {
        toast.error("Failed to fetch audit trail");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loanId, cifId, language]);

  const keyMappings = {
    SEQUENCE: "Sequence",
    STAGENAME: "Stage Name",
    STARTDATE: "Start Date",
    ENDDATE: "End Date",
    STAGEUSER: "Stage User",
    STAGESTATUS: "Stage Status",
    COMMENTS: "Comments"
  };

  const columns: ColumnDef<any>[] = [
    { id: "actions", header: "Actions" },
    { accessorKey: "SEQUENCE", header: "Sequence" },
    { accessorKey: "STAGENAME", header: "Stage Name" },
    { 
      accessorKey: "STARTDATE", 
      header: "Start Date",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        if (!val) return "-";
        const formatted = formatDateTimeKSA(val);
        const [datePart, timePart] = formatted.split(" ");
        return (
          <div className="flex gap-1.5 items-center whitespace-nowrap">
            <span>{datePart}</span>
            {timePart && <span className="font-bold">{timePart}</span>}
          </div>
        );
      }
    },
    { 
      accessorKey: "ENDDATE", 
      header: "End Date",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        if (!val) return "-";
        const formatted = formatDateTimeKSA(val);
        const [datePart, timePart] = formatted.split(" ");
        return (
          <div className="flex gap-1.5 items-center whitespace-nowrap">
            <span>{datePart}</span>
            {timePart && <span className="font-bold">{timePart}</span>}
          </div>
        );
      }
    },
    { accessorKey: "STAGEUSER", header: "User" },
    { 
      accessorKey: "STAGESTATUS", 
      header: "Status",
      cell: ({ getValue }) => {
        const status = (getValue() as string) || "Pending";
        const upperStatus = status.toUpperCase();
        const isCompleted = upperStatus === "COMPLETED" || upperStatus === "COMPLETE";
        const isRejected = upperStatus === "REJECTED" || upperStatus === "REJECT";
        
        let colorClass = "";
        let dotColor = "";
        
        if (isCompleted) {
          colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30";
          dotColor = "bg-emerald-500";
        } else if (isRejected) {
          colorClass = "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-[0_0_15px_rgba(243,33,113,0.15)] dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30";
          dotColor = "bg-rose-500";
        } else {
          colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30";
          dotColor = "bg-amber-500";
        }

        return (
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 border ${colorClass}`}
          >
            <span className={`relative flex h-2 w-2`}>
              {isCompleted && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
            </span>
            {status}
          </span>
        );
      }
    },
    { accessorKey: "COMMENTS", header: "Comments" },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <ReusableDataTable
        title="Contract Audit Trail"
        initialData={data}
        columns={columns}
        keyMappings={keyMappings}
        loading={loading}
      />
    </div>
  );
}
