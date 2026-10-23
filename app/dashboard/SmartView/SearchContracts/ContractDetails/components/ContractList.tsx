"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { FileText, ArrowRight } from "lucide-react";
import { getCustomerContractsList } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ContractList({ cifId, onSelectLoan }: { cifId: string; onSelectLoan?: (loan: any) => void }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response: any = await getCustomerContractsList({
          CIFID: cifId,
          language: language === "ar" ? 2 : 1,
        });

        if (Array.isArray(response)) {
          setData(response);
        } else if (response?.ContractList && Array.isArray(response.ContractList)) {
          setData(response.ContractList);
        } else if (response?.data && Array.isArray(response.data)) {
          setData(response.data);
        } else if (response && typeof response === "object" && !response.error) {
          // If response object has array values
          const firstArray = Object.values(response).find((val) => Array.isArray(val));
          if (firstArray) {
            setData(firstArray as any[]);
          } else {
            setData([]);
          }
        } else {
          setData([]);
        }
      } catch (error) {
        toast.error("Failed to fetch contract list");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cifId, language]);

  const columns: ColumnDef<any>[] = [
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectLoan?.(row.original)}
          className="rounded-lg h-8 px-4 text-xs font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all active:scale-95"
        >
          Details
        </Button>
      ),
    },
    { accessorKey: "APPID", header: "App ID" },
    { accessorKey: "LOANID", header: "Loan ID" },
    { accessorKey: "LOANREFERENCENO", header: "Loan Ref No" },
    { accessorKey: "TOTALLOANAMOUNT", header: "Total Loan Amount" },
    { accessorKey: "INSTALLMENTAMOUNT", header: "Installment Amount" },
    { accessorKey: "INSTALLMENTOVERDUEAMOUNT", header: "Overdue Amount" },
    {
      accessorKey: "LOANSTATUS",
      header: "Loan Status",
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const isActive = status === "Active";
        return (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 border ${
              isActive
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                : "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
            }`}
          >
            <span className={`relative flex h-2 w-2`}>
              {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            </span>
            {status || "Inactive"}
          </div>
        );
      },
    },
    {
      accessorKey: "LOANSUBSTATUS",
      header: "Sub Status",
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const isActive = status === "Active";
        return (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 border ${
              isActive
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                : "bg-slate-500/10 text-slate-600 border-slate-500/20 shadow-sm dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
            }`}
          >
            <span className={`relative flex h-2 w-2`}>
              {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? "bg-emerald-500" : "bg-slate-500"}`}></span>
            </span>
            {status || "-"}
          </div>
        );
      },
    },
  ];

  const keyMappings = {
    CIFID: "CIF ID",
    APPID: "Application ID",
    LOANID: "Loan ID",
    LOANREFERENCENO: "Loan Reference Number",
    LOANSTATUS: "Loan Status",
    LOANSUBSTATUS: "Loan Substatus",
    LOANAMOUNT: "Loan Amount",
    TOTALLOANAMOUNT: "Total Loan Amount",
    INSTALLMENTAMOUNT: "Installment Amount",
    INSTALLMENTOVERDUEAMOUNT: "Installment Overdue Amount",
    CHARGESOVERDUEAMOUNT: "Charges Overdue Amount",
    EXCESSAMOUNT: "Excess Amount",
    DPD: "Days Past Due",
  };

  return (
    <ReusableDataTable
      title="Contracts List"
      initialData={data}
      columns={columns}
      loading={loading}
      keyMappings={keyMappings}
    />
  );
}
