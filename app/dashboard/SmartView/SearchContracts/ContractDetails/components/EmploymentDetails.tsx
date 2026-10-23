"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Briefcase, UserCheck, ShieldAlert } from "lucide-react";
import { getCustomerEmployment } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";

export default function EmploymentDetails({ cifId }: { cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerEmployment({
          CIFID: cifId,
          language,
        });
        setData(response || []);
      } catch (error) {
        toast.error("Failed to fetch employment details");
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
    { accessorKey: "EMPLOYERNAME", header: "Employer Name" },
    { accessorKey: "EMPLOYMENTTYPE", header: "Employment Type" },
    { accessorKey: "DESIGNATION", header: "Designation" },
    {
      accessorKey: "EMPLOYMENTSTATUS",
      header: "Employment Status",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        const isActive = val === "Active" || val === "Employed" || val === "Y";
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
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            }`}
          >
            {isPrimary ? (
              <UserCheck className="h-3 w-3" />
            ) : (
              <ShieldAlert className="h-3 w-3" />
            )}
            {isPrimary ? "YES" : "NO"}
          </div>
        );
      },
    },
  ];

  const keyMappings = {
    CIFID: "CIF ID",
    EMPLOYMENTSTATUS: "Employment Status",
    EMPLOYMENTTYPE: "Employment Type",
    DESIGNATION: "Designation",
    ECONOMYSECTOR: "Economy Sector",
    BUSINESSACTIVITY: "Business Activity",
    MILITARYCIVIL: "Military/Civil",
    MILITARYRANK: "Military Rank",
    EMPLOYERNAME: "Employer Name",
    EMPLOYEENUMBER: "Employee Number",
    DATEOFJOINING: "Date of Joining",
    ENDDATE: "End Date",
    YEARSATCURREMPL: "Years at Current Employment",
    REMARKS: "Remarks",
    ISPRIMARY: "Is Primary",
    UPDATEDATE: "Update Date",
    RECSTATUS: "Record Status",
  };

  return (
    <ReusableDataTable
      title="Employment History"
      initialData={data}
      columns={columns}
      loading={loading}
      keyMappings={keyMappings}
    />
  );
}
