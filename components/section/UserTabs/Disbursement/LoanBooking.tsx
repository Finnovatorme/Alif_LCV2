"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loanBookingGet } from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import axios from "axios";
import { EditModal } from "@/components/ui/editmodal";
import type { FieldConfig as BaseFieldConfig } from "@/types/field.types";
import { fetchAppCifOptions } from "@/utils/dropDownApis";

type Option = { value: number | string; label: string };
const toBool = (v: any) => v === true || v === 1 || v === "1" || v === "true";

export type ApiLoanBooking = {
  TDBRECID?: number;
  APPCIFID?: number;
  LOANBOOKED?: boolean;
  LOANREFERENCENUMBER?: string;
  LOANBOOKDATE?: string;
  RECSTATUS?: boolean;
  [key: string]: any;
};

interface LoanBookingRow extends ApiLoanBooking {
  id: number;

  // form keys
  Appcifid?: number | string;
  Loanbooked?: boolean;
  Loanreferencenumber?: string;
  Loanbookdate?: string;
}

/* ✅ TS FIX #1: allow "section" in fields */
type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

export default function LoanBooking() {
  const router = useRouter();
  const appParams = useSelector(dashboardParams);
  const language = useSelector(languageParams);

  const [records, setRecords] = useState<LoanBookingRow[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<LoanBookingRow | null>(
    null,
  );
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [appCifOptions, setAppCifOptions] = useState<Option[]>([]);
  const hasFetched = useRef(false);

  /* ✅ fetch dropdown values */
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    (async () => {
      try {
        const options = await fetchAppCifOptions();
        setAppCifOptions(options);
      } catch (e) {
        console.error("fetchAppCifOptions failed", e);
      }
    })();
  }, []);

  const toNum = (v: any, fallback = 0) => {
    if (v === "" || v === null || v === undefined) return fallback;
    if (typeof v === "object") v = v?.value ?? v;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fetchRecords = async () => {
    if (!appParams?.APPID) return;

    try {
      setLoading(true);

      const params = { APPID: appParams.APPID, language };
      const response = await loanBookingGet(params);

      const data = Array.isArray(response) ? response : [];

      const mapped: LoanBookingRow[] = data.map((item: any) => ({
        ...item,
        id: toNum(item.TDBRECID),

        // normalized form keys
        Appcifid: item.APPCIFID,
        Loanreferencenumber: item.LOANREFERENCENUMBER ?? "",
        Loanbookdate: item.LOANBOOKDATE ?? null,
        Loanbooked: toBool(item.LOANBOOKED),
      }));

      setRecords(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appParams?.APPID) {
      fetchRecords();
    }
  }, [appParams?.APPID, language]);

  // ✅ Columns
  const columns: ColumnDef<LoanBookingRow>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,
      { accessorKey: "TDBRECID", header: "Loan Booking Rec ID" },
      { accessorKey: "LOANREFERENCENUMBER", header: "Loan Reference Number" },
      { accessorKey: "LOANBOOKDATE", header: "Loan Book Date" },
      {
        accessorKey: "LOANBOOKED",
        header: "Loan Booked",
        /* ✅ TS FIX #2: type the cell param so `row` is not implicit any */
        cell: ({ row }: CellContext<LoanBookingRow, unknown>) => {
          const value = Boolean(row.original.LOANBOOKED);
          return (
            <div className="flex items-center justify-start">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border shadow-sm ${
                  value
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-700 border-rose-200/50 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
                }`}
              >
                <span className={`relative flex w-2 h-2`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${value ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                  <span className={`relative inline-flex rounded-full w-2 h-2 ${value ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                </span>
                {value ? "Booked" : "Not Booked"}
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  // ✅ Form Fields
  const fields: UiFieldConfig[] = useMemo(
    () => [
      {
        type: "section",
        title: "Loan Booking",
        fields: [
          {
            type: "select",
            name: "Appcifid",
            label: "App CIF Id",
            required: true,
            options: appCifOptions,
            placeholder: "Select App CIF",
          } as any,
          {
            type: "input",
            name: "Loanreferencenumber",
            label: "Loan Reference Number",
          } as any,
          {
            type: "date",
            name: "Loanbookdate",
            label: "Loan Book Date",
          } as any,
          {
            type: "switch",
            name: "Loanbooked",
            label: "Loan Booked",
          } as any,
        ],
      },
    ],
    [appCifOptions],
  );

  // ✅ Open EDIT (prefilled)
  const openEdit = (row: LoanBookingRow) => {
    setSelectedRecord({
      ...row,
      TDBRECID: row.TDBRECID,
      Appcifid: row.APPCIFID ?? row.Appcifid,
      Loanreferencenumber: row.LOANREFERENCENUMBER ?? row.Loanreferencenumber,
      Loanbookdate: row.LOANBOOKDATE ?? row.Loanbookdate,
      Loanbooked: toBool(row.LOANBOOKED ?? row.Loanbooked),
    });
    setEditModalOpen(true);
  };
  const keyMappings = {
    TDFRECID: "TDF Record ID",
    APPID: "Application ID",
    APPCIFID: "Application CIF ID",
    TCFBRECIDFROM: "TCFB Record ID (From)",
    IBAN: "IBAN",
    NETAMOUNT: "Net Amount",
    LOANBOOKDATE: "Loan Book Date",
    TRANSFERINTERVAL: "Transfer Interval",
    PROCESSIDFUNDING: "Process ID (Funding)",
    AMOUNTTRANSFERRED: "Amount Transferred",
    TRANSFERDATE: "Transfer Date",
    TRANSFERREFERENCE: "Transfer Reference",
    OTHDESC1: "Other Description 1",
    OTHDESC2: "Other Description 2",
    OTHDESC3: "Other Description 3",
    MAKER: "Maker",
    MAKEDATE: "Make Date",
    UPDATEBY: "Updated By",
    UPDATEDATE: "Updated Date",
    RECSTATUS: "Record Status",
  };

  const openAdd = () => {
    setSelectedRecord(null);
    setEditModalOpen(true);
  };

  // ✅ Submit (ADD + EDIT)
  const handleFormSubmit = async (data: any): Promise<void> => {
    const recId = toNum(selectedRecord?.TDBRECID, 0); // ✅ the real id
    const apCifToSend = toNum(data.Appcifid, 0);

    if (!apCifToSend) {
      toast.error("App CIF Id is required");
      return;
    }

    const authData = localStorage.getItem("authData");
    const auth = authData ? JSON.parse(authData) : {};
    const makerName = auth?.user?.username || "aadnan";

    const payload = {
      APPCIFID: apCifToSend,
      APPID: toNum(appParams?.APPID, 0),
      LOANREFERENCENUMBER: data.Loanreferencenumber ?? "",
      LOANBOOKDATE: data.Loanbookdate ?? null,
      LOANBOOKED: toBool(data.Loanbooked),
      RECSTATUS: true,
      MAKEDATE: new Date().toISOString(),
      MAKER: makerName,
      UPDATEBY: makerName,
      UPDATEDATE: new Date().toISOString(),
    };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      
      if (recId) {
        // --- UPDATING IS CURRENTLY DISABLED ---
        // await axios.put(
        //   `${baseUrl}/api/DisbursmentLoanBooking?TDBRECID=${recId}`,
        //   payload,
        // );
        // toast.success("Record Updated");
        toast.info("Update and Delete functionality is currently disabled");
      } else {
        await axios.post(`${baseUrl}/api/DisbursmentLoanBooking`, payload);
        toast.success("Record Added");
      }

      await fetchRecords();
      setEditModalOpen(false);
      setSelectedRecord(null);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.data ||
          err?.response?.data?.message ||
          "Operation Failed",
      );
    }
  };

  return (
    <>
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Loan Booking</h1>
        </div>

        <Button onClick={openAdd}>Add New Record</Button>
      </div>

      <ReusableDataTable<LoanBookingRow>
        initialData={records}
        keyMappings={keyMappings}
        columns={columns}
        loading={loading}
        pageSizeOptions={[5, 10, 20]}
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        data={selectedRecord}
        /* ✅ section fields are supported by your EditModal usage pattern */
        fields={fields as any}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
