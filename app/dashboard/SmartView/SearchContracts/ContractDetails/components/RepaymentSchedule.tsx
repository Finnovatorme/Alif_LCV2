"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Calendar, Layers, Box, Eye } from "lucide-react";
import {
  getCustomerContractRepayScheduleConsolidated,
  getCustomerContractRepayScheduleAssetWise,
  getRepaymentSchedule,
} from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateKSA } from "@/utils/helpers";

export default function RepaymentSchedule({ loanId, cifId }: { loanId: string; cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"consolidated" | "assetwise">("consolidated");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [consolidatedRes, assetwiseRes] = await Promise.all([
          getCustomerContractRepayScheduleConsolidated({ LOANID: loanId, CIFID: cifId, language }),
          getCustomerContractRepayScheduleAssetWise({ LOANID: loanId, CIFID: cifId, language }),
        ]);

        setData({
          Consolidated: Array.isArray(consolidatedRes) ? consolidatedRes : (consolidatedRes?.Consolidated || []),
          AssetWise: Array.isArray(assetwiseRes) ? assetwiseRes : (assetwiseRes?.AssetWise || []),
        });
      } catch (error) {
        toast.error("Failed to fetch repayment schedule");
      } finally {
        setLoading(false);
      }
    };
    if (loanId || cifId) {
      fetchData();
    }
  }, [loanId, cifId, language]);

  const consolidatedKeyMappings = {
    LOANID: "Loan ID",
    INSTALMENTNUMBER: "Installment Number",
    INSTALLMENTDATE: "Installment Date",
    INSTALMENTAMOUNT: "Installment Amount",
    PRINCIPALAMOUNT: "Principal Amount",
    PROFITAMOUNT: "Profit Amount",
    TAXAMOUNT: "Tax Amount",
    BEGINNINGOS: "Beginning Outstanding",
    CLOSINGOS: "Closing Outstanding",
    PRINCIPALAMOUNTPAID: "Principal Amount Paid",
    PROFITAMOUNTPAID: "Profit Amount Paid",
    PAIDFLAG: "Paid Status",
    PAIDDATE: "Paid Date"
  };

  const assetwiseKeyMappings = {
    LOANID: "Loan ID",
    ASSETNAME: "Asset Name",
    INSTALMENTNUMBER: "Installment Number",
    INSTALLMENTDATE: "Installment Date",
    INSTALMENTAMOUNT: "Installment Amount",
    PRINCIPALAMOUNTPAID: "Principal Amount Paid",
    RESIDUALAMOUNT: "Residual Amount"
  };

  const consolidatedColumns: ColumnDef<any>[] = [
    { id: "actions", header: "Actions" },
    { accessorKey: "LOANID", header: "Loan ID" },
    { accessorKey: "INSTALMENTNUMBER", header: "Installment Number" },
    { 
      accessorKey: "INSTALLMENTDATE", 
      header: "Installment Date",
      cell: ({ getValue }) => formatDateKSA(getValue() as string)
    },
    { accessorKey: "INSTALMENTAMOUNT", header: "Installment Amount" },
    { accessorKey: "PRINCIPALAMOUNT", header: "Principal Amount" },
    { accessorKey: "PROFITAMOUNT", header: "Profit Amount" },
    { accessorKey: "TAXAMOUNT", header: "Tax Amount" },
    { accessorKey: "BEGINNINGOS", header: "Beginning Os" },
    { accessorKey: "CLOSINGOS", header: "Closing Os" },
  ];

  const assetwiseColumns: ColumnDef<any>[] = [
    { id: "actions", header: "Actions" },
    { accessorKey: "LOANID", header: "Loan ID" },
    { accessorKey: "ASSETNAME", header: "Asset Name" },
    { accessorKey: "INSTALMENTNUMBER", header: "Installment Number" },
    { 
      accessorKey: "INSTALLMENTDATE", 
      header: "Installment Date",
      cell: ({ getValue }) => formatDateKSA(getValue() as string)
    },
    { accessorKey: "INSTALMENTAMOUNT", header: "Installment Amount" },
    { accessorKey: "PRINCIPALAMOUNTPAID", header: "Principal Amount Paid" },
    { accessorKey: "RESIDUALAMOUNT", header: "Residual Amount" },
  ];

  const consolidatedData = (data?.data?.Consolidated || data?.Consolidated || []).map((item: any, idx: number) => ({ ...item, id: idx + 1 }));
  const assetwiseData = (data?.data?.AssetWise || data?.AssetWise || []).map((item: any, idx: number) => ({ ...item, id: idx + 1 }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 shadow-inner">
        <button
          onClick={() => setActiveSubTab("consolidated")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeSubTab === "consolidated"
              ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-md scale-[1.01]"
              : "text-slate-600 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          Consolidated
        </button>
        <button
          onClick={() => setActiveSubTab("assetwise")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeSubTab === "assetwise"
              ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-md scale-[1.01]"
              : "text-slate-600 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Box className="w-4 h-4" />
          Asset Wise
        </button>
      </div>

      <div className="animate-in fade-in duration-500">
        <ReusableDataTable
          title={activeSubTab === "consolidated" ? "Consolidated Schedule" : "Asset Wise Schedule"}
          initialData={activeSubTab === "consolidated" ? consolidatedData : assetwiseData}
          columns={activeSubTab === "consolidated" ? consolidatedColumns : assetwiseColumns}
          keyMappings={activeSubTab === "consolidated" ? consolidatedKeyMappings : assetwiseKeyMappings}
          loading={loading}
        />
      </div>
    </div>
  );
}
