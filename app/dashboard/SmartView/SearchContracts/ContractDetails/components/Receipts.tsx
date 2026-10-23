"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Receipt, Eye } from "lucide-react";
import { getCustomerContractReceipts, getReceipts } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateKSA } from "@/utils/helpers";

export default function Receipts({
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
        const response = await getCustomerContractReceipts({
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
        toast.error("Failed to fetch receipts");
      } finally {
        setLoading(false);
      }
    };
    if (loanId || cifId) {
      fetchData();
    }
  }, [loanId, cifId, language]);

  const keyMappings = {
    RECEIPTPID: "Receipt PID",
    RECEIPTVOUCHERTYPE: "Voucher Type",
    RECEIVABLETYPE: "Receivable Type",
    PAYMENTDATE: "Payment Date",
    RECEIPTAMOUNT: "Receipt Amount",
    BANKNAME: "Bank Name",
    ACCOUNTNUMBER: "Account Number",
    RECEIPTSTATUS: "Status"
  };

  const columns: ColumnDef<any>[] = [
    { id: "actions", header: "Actions" },
    { accessorKey: "RECEIPTPID", header: "Receipt PID" },
    { accessorKey: "RECEIPTVOUCHERTYPE", header: "Voucher Type" },
    { accessorKey: "RECEIVABLETYPE", header: "Receivable Type" },
    { 
      accessorKey: "PAYMENTDATE", 
      header: "Payment Date",
      cell: ({ getValue }) => formatDateKSA(getValue() as string)
    },
    { 
      accessorKey: "RECEIPTAMOUNT", 
      header: "Amount",
      cell: ({ getValue }) => (getValue() ? Number(getValue()).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00")
    },
    { accessorKey: "BANKNAME", header: "Bank Name" },
    { accessorKey: "ACCOUNTNUMBER", header: "Account No" },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <ReusableDataTable
        title="Receipts History"
        initialData={data}
        columns={columns}
        keyMappings={keyMappings}
        loading={loading}
      />
    </div>
  );
}
