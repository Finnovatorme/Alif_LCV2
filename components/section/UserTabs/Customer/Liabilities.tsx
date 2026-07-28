"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { toast } from "sonner";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { EditModal } from "@/components/ui/editmodal";
import { BooleanStatus } from "@/components/ui/BooleanStatus";
import type { FieldConfig } from "@/types/field.types";
import { useAuth } from "@/hooks/useAuth";
import { vbValue, fetchAppCifOptions, fetchFinancierOptions } from "@/utils/dropDownApis";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";

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
const extract = (res: any): Row[] => {
  const d = res?.data ?? res;
  const arr = Array.isArray(d)
    ? d
    : Array.isArray(d?.data)
      ? d.data
      : Array.isArray(d?.DATA)
        ? d.DATA
        : Array.isArray(d?.result)
          ? d.result
          : d && typeof d === "object"
            ? [d]
            : [];
  return arr.filter((x: any) => x && typeof x === "object");
};
const normalizeOptions = (raw: any): Option[] => {
  const arr = Array.isArray(raw) ? raw : (raw?.data ?? raw?.DATA ?? []);
  if (!Array.isArray(arr)) return [];
  return arr
    .map((o: any) => {
      const value =
        o?.VBVALUE ??
        o?.VALUE ??
        o?.ID ??
        o?.id ??
        o?.value ??
        o?.VBCODE ??
        o?.code;
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
const pickAppId = (propAppId?: string | number, tab?: any) => {
  const p = str(propAppId).trim();
  if (p) return p;

  const t = str(
    tab?.APPID ?? tab?.AppId ?? tab?.appId ?? tab?.RECID ?? "",
  ).trim();
  if (t) return t;

  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    return str(
      url.searchParams.get("appid") ||
      localStorage.getItem("selectedAppId") ||
      "",
    ).trim();
  }
  return "";
};

const isActive = (v: any) => v === true || v === 1 || v === "1";
const money = (v: any) => {
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "—";
};
const prettyDate = (v: any) => {
  if (!v) return "—";
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-GB");
};

export default function Liabilities({ tab, appId }: any) {
  const { user } = useAuth();
  const language = useSelector(languageParams);

  const maker = useMemo(
    () =>
      str(
        user?.Userid ??
        user?.USERID ??
        user?.userId ??
        user?.id ??
        user?.ID ??
        "",
      ).trim(),
    [user],
  );

  const [currentAppId, setCurrentAppId] = useState("");
  const appIdNum = Number(currentAppId);

  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [ddLoading, setDdLoading] = useState(false);
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});
  const [financierOptions, setFinancierOptions] = useState<Option[]>([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  /* ✅ APPID sync */
  useEffect(() => {
    const read = () => setCurrentAppId(pickAppId(appId, tab));
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
        const [appCifOptions, b, fins] = await Promise.all([
          fetchAppCifOptions(),
          vbValue("FINANCETYPE"),
          fetchFinancierOptions(),
        ]);
        if (!mounted) return;
        setDdValues({
          APPCIFID: appCifOptions,
          FINANCETYPE: normalizeOptions(b),
        });
        setFinancierOptions(fins);
      } catch (e) {
        console.error("dd fetch failed", e);
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
      const res = await axios.get(`${API_BASE}/api/ApplCifLiabilities`, {
        params: { APPID: appIdNum, language },
      });

      const list = extract(res).map((r: any, idx) => ({
        ...r,
        id: r?.id ?? r?.TACLRECID ?? r?.TACLIRECID ?? idx + 1,
      }));
      setRecords(list);
    } catch (e: any) {
      console.error("ApplCifLiabilities API failed", e);
      setRecords([]);
      toast.error(e?.message || "Failed to load liabilities");
    } finally {
      setLoading(false);
    }
  }, [currentAppId, appIdNum, language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  /* ✅ columns (keep short) */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      {
        id: "actions",
        header: "Actions",
      } as any,
      {
        accessorKey: "TACLRECID",
        header: "Record ID",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.TACLRECID ??
          row.original?.TACLIRECID ??
          row.original?.RECID ??
          row.original?.ID ??
          "—",
      },
      {
        accessorKey: "ACCOUNTNUMBER",
        header: "Account Number",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.ACCOUNTNUMBER ??
          row.original?.Accountnumber ??
          row.original?.ACCOUNTNO ??
          "—",
      },
      {
        accessorKey: "INSTALLMENTAMOUNT",
        header:
          "Installment Amount",
        cell: ({ row }: CellContext<Row, unknown>) =>
          money(row.original?.INSTALLMENTAMOUNT),
      },
      {
        accessorKey: "SANCTIONAMOUNT",
        header:
          "Sanction Amount",
        cell: ({ row }: CellContext<Row, unknown>) =>
          money(row.original?.SANCTIONAMOUNT),
      },
      {
        accessorKey: "SANCTIONDATE",
        header: "Sanction Date",
        cell: ({ row }: CellContext<Row, unknown>) =>
          prettyDate(row.original?.SANCTIONDATE),
      },

      // NEW COLUMN
      {
        accessorKey: "INCLUDEINDBR",
        header: "Include In DBR",
        cell: ({ row }: CellContext<Row, unknown>) => (
          <BooleanStatus value={row.original?.INCLUDEINDBR} trueText="Yes" falseText="No" />
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
    [],
  );
  type SectionConfig = {
    type: "section";
    title: string;
    fields: FieldConfig[];
  };

  type UiFieldConfig = FieldConfig | SectionConfig;

  const fields = useMemo<UiFieldConfig[]>(
    () => [
      {
        type: "section",
        title: "Liabilities",
        fields: [
          {
            name: "Appcifid",
            label: "App CIF ID",
            type: "select",
            options: ddValues.APPCIFID ?? [],
          },
          {
            name: "Vb_Financetype",
            label: "Finance Type",
            type: "select",
            options: ddValues.FINANCETYPE ?? [],
          },

          {
            name: "Facilitytypecode",
            label: "Facility Type Code",
            type: "input",
          },
          {
            name: "Financiername",
            label: "Financier Name",
            type: "select",
            options: financierOptions.map((f) => ({ value: f.label, label: f.label })),
          },
          { name: "Accountnumber", label: "Account Number", type: "input" },

          { name: "Sanctionamount", label: "Sanction Amount", type: "number" },
          { name: "Sanctiondate", label: "Sanction Date", type: "date" },
          { name: "Maturitydate", label: "Maturity Date", type: "date" },

          { name: "Contracttenure", label: "Contract Tenure", type: "number" },
          {
            name: "Installmentamount",
            label: "Installment Amount",
            type: "number",
          },
          {
            name: "Averageinstallment",
            label: "Average Installment",
            type: "number",
          },

          { name: "Includeindbr", label: "Include In DBR", type: "switch" },

          { name: "Othdesc1", label: "Other Desc 1", type: "textarea" },
          { name: "Othdesc2", label: "Other Desc 2", type: "textarea" },
          { name: "Othdesc3", label: "Other Desc 3", type: "textarea" },

          { name: "Recstatus", label: "Record Status", type: "switch" },
          {
            name: "Taclrecid",
            label: "Record ID",
            type: "input",
            disabled: true,
          },
        ],
      },
    ],
    [ddValues],
  );

  /* ✅ map API row -> form */
  const toForm = (row: Row) => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      Appid: appIdNum,

      Appcifid: str(row.APPCIFID ?? ""),
      Vb_Financetype: str(row.VB_FINANCETYPE ?? ""),

      Taclrecid: str(row.TACLRECID ?? row.TACLIRECID ?? ""),

      Facilitytypecode: str(row.FACILITYTYPECODE ?? ""),
      Financiername: str(row.FINANCIERNAME ?? ""),
      Accountnumber: str(row.ACCOUNTNUMBER ?? row.ACCOUNTNO ?? ""),

      Sanctionamount: str(row.SANCTIONAMOUNT ?? ""),
      Sanctiondate: ymd(row.SANCTIONDATE),
      Maturitydate: ymd(row.MATURITYDATE),

      Contracttenure: str(row.CONTRACTTENURE ?? ""),
      Installmentamount: str(row.INSTALLMENTAMOUNT ?? ""),
      Averageinstallment: str(row.AVERAGEINSTALLMENT ?? ""),

      Includeindbr: Boolean(row.INCLUDEINDBR ?? false),

      Othdesc1: str(row.OTHDESC1 ?? ""),
      Othdesc2: str(row.OTHDESC2 ?? ""),
      Othdesc3: str(row.OTHDESC3 ?? ""),

      Recstatus: Boolean(row.RECSTATUS ?? true),

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
    if (!maker) return toast.error("UserId not found (Maker required)");

    const today = new Date().toISOString().slice(0, 10);
    const defaultAppcifid = str(
      tab?.APPCIFID ??
      records?.[0]?.APPCIFID ??
      ddValues.APPCIFID?.[0]?.value ??
      "",
    ).trim();
    const defaultFinance = str(ddValues.FINANCETYPE?.[0]?.value ?? "").trim();

    setSelectedRecord({
      Appid: appIdNum,
      Appcifid: defaultAppcifid,
      Vb_Financetype: defaultFinance,

      Facilitytypecode: "",
      Financiername: "",
      Accountnumber: "",

      Sanctionamount: "",
      Sanctiondate: "",
      Maturitydate: "",

      Contracttenure: "",
      Installmentamount: "",
      Averageinstallment: "",

      Includeindbr: false,
      Othdesc1: "",
      Othdesc2: "",
      Othdesc3: "",

      Recstatus: true,

      Maker: maker,
      Updateby: maker,
      Makedate: today,
      Updatedate: today,
      Checkdate: today,
      Checker: "",
      Taclrecid: "",
    });

    setEditModalOpen(true);
  };

  /* ✅ submit */
  const handleSubmit = async (data: any): Promise<void> => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0)
      return void toast.error("Invalid APPID");
    if (!maker) return void toast.error("UserId not found (Maker required)");

    const id = num(data.Taclrecid);
    const todayYmd = new Date().toISOString().slice(0, 10);

    const request: any = {
      APPID: appIdNum,
      APPCIFID: num(data.Appcifid),
      VB_FINANCETYPE: num(data.Vb_Financetype),

      FACILITYTYPECODE: str(data.Facilitytypecode),
      FINANCIERNAME: str(data.Financiername),
      ACCOUNTNUMBER: str(data.Accountnumber),

      SANCTIONAMOUNT: num(data.Sanctionamount),
      SANCTIONDATE: safeSql(data.Sanctiondate),
      MATURITYDATE: safeSql(data.Maturitydate),

      CONTRACTTENURE: num(data.Contracttenure),
      INSTALLMENTAMOUNT: num(data.Installmentamount),
      AVERAGEINSTALLMENT: num(data.Averageinstallment),

      INCLUDEINDBR: Boolean(data.Includeindbr),

      OTHDESC1: str(data.Othdesc1),
      OTHDESC2: str(data.Othdesc2),
      OTHDESC3: str(data.Othdesc3),

      RECSTATUS: Boolean(data.Recstatus ?? true),

      MAKER: maker,
      UPDATEBY: maker,
      MAKEDATE: safeSql(data.Makedate ?? todayYmd),
      UPDATEDATE: safeSql(data.Updatedate ?? todayYmd),
      CHECKDATE: safeSql(data.Checkdate ?? todayYmd),
      CHECKER: str(data.Checker),
    };

    if (id) request.TACLRECID = id;

    const payload: any = { request, ...request };

    try {
      if (id) {
        await axios.put(`${API_BASE}/api/ApplCifLiabilities/${id}`, payload, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        toast.success("Record Updated");
      } else {
        // POST should not include id
        delete payload.TACLRECID;
        delete payload.request.TACLRECID;

        await axios.post(`${API_BASE}/api/ApplCifLiabilities`, payload, {
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
    const id = row?.TACLRECID ?? row?.TACLIRECID ?? row?.RECID ?? row?.ID;
    const appcifid = row?.APPCIFID ?? row?.CIFID;
    if (!id || !appcifid || !maker || !currentAppId || Number.isNaN(appIdNum)) {
      return toast.error("Missing delete params");
    }

    try {
      const url =
        `${API_BASE}/api/ApplCifLiabilities/?` +
        `Taclrecid=${encodeURIComponent(String(id))}` +
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
    TACLRECID: "TACL Record ID",
    APPCIFID: "App CIF ID",
    APPID: "App ID",
    FINANCETYPE: "Finance Type",
    FACILITYTYPECODE: "Facility Type Code",
    FINANCIERNAME: "Financier Name",
    ACCOUNTNUMBER: "Account Number",
    SANCTIONAMOUNT: "Sanction Amount",
    SANCTIONDATE: "Sanction Date",
    MATURITYDATE: "Maturity Date",
    CONTRACTTENURE: "Contract Tenure",
    INSTALLMENTAMOUNT: "Installment Amount",
    AVERAGEINSTALLMENT: "Average Installment",
    INCLUDEINDBR: "Include in DBR",
    OTHDESC1: "Other Description 1",
    OTHDESC2: "Other Description 2",
    OTHDESC3: "Other Description 3",
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
          {loading ? "Liabilities (Loading…)" : "Liabilities"}
          <span className="ml-3 text-sm font-normal text-gray-500">
            {currentAppId ? `(APPID: ${currentAppId})` : "(APPID missing)"}
          </span>
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
          selectedRecord?.Taclrecid ? `edit-${selectedRecord.Taclrecid}` : "add"
        }
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        fields={fields}
        onSubmit={handleSubmit}
        title={selectedRecord?.Taclrecid ? "Edit Liability" : "Add Liability"}
        description={
          selectedRecord?.Taclrecid ? "Update and save." : "Fill and save."
        }
      />
    </>
  );
}
