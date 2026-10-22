"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Wallet } from "lucide-react";
import { getCustomerIncome, getCustomerDetails } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";

export default function IncomeDetails({ cifId }: { cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerIncome({ CIFID: cifId, language });
        let incomeList: any[] = [];
        if (Array.isArray(response) && response.length > 0) {
          incomeList = response;
        } else if (response?.CustomerIncome && Array.isArray(response.CustomerIncome)) {
          incomeList = response.CustomerIncome;
        } else if (response?.data && Array.isArray(response.data)) {
          incomeList = response.data;
        } else {
          // Fallback to getCustomerDetails if getCustomerIncome returns empty
          const fallbackRes = await getCustomerDetails({ CIFID: cifId, language });
          incomeList = fallbackRes?.CustomerIncome || (Array.isArray(fallbackRes) ? fallbackRes : []);
        }
        setData(incomeList);
      } catch (error) {
        toast.error("Failed to fetch income details");
      } finally {
        setLoading(false);
      }
    };
    if (cifId) {
      fetchData();
    }
  }, [cifId, language]);
  
  const columns: ColumnDef<any>[] = [
    // { accessorKey: "action", header: "Actions" },
    {
      id: "actions",
      header: "Actions",
    },
    { accessorKey: "PAYROLLTYPE", header: "Payroll Type" },
    { accessorKey: "PAYROLLCATEGORY", header: "Payroll Category" },
    {
      accessorKey: "PAYROLLAMOUNT",
      header: "Payroll Amount",
      cell: ({ getValue }) => (
        <span className="font-bold text-slate-900 dark:text-white">
          {getValue() as string}
        </span>
      ),
    },
    { accessorKey: "ADJUSTMENTPERCENTAGE", header: "Adjustment Percentage" },
    {
      accessorKey: "NETPAYROLLAMOUNT",
      header: "Net Payroll Amount",
      cell: ({ getValue }) => (
        <span className="font-bold text-indigo-600">
          {getValue() as string}
        </span>
      ),
    },
  ];

  const keyMappings = {
    CIFID: "CIF ID",
    PAYROLLTYPE: "Payroll Type",
    PAYROLLCATEGORY: "Payroll Category",
    PAYROLLAMOUNT: "Payroll Amount",
    ADJUSTMENTPERCENTAGE: "Adjustment Percentage",
    NETPAYROLLAMOUNT: "Net Payroll Amount",
    CONSIDERINDBR: "Consider in DBR",
    REMARKS: "Remarks",
    UPDATEDATE: "Update Date",
    RECSTATUS: "Record Status",
  };

  return (
    <ReusableDataTable
      title="Income Details"
      initialData={data}
      columns={columns}
      loading={loading}
      keyMappings={keyMappings}
    />
  );
}
