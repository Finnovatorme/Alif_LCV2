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
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { vbValue, fetchAppCifOptions } from "@/utils/dropDownApis";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Row = Record<string, any>;
type Option = { value: string | number; label: string };

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

/* ---------------- small helpers ---------------- */
const str = (v: any) => (v === null || v === undefined ? "" : String(v));
const num = (v: any) => {
  if (v === "" || v === null || v === undefined) return null;
  const x = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : null;
};
const ymd = (v: any) => (v ? String(v).slice(0, 10) : "");
const safeSql = (v: any) => {
  const today = new Date().toISOString().slice(0, 10) + "T00:00:00";
  const d = ymd(v);
  if (!d) return today;
  const year = Number(d.slice(0, 4));
  if (!Number.isFinite(year) || year < 1753) return today;
  return `${d}T00:00:00`;
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

/* ----------------------- UI Field Types ----------------------- */
type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

export default function ExpenseDetails({ tab, appId }: any) {
  const { user } = useAuth();
  const language = useSelector(languageParams);

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

    const onCustom = () => read();
    window.addEventListener("selectedAppIdChanged", onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("selectedAppIdChanged", onCustom as any);
    };
  }, [appId, tab]);

  const appIdNum = Number(currentAppId);

  /* ✅ dropdowns only once */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setDdLoading(true);
      try {
        const [appCifOptions, b] = await Promise.all([
          fetchAppCifOptions(),
          vbValue("CUSTEXPENSETYPE"),
        ]);
        if (!mounted) return;
        setDdValues({
          APPCIFID: appCifOptions,
          CUSTEXPENSETYPE: normalizeOptions(b),
        });
      } catch (e) {
        console.error("dropdowns failed", e);
      } finally {
        if (mounted) setDdLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ✅ GET (your API returns array as you showed) */
  const fetchRecords = useCallback(async () => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0) {
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get<Row[]>(
        `${API_BASE}/api/ApplCifExpenseDetails`,
        {
          params: { APPID: appIdNum, language },
        },
      );

      const list = (Array.isArray(data) ? data : []).map((r: any, idx) => ({
        ...r,
        id: r?.id ?? r?.TACEDRECID ?? idx + 1,
      }));

      setRecords(list);
    } catch (e: any) {
      console.error("ApplCifExpenseDetails fetch failed", e);
      setRecords([]);
      toast.error(e?.message || "Failed to load expense details");
    } finally {
      setLoading(false);
    }
  }, [currentAppId, appIdNum, language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  /* ✅ columns (use your real keys: TACEDRECID, CUSTEXPENSETYPE, EXPENSEAMOUNT, RECSTATUS) */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      {
        id: "actions",
        header: "Actions",
      } as any,
      {
        header: "Expense Rec ID",
        accessorKey: "TACEDRECID",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.TACEDRECID ?? "—",
      },
      {
        header: "Cust Expense Type",
        accessorKey: "CUSTEXPENSETYPE",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.CUSTEXPENSETYPE ?? "—",
      },
      {
        header: "Expense Amount",
        accessorKey: "EXPENSEAMOUNT",
        cell: ({ row }: CellContext<Row, unknown>) => {
          const v = Number(row.original?.EXPENSEAMOUNT ?? 0);
          return Number.isFinite(v)
            ? v.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
            : "—";
        },
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

  const keyMappings = useMemo(
    () => ({
      TACEDRECID: "TACED Record ID",
      APPCIFID: "App CIF ID",
      APPID: "App ID",
      CIFID: "CIF ID",
      VB_CUSTEXPENSETYPE: "VB Customer Expense Type",
      CUSTEXPENSETYPE: "Customer Expense Type",
      EXPENSEAMOUNT: "Expense Amount",
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

  /* ✅ fields */
  const fields: UiFieldConfig[] = useMemo(
    () => [
      {
        type: "section",
        title: "Expense Details",
        fields: [
          {
            name: "Appcifid",
            label: "App CIF ID",
            type: "select",
            options: ddValues.APPCIFID ?? [],
            required: true,
          },
          {
            name: "Vb_Custexpensetype",
            label: "Cust Expense Type",
            type: "select",
            options: ddValues.CUSTEXPENSETYPE ?? [],
            required: true,
          },
          {
            name: "Expenseamount",
            label: "Expense Amount",
            type: "number",
            required: true,
          },
          { name: "Othdesc1", label: "Other Description 1", type: "textarea" },
          { name: "Othdesc2", label: "Other Description 2", type: "textarea" },
          { name: "Othdesc3", label: "Other Description 3", type: "textarea" },
          {
            name: "Tacedrecid",
            label: "Expense Rec ID",
            type: "input",
            disabled: true,
          },
          { name: "Recstatus", label: "Record Status", type: "switch" },
        ],
      },
    ],
    [ddValues],
  );

  /* ✅ open add */
  const openAdd = () => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0)
      return toast.error("Invalid APPID");
    if (!maker) return toast.error("MAKER not found from user");

    const today = new Date().toISOString().slice(0, 10);
    const defaultAppcifid =
      tab?.APPCIFID ??
      records?.[0]?.APPCIFID ??
      ddValues?.APPCIFID?.[0]?.value ??
      "";

    setSelectedRecord({
      Appid: appIdNum,
      Appcifid: str(defaultAppcifid),
      Tacedrecid: "",
      Vb_Custexpensetype: "",
      Expenseamount: "",
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

  /* ✅ api row -> form (your response keys are consistent) */
  const toForm = (row: Row) => ({
    Appid: appIdNum,
    Appcifid: str(row.APPCIFID ?? ""),
    Tacedrecid: str(row.TACEDRECID ?? ""),
    Vb_Custexpensetype: str(row.VB_CUSTEXPENSETYPE ?? ""),
    Expenseamount: row.EXPENSEAMOUNT ?? "",
    Othdesc1: str(row.OTHDESC1 ?? ""),
    Othdesc2: str(row.OTHDESC2 ?? ""),
    Othdesc3: str(row.OTHDESC3 ?? ""),
    Recstatus: Boolean(row.RECSTATUS ?? true),

    Maker: str(row.MAKER ?? maker),
    Updateby: str(row.UPDATEBY ?? maker),
    Makedate: ymd(row.MAKEDATE),
    Updatedate: ymd(row.UPDATEDATE),
    Checkdate: ymd(row.CHECKDATE),
    Checker: str(row.CHECKER ?? ""),
  });

  /* ✅ submit add/edit */
  const handleFormSubmit = async (data: any): Promise<void> => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0) {
      toast.error("Invalid APPID");
      return;
    }

    if (!maker) {
      toast.error("MAKER not found from user");
      return;
    }

    const tacedrecid = num(data.Tacedrecid);

    const request = {
      APPID: appIdNum,
      APPCIFID: num(data.Appcifid),
      TACEDRECID: tacedrecid,

      VB_CUSTEXPENSETYPE: num(data.Vb_Custexpensetype),
      EXPENSEAMOUNT: num(data.Expenseamount),

      OTHDESC1: str(data.Othdesc1),
      OTHDESC2: str(data.Othdesc2),
      OTHDESC3: str(data.Othdesc3),

      RECSTATUS: Boolean(data.Recstatus ?? true),

      MAKER: maker,
      UPDATEBY: maker,

      MAKEDATE: safeSql(data.Makedate),
      UPDATEDATE: safeSql(data.Updatedate),
      CHECKDATE: data.Checkdate ? safeSql(data.Checkdate) : null,
      CHECKER: str(data.Checker),
    };

    if (!request.APPCIFID) {
      toast.error("APPCIFID is required");
      return;
    }

    if (!request.VB_CUSTEXPENSETYPE) {
      toast.error("Cust Expense Type is required");
      return;
    }

    if (request.EXPENSEAMOUNT === null) {
      toast.error("Expense Amount is required");
      return;
    }

    const payload = { request, ...request };

    try {
      if (tacedrecid) {
        await axios.put(
          `${API_BASE}/api/ApplCifExpenseDetails/${tacedrecid}`,
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
        await axios.post(`${API_BASE}/api/ApplCifExpenseDetails`, payload, {
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

  /* ✅ delete */
  const handleDelete = async (row: Row) => {
    const TACEDRECID = row?.TACEDRECID;
    const APPCIFID = row?.APPCIFID;

    if (
      !TACEDRECID ||
      !APPCIFID ||
      !maker ||
      !currentAppId ||
      Number.isNaN(appIdNum)
    ) {
      return toast.error("Missing params for delete");
    }

    try {
      const url =
        `${API_BASE}/api/ApplCifExpenseDetails/?` +
        `Tacedrecid=${encodeURIComponent(String(TACEDRECID))}` +
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

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold">
          {loading ? "Expense Details (Loading…)" : "Expense Details"}
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
          selectedRecord?.Tacedrecid
            ? `edit-${selectedRecord.Tacedrecid}`
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
          selectedRecord?.Tacedrecid
            ? "Edit Expense Details"
            : "Add Expense Details"
        }
        description={
          selectedRecord?.Tacedrecid ? "Update and save." : "Fill and save."
        }
      />
    </>
  );
}
