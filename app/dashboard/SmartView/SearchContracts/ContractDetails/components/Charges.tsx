"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { CreditCard, Eye } from "lucide-react";
import { getCustomerContractCharges } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateKSA } from "@/utils/helpers";

export default function Charges({ loanId, cifId }: { loanId: string; cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerContractCharges({ LOANID: loanId, CIFID: cifId, language });
        const list = Array.isArray(response) ? response : (response?.data?.data || response?.data || []);
        setData(list.map((item: any, idx: number) => ({ ...item, id: idx + 1 })));
      } catch (error) {
        toast.error("Failed to fetch charges");
      } finally {
        setLoading(false);
      }
    };
    if (loanId || cifId) {
      fetchData();
    }
  }, [loanId, cifId, language]);

  const keyMappings = {
    CHARGERECID: "Charge RecID",
    CHARGEENAME: "Charge Name",
    RECEIVABLETYPE: "Receivable Type",
    DUEAMOUNT: "Due Amount",
    DUEDATE: "Due Date",
    POSTEDDATE: "Posted Date"
  };

  const columns: ColumnDef<any>[] = [
    { id: "actions", header: "Actions" },
    { accessorKey: "CHARGERECID", header: "Charge RecID" },
    { accessorKey: "CHARGEENAME", header: "Charge Name" },
    { accessorKey: "RECEIVABLETYPE", header: "Receivable Type" },
    { 
      accessorKey: "DUEAMOUNT", 
      header: "Due Amount",
      cell: ({ getValue }) => (getValue() ? Number(getValue()).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00")
    },
    { 
      accessorKey: "DUEDATE", 
      header: "Due Date",
      cell: ({ getValue }) => formatDateKSA(getValue() as string)
    },
    { 
      accessorKey: "POSTEDDATE", 
      header: "Posted Date",
      cell: ({ getValue }) => formatDateKSA(getValue() as string)
    },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <ReusableDataTable
        title="Contract Charges"
        initialData={data}
        columns={columns}
        keyMappings={keyMappings}
        loading={loading}
      />
    </div>
  );
}
