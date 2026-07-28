"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { toast } from "sonner";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { EditModal } from "@/components/ui/editmodal";
import type { FieldConfig as BaseFieldConfig } from "@/types/field.types";
import { useAuth } from "@/hooks/useAuth";
import { vbValue, fetchAppCifOptions } from "@/utils/dropDownApis";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Row = Record<string, any>;
type Option = { value: string | number; label: string };

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

/* ---------------- tiny helpers ---------------- */
const str = (v: any) => (v == null ? "" : String(v));
const num = (v: any) => {
  if (v === "" || v == null) return null;
  const x = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : null;
};
const ymd = (v: any) => (v ? String(v).slice(0, 10) : "");
const safeSql = (v: any) => {
  const today = new Date().toISOString().slice(0, 10) + "T00:00:00";
  const d = ymd(v);
  if (!d) return today;
  const year = Number(d.slice(0, 4));
  return Number.isFinite(year) && year >= 1753 ? `${d}T00:00:00` : today;
};

const getAppId = (propAppId?: string | number, tab?: any) => {
  const fromProp = str(propAppId).trim();
  if (fromProp) return fromProp;

  const fromTab = str(tab?.APPID ?? tab?.AppId ?? tab?.appId).trim();
  if (fromTab) return fromTab;

  if (typeof window !== "undefined") {
    const ls = str(localStorage.getItem("selectedAppId")).trim();
    if (ls) return ls;

    const url = new URL(window.location.href);
    return str(
      url.searchParams.get("appid") || url.searchParams.get("APPID"),
    ).trim();
  }
  return "";
};

const normalizeOptions = (raw: any): Option[] => {
  const arr = Array.isArray(raw) ? raw : (raw?.data ?? raw?.DATA ?? []);
  if (!Array.isArray(arr)) return [];
  return arr
    .map((o: any) => {
      const value = o?.VBVALUE ?? o?.VALUE ?? o?.ID ?? o?.id ?? o?.value;
      const label =
        o?.VBVALUEDESC ??
        o?.VALUEDESC ??
        o?.NAME ??
        o?.name ??
        o?.label ??
        value;
      if (value == null) return null;
      return { value: String(value), label: String(label ?? value) };
    })
    .filter(Boolean) as Option[];
};

const isActive = (v: any) => v === true || v === 1 || v === "1";
const fmt = (v: any) => {
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "—";
};

/* ---------------- UI Field Types ---------------- */
type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

export default function Income({ tab, appId, translate }: any) {
  const { user } = useAuth();
  const language = useSelector(languageParams);

  const maker = useMemo(() => {
    return str(user?.UserId || user?.userId || user?.Userid || "").trim();
  }, [user]);

  const [currentAppId, setCurrentAppId] = useState("");
  const appIdNum = Number(currentAppId);

  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [ddLoading, setDdLoading] = useState(false);
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  /* ✅ APPID sync */
  useEffect(() => {
    const read = () => setCurrentAppId(getAppId(appId, tab));
    read();

    const onStorage = (e: StorageEvent) => e.key === "selectedAppId" && read();
    window.addEventListener("storage", onStorage);

    const onCustom = () => read();
    window.addEventListener("selectedAppIdChanged", onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("selectedAppIdChanged", onCustom as any);
    };
  }, [appId, tab]);

  /* ✅ dropdowns once */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setDdLoading(true);
      try {
        const [appCifOptions, b, c, d] = await Promise.all([
          fetchAppCifOptions(),
          vbValue("PAYROLLTYPE"),
          vbValue("PAYROLLCATEGORY"),
          vbValue("CURRENCY"),
        ]);
        if (!mounted) return;
        setDdValues({
          APPCIFID: appCifOptions,
          PAYROLLTYPE: normalizeOptions(b),
          PAYROLLCATEGORY: normalizeOptions(c),
          CURRENCY: normalizeOptions(d),
        });
      } catch (e) {
        console.error("ddValues fetch failed", e);
      } finally {
        if (mounted) setDdLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ✅ GET */
  const fetchRecords = useCallback(async () => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0) {
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get<Row[]>(`${API_BASE}/api/ApplCifIncome`, {
        params: { APPID: appIdNum, Language: language },
      });

      const list = (Array.isArray(data) ? data : []).map((r: any, idx) => ({
        ...r,
        id: r?.id ?? r?.TACINRECID ?? idx + 1,
      }));
      setRecords(list);
    } catch (e: any) {
      console.error("ApplCifIncome API failed", e);
      setRecords([]);
      toast.error(e?.message || "Failed to load income");
    } finally {
      setLoading(false);
    }
  }, [currentAppId, appIdNum, language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  /* ✅ columns (match your API keys) */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      {
        id: "actions",
        header: "Actions",
      } as any,
      {
        accessorKey: "TACINRECID",
        header: "Income Rec ID",
      },
      {
        accessorKey: "PAYROLLTYPE",
        header: "Payroll Type",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.PAYROLLTYPE ?? "—",
      },
      {
        accessorKey: "PAYROLLCATEGORY",
        header: "Payroll Category",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.PAYROLLCATEGORY ?? "—",
      },
      {
        accessorKey: "NETPAYROLLAMOUNT",
        header: "Net Payroll Amount",
        cell: ({ row }: CellContext<Row, unknown>) =>
          fmt(row.original?.NETPAYROLLAMOUNT),
      },
      {
        accessorKey: "CONSIDERINDBR",
        header: "Consider In DBR",
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.CONSIDERINDBR} trueText="Active" falseText="Inactive" />
        ),
      },
      {
        accessorKey: "RECSTATUS",
        header: "Record Status",
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
        ),
      },
    ],
    [translate],
  );

  /* ✅ fields (keep only what you actually use) */
  const fields: UiFieldConfig[] = useMemo(
    () => [
      {
        type: "section",
        title: translate?.("locale.global.income") ?? "Income",
        fields: [
          {
            name: "Appcifid",
            label: "App CIF ID",
            type: "select",
            options: ddValues.APPCIFID ?? [],
          },
          {
            name: "Vb_Payrolltype",
            label: "Payroll Type",
            type: "select",
            required: true,
            options: ddValues.PAYROLLTYPE ?? [],
          },
          {
            name: "Vb_Payrollcategory",
            label: "Payroll Category",
            type: "select",
            required: true,
            options: ddValues.PAYROLLCATEGORY ?? [],
          },
          {
            name: "Payrollamount",
            label: "Payroll Amount",
            type: "number",
            required: true,
          },
          {
            name: "Adjustmentpercentage",
            label: "Adjustment Percentage",
            type: "number",
            required: true,
          },
          {
            name: "Netpayrollamount",
            label: "Net Payroll Amount",
            type: "number",
          },
          {
            name: "Vb_Currency",
            label: "Currency",
            type: "select",
            options: ddValues.CURRENCY ?? [],
          },
          { name: "Considerindbr", label: "Consider In DBR", type: "switch" },
          { name: "Remarks", label: "Remarks", type: "textarea" },
          {
            name: "Tacinrecid",
            label: "Income Rec ID",
            type: "input",
            disabled: true,
          },
          { name: "Recstatus", label: "Record Status", type: "switch" },
        ],
      },
    ],
    [ddValues, translate],
  );

  /* ✅ api row -> form */
  const toForm = (row: Row) => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      Appid: appIdNum,
      Appcifid: str(row.APPCIFID ?? ""),
      Tacinrecid: str(row.TACINRECID ?? ""),
      Vb_Payrolltype: str(row.VB_PAYROLLTYPE ?? ""),
      Vb_Payrollcategory: str(row.VB_PAYROLLCATEGORY ?? ""),
      Payrollamount: str(row.PAYROLLAMOUNT ?? ""),
      Adjustmentpercentage: str(row.ADJUSTMENTPERCENTAGE ?? ""),
      Netpayrollamount: str(row.NETPAYROLLAMOUNT ?? ""),
      Vb_Currency: str(row.VB_CURRENCY ?? ""),
      Considerindbr: Boolean(row.CONSIDERINDBR ?? false),
      Remarks: str(row.REMARKS ?? ""),
      Recstatus: Boolean(row.RECSTATUS ?? true),

      // meta
      Maker: str(row.MAKER ?? maker),
      Updateby: str(row.UPDATEBY ?? maker),
      Makedate: ymd(row.MAKEDATE ?? today),
      Updatedate: ymd(row.UPDATEDATE ?? today),
      Checkdate: ymd(row.CHECKDATE ?? today),
      Checker: str(row.CHECKER ?? ""),
    };
  };

  /* ✅ open add */
  const openAdd = () => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0)
      return toast.error("Invalid APPID");
    if (!maker) return toast.error("MAKER not found from user");

    const today = new Date().toISOString().slice(0, 10);
    const bestAppcifid = str(
      tab?.APPCIFID ??
      records?.[0]?.APPCIFID ??
      ddValues?.APPCIFID?.[0]?.value ??
      "",
    ).trim();

    setSelectedRecord({
      Appid: appIdNum,
      Appcifid: bestAppcifid,
      Vb_Payrolltype: "",
      Vb_Payrollcategory: "",
      Payrollamount: "",
      Adjustmentpercentage: "",
      Netpayrollamount: "",
      Vb_Currency: "",
      Considerindbr: false,
      Remarks: "",
      Recstatus: true,
      Maker: maker,
      Updateby: maker,
      Makedate: today,
      Updatedate: today,
      Checkdate: today,
      Checker: "",
      Tacinrecid: "",
    });

    setEditModalOpen(true);
  };

  /* ✅ submit (no extra verify endpoint; keep payload small + consistent) */
  const handleSubmit = async (data: any): Promise<void> => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0)
      return void toast.error("Invalid APPID");
    if (!maker) return void toast.error("MAKER not found from user");

    const recId = num(data.Tacinrecid);

    const request: any = {
      APPID: appIdNum,
      APPCIFID: num(data.Appcifid),

      VB_PAYROLLTYPE: num(data.Vb_Payrolltype),
      VB_PAYROLLCATEGORY: num(data.Vb_Payrollcategory),

      PAYROLLAMOUNT: num(data.Payrollamount),
      ADJUSTMENTPERCENTAGE: num(data.Adjustmentpercentage),
      NETPAYROLLAMOUNT: num(data.Netpayrollamount),

      VB_CURRENCY: num(data.Vb_Currency),

      CONSIDERINDBR: Boolean(data.Considerindbr),
      REMARKS: str(data.Remarks),

      RECSTATUS: Boolean(data.Recstatus ?? true),

      MAKER: maker,
      UPDATEBY: maker,
      MAKEDATE: safeSql(data.Makedate),
      UPDATEDATE: safeSql(data.Updatedate),
      CHECKDATE: safeSql(data.Checkdate),
      CHECKER: str(data.Checker),
    };

    if (!request.APPCIFID) return void toast.error("APPCIFID is required");
    if (!request.VB_PAYROLLTYPE)
      return void toast.error("Payroll Type is required");
    if (!request.VB_PAYROLLCATEGORY)
      return void toast.error("Payroll Category is required");
    if (request.PAYROLLAMOUNT == null)
      return void toast.error("Payroll Amount is required");
    if (request.ADJUSTMENTPERCENTAGE == null)
      return void toast.error("Adjustment % is required");

    const payload = { request, ...request };
    if (recId) payload.TACINRECID = recId;

    try {
      if (recId) {
        await axios.put(`${API_BASE}/api/ApplCifIncome/${recId}`, payload, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        toast.success("Record Updated");
      } else {
        await axios.post(`${API_BASE}/api/ApplCifIncome`, payload, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        toast.success("Record Added");
      }

      await fetchRecords();
      setEditModalOpen(false);
      setSelectedRecord(null);
    } catch (e: any) {
      const server = e?.response?.data;
      console.error("Submit Error:", server ?? e);
      toast.error(
        server?.title || server?.message || e?.message || "Operation Failed",
      );
    }
  };

  /* ✅ delete */
  const handleDelete = async (row: Row) => {
    const recId = row?.TACINRECID;
    const appcifid = row?.APPCIFID;

    if (
      !recId ||
      !appcifid ||
      !maker ||
      !currentAppId ||
      Number.isNaN(appIdNum)
    ) {
      return toast.error("Missing delete params");
    }

    try {
      const url =
        `${API_BASE}/api/ApplCifIncome/?` +
        `Tacinrecid=${encodeURIComponent(String(recId))}` +
        `&Appcifid=${encodeURIComponent(String(appcifid))}` +
        `&Appid=${encodeURIComponent(String(appIdNum))}` +
        `&Updateby=${encodeURIComponent(String(maker))}`;

      await axios.delete(url);
      toast.success("Record Deleted");
      await fetchRecords();
    } catch (e) {
      console.error("Delete Error:", e);
      toast.error("Delete Failed");
    }
  };

  const keyMappings = {
    TACINRECID: "TACIN Record ID",
    APPCIFID: "App CIF ID",
    APPID: "App ID",
    PAYROLLTYPE: "Payroll Type",
    PAYROLLCATEGORY: "Payroll Category",
    PAYROLLAMOUNT: "Payroll Amount",
    ADJUSTMENTPERCENTAGE: "Adjustment Percentage",
    NETPAYROLLAMOUNT: "Net Payroll Amount",
    CURRENCY: "Currency",
    CONSIDERINDBR: "Consider in DBR",
    REMARKS: "Remarks",
    MAKER: "Maker",
    MAKEDATE: "Make Date",
    UPDATEBY: "Updated By",
    UPDATEDATE: "Update Date",
    RECSTATUS: "Record Status",
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {loading ? "Income (Loading…)" : "Income"}
        </h1>

        <Button
          onClick={openAdd}
          disabled={ddLoading || loading || !currentAppId}
        >
          Add New Record
        </Button>
      </div>

      <ReusableDataTable<Row>
        initialData={records}
        columns={columns}
        loading={loading}
        keyMappings={keyMappings}
        onUpdate={(row) => {
          setSelectedRecord(toForm(row));
          setEditModalOpen(true);
        }}
        onDelete={handleDelete}
        pageSizeOptions={[5, 10, 20]}
      />

      <EditModal
        key={
          selectedRecord?.Tacinrecid
            ? `edit-${selectedRecord.Tacinrecid}`
            : "add"
        }
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        fields={fields as any}
        onSubmit={handleSubmit}
        title={selectedRecord?.Tacinrecid ? "Edit Income" : "Add Income"}
        description={
          selectedRecord?.Tacinrecid ? "Update and save." : "Fill and save."
        }
      />
    </>
  );
}
