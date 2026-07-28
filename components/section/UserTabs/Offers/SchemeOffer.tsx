"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";

// ✅ use your centralized GET function
import { schemesOffersGet } from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type ApiRow = {
  TASORECID?: number | null;
  RECID?: number | null;
  ID?: number | null;

  APPID?: number | null;

  SCHEMEID?: number | null;
  REQUESTAMOUNT?: number | null;
  REQUESTTENURE?: number | null;

  DOWNPAYMENTAMOUNT?: number | null;
  RESIDUALAMOUNT?: number | null;
  INSURANCEAMOUNT?: number | null;
  ASSETAMOUNT?: number | null;
  TAXAMOUNT?: number | null;

  PROFITRATE?: number | null;
  PROFITIRR?: number | null;
  PROFITAPR?: number | null;

  PRINCIPALAMOUNT?: number | null;
  PROFITAMOUNT?: number | null;
  TOTALLOANAMOUNT?: number | null;

  INSTALLMENTAMOUNT?: number | null;

  DISPOSABLEINCOME?: number | null;
  ELIGIBLEMAXDBR?: number | null;
  ACTUALCALCDBR?: number | null;

  SELECTED?: boolean | number | string | null;
  RECSTATUS?: boolean | number | string | null;

  OTHDESC1?: string | null;
  OTHDESC2?: string | null;
  OTHDESC3?: string | null;

  UPDATEBY?: string | null;
  UPDATEDATE?: string | null;

  [key: string]: any;
};

type Row = ApiRow & {
  _uiId: number;

  SCHEMEID: number;
  REQUESTAMOUNT: number | null;
  REQUESTTENURE: number | null;
  INSTALLMENTAMOUNT: number | null;
  PROFITRATE: number | null;

  SELECTED: boolean;
  RECSTATUS: boolean;

  APPID: number | null;

  DOWNPAYMENTAMOUNT: number | null;
  RESIDUALAMOUNT: number | null;
  INSURANCEAMOUNT: number | null;
  ASSETAMOUNT: number | null;
  TAXAMOUNT: number | null;

  PROFITIRR: number | null;
  PROFITAPR: number | null;

  PRINCIPALAMOUNT: number | null;
  PROFITAMOUNT: number | null;
  TOTALLOANAMOUNT: number | null;

  DISPOSABLEINCOME: number | null;
  ELIGIBLEMAXDBR: number | null;
  ACTUALCALCDBR: number | null;

  OTHDESC1: string;
  OTHDESC2: string;
  OTHDESC3: string;

  UPDATEBY: string;
  UPDATEDATE: string;
};

/* ---------------- helpers ---------------- */
const toNum = (v: any, fallback: number | null = null) => {
  if (v === "" || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const toBool = (v: any) => v === true || v === 1 || v === "1";

function buildErrorMsg(server: any, fallback = "Operation failed") {
  if (!server) return fallback;

  if (server?.errors && typeof server.errors === "object") {
    const msg = Object.entries(server.errors)
      .map(([k, v]: any) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join(" | ");
    return msg || fallback;
  }

  return (
    server?.title ||
    server?.message ||
    server?.data ||
    server?.error ||
    fallback
  );
}

/* ✅ same APPID resolver pattern */
function resolveAppId(propAppId?: string | number, tab?: any) {
  if (propAppId !== undefined && propAppId !== null && propAppId !== "")
    return String(propAppId);

  const fromTab =
    tab?.APPID ?? tab?.AppId ?? tab?.appId ?? tab?.TWTRECID ?? tab?.twtRecId;
  if (fromTab !== undefined && fromTab !== null && fromTab !== "")
    return String(fromTab);

  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const q =
      url.searchParams.get("APPID") ||
      url.searchParams.get("appId") ||
      url.searchParams.get("appid");
    if (q) return q;

    const ls =
      localStorage.getItem("APPID") ||
      localStorage.getItem("appId") ||
      localStorage.getItem("selectedAppId");
    if (ls) return ls;
  }

  return "";
}

export default function SchemeOffer({
  tab,
  appId,
}: {
  tab?: any;
  appId?: any;
}) {
  const router = useRouter();

  const language = 1;

  const [resolvedAppId, setResolvedAppId] = useState<string>("");
  const [records, setRecords] = useState<Row[]>([]);
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const hasFetched = useRef(false);

  useEffect(() => {
    setResolvedAppId(resolveAppId(appId, tab));
  }, [appId, tab]);

  /* ---------------- GET via your function ---------------- */
  const fetchRecords = useCallback(async () => {
    if (!resolvedAppId) return;

    try {
      setLoading(true);

      const params = { APPID: resolvedAppId, language };
      const res = await schemesOffersGet(params);

      // your function returns {error: "..."} on catch
      if ((res as any)?.error) {
        toast.error((res as any)?.error || "Failed to fetch data");
        setRecords([]);
        return;
      }

      const data: ApiRow[] = Array.isArray(res) ? (res as ApiRow[]) : [];

      const mapped: Row[] = data.map((item, idx) => ({
        ...item,
        _uiId: idx + 1,

        APPID: toNum(item.APPID, toNum(resolvedAppId, null)),

        SCHEMEID: toNum(item.SCHEMEID, 0) ?? 0,
        REQUESTAMOUNT: toNum(item.REQUESTAMOUNT, null),
        REQUESTTENURE: toNum(item.REQUESTTENURE, null),
        INSTALLMENTAMOUNT: toNum(item.INSTALLMENTAMOUNT, null),
        PROFITRATE: toNum(item.PROFITRATE, null),

        SELECTED: toBool(item.SELECTED),
        RECSTATUS: toBool(item.RECSTATUS),

        DOWNPAYMENTAMOUNT: toNum(item.DOWNPAYMENTAMOUNT, null),
        RESIDUALAMOUNT: toNum(item.RESIDUALAMOUNT, null),
        INSURANCEAMOUNT: toNum(item.INSURANCEAMOUNT, null),
        ASSETAMOUNT: toNum(item.ASSETAMOUNT, null),
        TAXAMOUNT: toNum(item.TAXAMOUNT, null),

        PROFITIRR: toNum(item.PROFITIRR, null),
        PROFITAPR: toNum(item.PROFITAPR, null),

        PRINCIPALAMOUNT: toNum(item.PRINCIPALAMOUNT, null),
        PROFITAMOUNT: toNum(item.PROFITAMOUNT, null),
        TOTALLOANAMOUNT: toNum(item.TOTALLOANAMOUNT, null),

        DISPOSABLEINCOME: toNum(item.DISPOSABLEINCOME, null),
        ELIGIBLEMAXDBR: toNum(item.ELIGIBLEMAXDBR, null),
        ACTUALCALCDBR: toNum(item.ACTUALCALCDBR, null),

        OTHDESC1: item.OTHDESC1 ?? "",
        OTHDESC2: item.OTHDESC2 ?? "",
        OTHDESC3: item.OTHDESC3 ?? "",

        UPDATEBY: item.UPDATEBY ?? "",
        UPDATEDATE: item.UPDATEDATE ?? "",
      }));

      setRecords(mapped);
      mapped.length
        ? toast.success("Data fetched")
        : toast.info("No data found");
    } catch (e: any) {
      console.error("Fetch Error:", e?.response?.data ?? e);
      setRecords([]);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [resolvedAppId, language]);

  useEffect(() => {
    if (!resolvedAppId) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchRecords();
  }, [fetchRecords, language]);

  /* ---------------- TABLE columns ---------------- */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      { accessorKey: "SCHEMEID", header: "Scheme ID" },
      { accessorKey: "REQUESTAMOUNT", header: "Request Amount" },
      { accessorKey: "REQUESTTENURE", header: "Request Tenure" },
      { accessorKey: "INSTALLMENTAMOUNT", header: "Installment Amount" },
      { accessorKey: "PROFITRATE", header: "Profit Rate" },

      {
        accessorKey: "SELECTED",
        header: "Selected",
        cell: ({ row }: CellContext<Row, unknown>) => {
          const value = Boolean(row.original.SELECTED);
          return (
            <span
              className={`inline-flex items-center justify-center px-3 py-1 text-sm rounded font-extrabold ${value
                  ? "text-[#00c04b] bg-[#cefad0]"
                  : "text-[#df2c14] bg-[#ffc9bb]"
                }`}
            >
              {value ? "Selected" : "Not Selected"}
            </span>
          );
        },
      },

      {
        accessorKey: "RECSTATUS",
        header: "Record Status",
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
        ),
      },
    ],
    [],
  );

  /* ---------------- keyMappings ---------------- */
  const keyMappings = useMemo(
    () => ({
      TASORECID: "TASO REC ID",
      APPID: "App ID",
      SCHEMEID: "Scheme ID",
      REQUESTAMOUNT: "Request Amount",
      REQUESTTENURE: "Request Tenure",
      DOWNPAYMENTAMOUNT: "Downpayment Amount",
      RESIDUALAMOUNT: "Residual Amount",
      INSURANCEAMOUNT: "Insurance Amount",
      ASSETAMOUNT: "Asset Amount",
      TAXAMOUNT: "Tax Amount",
      PROFITRATE: "Profit Rate",
      PROFITIRR: "Profit IRR",
      PROFITAPR: "Profit APR",
      PRINCIPALAMOUNT: "Principal Amount",
      PROFITAMOUNT: "Profit Amount",
      TOTALLOANAMOUNT: "Total Loan Amount",
      INSTALLMENTAMOUNT: "Installment Amount",
      DISPOSABLEINCOME: "Disposable Income",
      ELIGIBLEMAXDBR: "Eligible Max DBR",
      ACTUALCALCDBR: "Actual Calculated DBR",
      SELECTED: "Selected",
      OTHDESC1: "Other Description 1",
      OTHDESC2: "Other Description 2",
      OTHDESC3: "Other Description 3",
      UPDATEBY: "Update By",
      UPDATEDATE: "Update Date",
      RECSTATUS: "Record Status",
    }),
    [],
  );

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (row: Row) => {
    const serverId = row.TASORECID ?? row.RECID ?? row.ID ?? null;
    if (!serverId) return toast.error("Record id not found");

    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      await axios.delete(`/api/ApplSchemeOffer/${serverId}`);
      toast.success("Record Deleted");
      await fetchRecords();
    } catch (e1: any) {
      try {
        await axios.delete(`/api/ApplSchemeOffer?RECID=${serverId}`);
        toast.success("Record Deleted");
        await fetchRecords();
      } catch (e2: any) {
        const server = e2?.response?.data ?? e1?.response?.data;
        console.error("Delete Error:", server ?? e2 ?? e1);
        toast.error("Delete Failed", {
          description: buildErrorMsg(server, "Could not delete the record."),
        });
      }
    }
  };

  if (!resolvedAppId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Waiting for APPID…
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Scheme Offer</h1>
        </div>
      </div>

      <ReusableDataTable<Row>
        initialData={records}
        columns={columns}
        loading={loading}
        keyMappings={keyMappings}
        onSelectionChange={setSelectedRows}
        onDelete={handleDelete}
        pageSizeOptions={[5, 10, 20]}
      />
    </>
  );
}
