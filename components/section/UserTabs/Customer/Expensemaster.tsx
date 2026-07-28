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
import { toNum, toYMD } from "@/utils/helpers";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Row = Record<string, any>;
type Option = { value: string | number; label: string };

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

/* ---------------- small utils ---------------- */
const str = (v: any) => (v === null || v === undefined ? "" : String(v));
const num = (v: any) =>
  v === "" || v === null || v === undefined ? null : toNum(v, null);

const getAppId = (propAppId?: string | number, tab?: any) => {
  const fromProp = str(propAppId).trim();
  if (fromProp) return fromProp;

  const fromTab = str(tab?.APPID ?? tab?.AppId ?? tab?.appId).trim();
  if (fromTab) return fromTab;

  if (typeof window !== "undefined") {
    const ls = str(localStorage.getItem("selectedAppId")).trim();
    if (ls) return ls;

    const url = new URL(window.location.href);
    return str(url.searchParams.get("appid")).trim();
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
      if (value === null || value === undefined) return null;
      return { value: String(value), label: String(label ?? value) };
    })
    .filter(Boolean) as Option[];
};

const recId = (r: any) =>
  r?.TACEMRECID ?? r?.tacemrecid ?? r?.Tacemrecid ?? r?.id;

/** SQL Server datetime minimum guard */
const safeSql = (v: any) => {
  const today = new Date().toISOString().slice(0, 10) + "T00:00:00";
  const ymd = toYMD(v);
  if (!ymd) return today;
  const year = Number(ymd.slice(0, 4));
  if (!Number.isFinite(year) || year < 1753) return today;
  return `${ymd}T00:00:00`;
};

/* ----------------------- UI Field Types ----------------------- */
type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

export default function Expensemaster({ tab, appId }: any) {
  const { user } = useAuth();
  const language = useSelector(languageParams);
  console.log(user);
  const maker = useMemo(() => {
    return str(user?.userId ?? "").trim();
  }, [user]);

  const [currentAppId, setCurrentAppId] = useState("");
  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [ddLoading, setDdLoading] = useState(false);
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  /* ✅ APPID sync (props/tab/ls/url) */
  useEffect(() => {
    const read = () => setCurrentAppId(getAppId(appId, tab));
    read();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "selectedAppId") read();
    };
    window.addEventListener("storage", onStorage);

    // optional custom event if you dispatch it in same tab
    const onCustom = () => read();
    window.addEventListener("selectedAppIdChanged", onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("selectedAppIdChanged", onCustom as any);
    };
  }, [appId, tab]);

  /* ✅ Dropdown only once */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setDdLoading(true);
      try {
        const appCifOptions = await fetchAppCifOptions();
        if (mounted) setDdValues({ APPCIFID: appCifOptions });
      } catch (e) {
        console.error("APPCIFID dropdown failed", e);
      } finally {
        if (mounted) setDdLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [language]);

  /* ✅ Fetch (your response is ALWAYS array, so keep it simple) */
  const fetchRecords = useCallback(async () => {
    const appIdNum = Number(currentAppId);
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0) {
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get<Row[]>(
        `${API_BASE}/api/ApplCifExpMastr`,
        {
          params: { APPID: appIdNum, language },
        },
      );

      const list = (Array.isArray(data) ? data : []).map((r: any, idx) => ({
        ...r,
        id: r?.id ?? recId(r) ?? idx + 1,
      }));

      setRecords(list);
    } catch (e: any) {
      console.error("ApplCifExpMastr fetch failed", e);
      setRecords([]);
      toast.error(e?.message || "Failed to load expense master data");
    } finally {
      setLoading(false);
    }
  }, [currentAppId, language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  /* ✅ Columns (no multi-key guessing because your API is consistent) */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      {
        header: "Expense Rec ID",
        accessorKey: "TACEMRECID",
        cell: ({ row }: CellContext<Row, unknown>) =>
          recId(row.original) ?? "—",
      },
      {
        header: "Monthly Rent",
        accessorKey: "MONTHLYRENT",
        cell: ({ row }: CellContext<Row, unknown>) => {
          const n = Number(row.original?.MONTHLYRENT ?? 0);
          return Number.isFinite(n) ? n.toLocaleString() : "—";
        },
      },
      {
        header: "Total Monthly Expense",
        accessorKey: "TOTALMONTHLYEXPENSE",
        cell: ({ row }: CellContext<Row, unknown>) => {
          const n = Number(row.original?.TOTALMONTHLYEXPENSE ?? 0);
          return Number.isFinite(n) ? n.toLocaleString() : "—";
        },
      },
      {
        header: "Calculated monthly Expense",
        accessorKey: "Calculatedmonthlyexpense",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.Calculatedmonthlyexpense ?? "—",
      },
      {
        header: "No of Dependents",
        accessorKey: "NOOFDEPENDENTS",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.NOOFDEPENDENTS ?? "—",
      },
      {
        header: "Record Status",
        accessorKey: "RECSTATUS",
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
        ),
      },
    ],
    [],
  );

  /* ✅ Fields (same as yours, but lean) */
  const fields: UiFieldConfig[] = useMemo(
    () => [
      {
        type: "section",
        title: "Basic",
        fields: [
          {
            type: "select",
            name: "Appcifid",
            label: "App CIF ID",
            required: true,
            options: ddValues.APPCIFID ?? [],
          },
          {
            type: "input",
            name: "Tacemrecid",
            label: "Expense Rec ID",
            disabled: true,
          },
        ],
      },
      {
        type: "section",
        title: "Dependents",
        fields: [
          {
            type: "number",
            name: "Noofdependents",
            label: "No of Dependents",
            required: true,
          },
          {
            type: "number",
            name: "Workingdependents",
            label: "Working Dependents",
            required: true,
          },
          {
            type: "number",
            name: "Noofdomesticworker",
            label: "No of Domestic Worker",
            required: true,
          },
          {
            type: "number",
            name: "Noofdepprivateschool",
            label: "No of Dep Private School",
            required: true,
          },
          {
            type: "number",
            name: "Noofdeppublicschool",
            label: "No of Dep Public School",
            required: true,
          },
        ],
      },
      {
        type: "section",
        title: "Expenses",
        fields: [
          {
            type: "number",
            name: "Monthlyrent",
            label: "Monthly Rent",
            required: true,
          },
          {
            type: "number",
            name: "Totalmonthlyexpense",
            label: "Total Monthly Expense",
            required: true,
          },
          {
            type: "number",
            name: "Otherliabilities",
            label: "Other Liabilities",
            required: true,
          },
          {
            type: "number",
            name: "Calculatedmonthlyexpense",
            label: "Calculated Monthly Expense",
            required: true,
          },
        ],
      },
      {
        type: "section",
        title: "Remarks",
        fields: [
          { type: "textarea", name: "Remarks", label: "Remarks" },
          { type: "textarea", name: "Othdesc1", label: "Other Description 1" },
          { type: "textarea", name: "Othdesc2", label: "Other Description 2" },
          { type: "textarea", name: "Othdesc3", label: "Other Description 3" },
          { type: "switch", name: "Recstatus", label: "Record Status" },
        ],
      },
    ],
    [ddValues],
  );

  const keyMappings = useMemo(
    () => ({
      TACEMRECID: "TACEM Record ID",
      APPCIFID: "App CIF ID",
      APPID: "App ID",
      NOOFDEPENDENTS: "Number of Dependents",
      WORKINGDEPENDENTS: "Working Dependents",
      NOOFDOMESTICWORKER: "Number of Domestic Workers",
      NOOFDEPPRIVATESCHOOL: "Dependents in Private School",
      NOOFDEPPUBLICSCHOOL: "Dependents in Public School",
      MONTHLYRENT: "Monthly Rent",
      TOTALMONTHLYEXPENSE: "Total Monthly Expense",
      OTHERLIABILITIES: "Other Liabilities",
      CALCULATEDMONTHLYEXPENSE: "Calculated Monthly Expense",
      OTHDESC1: "Other Description 1",
      OTHDESC2: "Other Description 2",
      OTHDESC3: "Other Description 3",
      MAKER: "Maker",
      MAKEDATE: "Make Date",
      CHECKER: "Checker",
      CHECKDATE: "Check Date",
      UPDATEBY: "Updated By",
      UPDATEDATE: "Update Date",
      RECSTATUS: "Record Status",
    }),
    [],
  );

  /* ✅ API row -> form */
  const toForm = (row: Row) => ({
    Appid: str(Number(currentAppId)),
    Appcifid: str(row.APPCIFID ?? ""),
    Tacemrecid: str(row.TACEMRECID ?? ""),

    Noofdependents: row.NOOFDEPENDENTS ?? "",
    Workingdependents: row.WORKINGDEPENDENTS ?? "",
    Noofdomesticworker: row.NOOFDOMESTICWORKER ?? "",
    Noofdepprivateschool: row.NOOFDEPPRIVATESCHOOL ?? "",
    Noofdeppublicschool: row.NOOFDEPPUBLICSCHOOL ?? "",

    Monthlyrent: row.MONTHLYRENT ?? "",
    Totalmonthlyexpense: row.TOTALMONTHLYEXPENSE ?? "",
    Otherliabilities: row.OTHERLIABILITIES ?? "",
    Calculatedmonthlyexpense: row.CALCULATEDMONTHLYEXPENSE ?? "",

    Remarks: str(row.REMARKS ?? ""),
    Othdesc1: str(row.OTHDESC1 ?? ""),
    Othdesc2: str(row.OTHDESC2 ?? ""),
    Othdesc3: str(row.OTHDESC3 ?? ""),

    Recstatus: Boolean(row.RECSTATUS ?? true),

    Maker: str(row.MAKER ?? maker),
    Updateby: str(row.UPDATEBY ?? maker),

    Makedate: toYMD(row.MAKEDATE),
    Updatedate: toYMD(row.UPDATEDATE),
    Checkdate: toYMD(row.CHECKDATE),
    Checker: str(row.CHECKER ?? ""),
  });

  /* ✅ Submit (kept same API shape, but less noise) */
  const handleFormSubmit = async (data: any): Promise<void> => {
    const appIdNum = Number(currentAppId);

    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0) {
      toast.error("Invalid APPID");
      return;
    }

    if (!maker) {
      toast.error("MAKER not found from user");
      return;
    }

    const tacemrecid = num(data.Tacemrecid);

    const request = {
      APPID: appIdNum,
      APPCIFID: num(data.Appcifid),
      TACEMRECID: tacemrecid,

      NOOFDEPENDENTS: num(data.Noofdependents),
      WORKINGDEPENDENTS: num(data.Workingdependents),
      NOOFDOMESTICWORKER: num(data.Noofdomesticworker),
      NOOFDEPPRIVATESCHOOL: num(data.Noofdepprivateschool),
      NOOFDEPPUBLICSCHOOL: num(data.Noofdeppublicschool),

      MONTHLYRENT: num(data.Monthlyrent),
      TOTALMONTHLYEXPENSE: num(data.Totalmonthlyexpense),
      OTHERLIABILITIES: num(data.Otherliabilities),
      CALCULATEDMONTHLYEXPENSE: num(data.Calculatedmonthlyexpense),

      REMARKS: str(data.Remarks),
      OTHDESC1: str(data.Othdesc1),
      OTHDESC2: str(data.Othdesc2),
      OTHDESC3: str(data.Othdesc3),

      RECSTATUS: Boolean(data.Recstatus ?? true),

      MAKER: str(maker),
      UPDATEBY: str(maker),

      MAKEDATE: safeSql(data.Makedate),
      UPDATEDATE: safeSql(data.Updatedate),
      CHECKDATE: data.Checkdate ? safeSql(data.Checkdate) : null,
      CHECKER: str(data.Checker ?? ""),
    };

    if (!request.APPCIFID) {
      toast.error("APPCIFID is required");
      return;
    }

    // if your backend needs both "request" and flat keys, keep both
    const payload = { request, ...request };

    try {
      if (tacemrecid) {
        await axios.put(
          `${API_BASE}/api/ApplCifExpMastr/${tacemrecid}`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );
        toast.success("Record Updated");
      } else {
        await axios.post(`${API_BASE}/api/ApplCifExpMastr`, payload, {
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
      return;
    } catch (e: any) {
      const server = e?.response?.data;
      console.error("submit error", server ?? e);

      toast.error("Operation Failed", {
        description:
          server?.title ||
          server?.message ||
          server?.data ||
          e?.message ||
          "Failed to submit",
      });
      return;
    }
  };

  /* ✅ Delete (minimal; uses your querystring style) */
  const handleDelete = async (row: Row) => {
    const appIdNum = Number(currentAppId);
    const TACEMRECID = recId(row);
    const APPCIFID = row?.APPCIFID;

    if (
      !TACEMRECID ||
      !APPCIFID ||
      !maker ||
      !currentAppId ||
      Number.isNaN(appIdNum)
    ) {
      return toast.error("Missing params for delete");
    }

    try {
      const url =
        `${API_BASE}/api/ApplCifExpMastr/?` +
        `Tacemrecid=${encodeURIComponent(String(TACEMRECID))}` +
        `&Appcifid=${encodeURIComponent(String(APPCIFID))}` +
        `&Appid=${encodeURIComponent(String(appIdNum))}` +
        `&Updateby=${encodeURIComponent(String(maker))}`;

      await axios.delete(url);
      toast.success("Record Deleted");
      await fetchRecords();
    } catch (e) {
      console.error("delete failed", e);
      toast.error("Delete Failed");
    }
  };

  /* ✅ Add */
  const openAdd = () => {
    const appIdNum = Number(currentAppId);
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0)
      return toast.error("Invalid APPID");

    const today = new Date().toISOString().slice(0, 10);

    const defaultAppcifid =
      tab?.APPCIFID ??
      records?.[0]?.APPCIFID ??
      ddValues?.APPCIFID?.[0]?.value ??
      "";

    setSelectedRecord({
      Appid: str(appIdNum),
      Appcifid: str(defaultAppcifid),
      Tacemrecid: "",

      Noofdependents: "",
      Workingdependents: "",
      Noofdomesticworker: "",
      Noofdepprivateschool: "",
      Noofdeppublicschool: "",

      Monthlyrent: "",
      Totalmonthlyexpense: "",
      Otherliabilities: "",
      Calculatedmonthlyexpense: "",

      Remarks: "",
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
    });

    setEditModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold">
          {loading ? "Expense Master (Loading…)" : "Expense Master"}
          {!currentAppId ? (
            <span className="ml-3 text-sm font-normal text-red-500">
              (APPID missing: localStorage.selectedAppId)
            </span>
          ) : (
            <span className="ml-3 text-sm font-normal text-gray-500">
              (APPID: {currentAppId})
            </span>
          )}
        </div>

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
          selectedRecord?.Tacemrecid
            ? `edit-${selectedRecord.Tacemrecid}`
            : "add"
        }
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        fields={fields as any}
        onSubmit={handleFormSubmit}
        title={
          selectedRecord?.Tacemrecid
            ? "Edit Expense Master"
            : "Add Expense Master"
        }
        description="Fill the expense fields and save."
      />
    </>
  );
}
