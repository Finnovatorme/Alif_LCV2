"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Wallet } from "lucide-react";
import { getCustomerDetails } from "../../HandlingAPIs";
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
        const response = await getCustomerDetails({ CIFID: cifId, language });
        setData(response?.CustomerIncome || []);
      } catch (error) {
        toast.error("Failed to fetch income details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
