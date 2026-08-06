"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Wallet, Eye } from "lucide-react";
import { getCustomerContractReceivables } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateKSA } from "@/utils/helpers";

export default function Receivables({
  loanId,
  cifId,
}: {
  loanId: string;
  cifId: string;
}) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerContractReceivables({
          LOANID: loanId,
          CIFID: cifId,
          language,
        });
        const list = Array.isArray(response)
          ? response
          : response?.data?.data || response?.data || [];
        setData(
          list.map((item: any, idx: number) => ({ ...item, id: idx + 1 })),
        );
      } catch (error) {
        toast.error("Failed to fetch receivables");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loanId, cifId, language]);

  const keyMappings = {
    DUEID: "Due ID",
    DUEDATE: "Due Date",
    DUEAMOUNT: "Due Amount",
    PAIDAMOUNT: "Paid Amount",
    WAIVEDAMOUNT: "Waived Amount",
    WAIVEDDATE: "Waived Date",
    PAIDFLAG: "Paid Status"
  };

  const columns: ColumnDef<any>[] = [
    { id: "actions", header: "Actions" },
    { accessorKey: "DUEID", header: "Due ID" },
    {
      accessorKey: "DUEDATE",
      header: "Due Date",
      cell: ({ getValue }) => formatDateKSA(getValue() as string),
    },
    { 
      accessorKey: "DUEAMOUNT", 
      header: "Due Amount",
      cell: ({ getValue }) => (getValue() ? Number(getValue()).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00")
    },
    { 
      accessorKey: "PAIDAMOUNT", 
      header: "Paid Amount",
      cell: ({ getValue }) => (getValue() ? Number(getValue()).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00")
    },
    { 
      accessorKey: "WAIVEDAMOUNT", 
      header: "Waived Amount",
      cell: ({ getValue }) => (getValue() ? Number(getValue()).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00")
    },
    {
      accessorKey: "WAIVEDDATE",
      header: "Waived Date",
      cell: ({ getValue }) => getValue() ? formatDateKSA(getValue() as string) : "-",
    },
    { 
      accessorKey: "PAIDFLAG", 
      header: "Status",
      cell: ({ getValue }) => {
        const isPaid = getValue() === "Y" || getValue() === "Yes" || getValue() === 1;
        return (
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 border ${
              isPaid
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                : "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
            }`}
          >
            <span className={`relative flex h-2 w-2`}>
              {isPaid && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaid ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            </span>
            {isPaid ? "Paid" : "Unpaid"}
          </span>
        );
      }
    },
  ];

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-white dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-500">
      <ReusableDataTable
        title="Contract Receivables"
        initialData={data}
        columns={columns}
        keyMappings={keyMappings}
        loading={loading}
      />
    </div>
  );
}
