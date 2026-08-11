"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Landmark, CheckCircle2, XCircle } from "lucide-react";
import { getCustomerBank } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";

export default function BankDetails({ cifId }: { cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerBank({ CIFID: cifId, language });
        setData(response || []);
      } catch (error) {
        toast.error("Failed to fetch bank details");
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
    },
    { accessorKey: "ACCOUNTTITLE", header: "Account Title" },
    { accessorKey: "BANKNAME", header: "Bank Name" },
    { accessorKey: "BANKBRANCH", header: "Bank Branch" },
    { accessorKey: "BANKACCOUNTTYPE", header: "Bank Account Type" },
    // { accessorKey: "ACCOUNTNUMBER", header: "Account No" },
    {
      accessorKey: "ISPRIMARY",
      header: "Is Primary",
      cell: ({ getValue }) => {
        const isPrimary = getValue();
        return (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              isPrimary
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {isPrimary ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isPrimary ? "PRIMARY" : "SECONDARY"}
          </div>
        );
      },
    },
  ];

  const keyMappings = {
    CIFID: "CIF ID",
    BANKNAME: "Bank Name",
    BANKBRANCH: "Bank Branch",
    BANKCOUNTRY: "Bank Country",
    BANKCITY: "Bank City",
    BANKACCOUNTTYPE: "Bank Account Type",
    ACCOUNTTITLE: "Account Title",
    ACCOUNTNUMBER: "Account Number",
    IBAN: "IBAN",
    SWIFTCODE: "SWIFT Code",
    ACCOUNTCURRENCY: "Account Currency",
    SOURCESOFFUNDS: "Sources of Funds",
    ACCOUNTSINCE: "Account Since",
    NOOFCHEQUEBOUNCED: "Cheques Bounced",
    NOOFSALARYCREDITED: "Salaries Credited",
    AVERAGEMONTHLYBALANCE: "Avg Monthly Balance",
    NETCREDITS: "Net Credits",
    NETDEBITS: "Net Debits",
    REMARKS: "Remarks",
    ISPRIMARY: "Is Primary",
    UPDATEDATE: "Update Date",
    RECSTATUS: "Record Status",
  };

  return (
    <ReusableDataTable
      title="Bank Accounts"
      initialData={data}
      columns={columns}
      loading={loading}
      keyMappings={keyMappings}
    />
  );
}
