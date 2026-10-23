"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { CreditCard } from "lucide-react";
import { getCustomerLiabilities, getCustomerDetails } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LiabilitiesDetails({ cifId }: { cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerLiabilities({ CIFID: cifId, language });
        let liabilitiesList: any[] = [];
        if (Array.isArray(response) && response.length > 0) {
          liabilitiesList = response;
        } else if (response?.CustomerLiabilities && Array.isArray(response.CustomerLiabilities)) {
          liabilitiesList = response.CustomerLiabilities;
        } else if (response?.data && Array.isArray(response.data)) {
          liabilitiesList = response.data;
        } else {
          // Fallback to getCustomerDetails if getCustomerLiabilities returns empty
          const fallbackRes = await getCustomerDetails({ CIFID: cifId, language });
          liabilitiesList = fallbackRes?.CustomerLiabilities || (Array.isArray(fallbackRes) ? fallbackRes : []);
        }
        setData(liabilitiesList);
      } catch (error) {
        toast.error("Failed to fetch liabilities details");
      } finally {
        setLoading(false);
      }
    };
    if (cifId) {
      fetchData();
    }
  }, [cifId, language]);

  const columns: ColumnDef<any>[] = [
    {
      id: "actions",
      header: "Actions",
    },
    { accessorKey: "FACILITYTYPECODE", header: "Facility Code" },
    { accessorKey: "SANCTIONAMOUNT", header: "Sanction Amount" },
    {
      accessorKey: "MATURITYDATE",
      header: "Maturity Date",
      cell: ({ getValue }) => {
        const date = getValue();
        return date ? format(new Date(date as string), "dd/MM/yyyy") : "-";
      },
    },
    {
      accessorKey: "ACCOUNTSTATUS",
      header: "Account Status",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        const isActive = val === "Active" || val === "Open" || val === "Y";
        return (
          <span
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
            {val || "Unknown"}
          </span>
        );
      },
    },
    { accessorKey: "INSTALLMENTAMOUNT", header: "Installment Amount" },
    { accessorKey: "LASTPAYMENTAMOUNT", header: "Last Payment Amount" },
  ];

  const keyMappings = {
    CIFID: "CIF ID",
    FACILITYTYPECODE: "Facility Type Code",
    PRODUCTCODE: "Product Code",
    PRODSUBTYPECODE: "Product Subtype Code",
    FINANCIERNAME: "Financier Name",
    ACCOUNTNUMBER: "Account Number",
    SANCTIONAMOUNT: "Sanction Amount",
    SANCTIONDATE: "Sanction Date",
    MATURITYDATE: "Maturity Date",
    ACCOUNTSTATUS: "Account Status",
    CLOSEDDATE: "Closed Date",
    CONTRACTTENURE: "Contract Tenure",
    FREQUENCY: "Frequency",
    INSTALLMENTAMOUNT: "Installment Amount",
    OUTSTANDINGBALANCE: "Outstanding Balance",
    OVERDUEBALANCE: "Overdue Balance",
    LASTPAYMENTAMOUNT: "Last Payment Amount",
    LASTPAYMENTDATE: "Last Payment Date",
    AVERAGEINSTALLMENT: "Average Installment",
    BALLOONPAYMENT: "Balloon Payment",
    DOWNPAYMENT: "Down Payment",
    ISDEFAULTED: "Is Defaulted",
    DEFAULTMONTHS: "Default Months",
    DEFAULTAMOUNT: "Default Amount",
    DEFAULTOSAMOUNT: "Default OS Amount",
    UPDATEDATE: "Update Date",
    RECSTATUS: "Record Status",
  };

  return (
    <ReusableDataTable
      title="Liabilities Details"
      initialData={data}
      columns={columns}
      loading={loading}
      keyMappings={keyMappings}
    />
  );
}
