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
import { toast } from "sonner";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { EditModal } from "@/components/ui/editmodal";
import type { FieldConfig as BaseFieldConfig } from "@/types/field.types";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { vbValue, fetchAppCifOptions } from "@/utils/dropDownApis";

import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Row = {
  AFFRECID: number;
  APPID: number;
  APPCIFID: number;

  CIFPEP: boolean;
  CIFCLOSEDRELATIVEPEP: boolean;
  CIFRELATIVEPEP: boolean;
  RELATEDPARTY: boolean;
  COMPANYEMPLOYEE: boolean;

  OTHDESC1: string | null;
  OTHDESC2: string | null;
  OTHDESC3: string | null;

  MAKER: string;
  MAKEDATE: string;
  CHECKER: string;
  CHECKDATE: string;
  UPDATEBY: string;
  UPDATEDATE: string | null;

  RECSTATUS: boolean;
};

type Option = { value: string | number; label: string };

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

const todaySql = () => new Date().toISOString().slice(0, 10) + "T00:00:00";

const sqlDate = (v: any) => {
  const s = String(v ?? "").trim();
  if (!s) return todaySql();
  return s.length === 10 ? `${s}T00:00:00` : s;
};

function resolveAppId(
  propAppId?: string | number,
  storeAppId?: string | number,
) {
  if (propAppId !== undefined && propAppId !== null && String(propAppId) !== "")
    return String(propAppId);

  if (
    storeAppId !== undefined &&
    storeAppId !== null &&
    String(storeAppId) !== ""
  )
    return String(storeAppId);

  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    return (
      url.searchParams.get("appid") ||
      localStorage.getItem("selectedAppId") ||
      ""
    );
  }
  return "";
}

function normalizeOptions(raw: any): Option[] {
  const arr = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
      ? raw
      : [];
  return arr
    .map((o: any) => ({
      value: String(o.VBVALUE),
      label: String(o.VBVALUEDESC),
    }))
    .filter((x: any) => x.value);
}

function unwrapArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.DATA)) return data.DATA;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.Result)) return data.Result;
  return [];
}

const yesNoPill = (yes: boolean) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-bold ${yes ? "text-blue-700 bg-blue-100" : "text-gray-600 bg-gray-100"
      }`}
  >
    {yes ? "Yes" : "No"}
  </span>
);

type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

export default function CifAffiliation({ tab, appId }: any) {
  const { user } = useAuth();
  const appParams = useSelector(dashboardParams);
  const storeAppId = appParams?.APPID;
  const language = useSelector(languageParams);

  const [records, setRecords] = useState<Row[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Partial<Row> | null>(
    null,
  );
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [ddLoading, setDdLoading] = useState(false);
  const [ddValues, setDdValues] = useState<{ APPCIFID: Option[] }>({
    APPCIFID: [],
  });
  const hasFetchedDd = useRef(false);

  const updateBy =
    user?.Userid ?? user?.USERID ?? user?.userId ?? user?.id ?? user?.ID ?? "";

  /* -------- dropdowns (still needed for add/edit APPCIFID) -------- */
  useEffect(() => {
    (async () => {
      setDdLoading(true);
      try {
        const appCifOptions = await fetchAppCifOptions();
        setDdValues({ APPCIFID: appCifOptions });
      } catch (e) {
        console.error("dropdown fetch failed", e);
      } finally {
        setDdLoading(false);
      }
    })();
  }, []);

  /* ✅ GET: ALWAYS without APPCIFID */
  const fetchRecords = useCallback(async () => {
    const APPID = resolveAppId(appId, storeAppId);
    if (!APPID) {
      toast.error("APPID not found (props/store/url/localStorage)");
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/ApplCifAffiliation`, {
        params: { APPID, language }, // ✅ no APPCIFID
      });

      const list = unwrapArray<Row>(res?.data);
      setRecords(list);
    } catch (e: any) {
      console.error("ApplCifAffiliation fetch failed", e?.response?.data ?? e);
      setRecords([]);
      toast.error(e?.message || "Failed to load affiliation data");
    } finally {
      setLoading(false);
    }
  }, [appId, storeAppId, language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      { header: "Customer Affliation Rec Id", accessorKey: "TACARECID" },
      // { header: "App CIF ID", accessorKey: "APPCIFID" },

      // {
      //   header: "CIF PEP",
      //   accessorKey: "CIFPEP",
      //   cell: ({ row }: CellContext<Row, unknown>) =>
      //     yesNoPill(Boolean(row.original.CIFPEP)),
      // },
      {
        header: "Cif Closed Relative Pep",
        accessorKey: "CIFCLOSEDRELATIVEPEP",
         cell: ({ row }: any) => (
          <BooleanStatus value={row.original.CIFCLOSEDRELATIVEPEP} trueText="Yes" falseText="No" />
        ),
      },
      // {
      //   header: "CIF Relative PEP",
      //   accessorKey: "CIFRELATIVEPEP",
      //   cell: ({ row }: CellContext<Row, unknown>) =>
      //     yesNoPill(Boolean(row.original.CIFRELATIVEPEP)),
      // },
      {
        header: "Actions",
        accessorKey: "CIFRELATIVEPEP",
           cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RELATEDPARTY} trueText="Yes" falseText="No" />
        ),
      },
      {
        header: "Company Employee",
        accessorKey: "COMPANYEMPLOYEE",
               cell: ({ row }: any) => (
          <BooleanStatus value={row.original.COMPANYEMPLOYEE} trueText="Yes" falseText="No" />
        ),
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
      AFFRECID: "Affiliation Rec ID",
      APPCIFID: "App CIF ID",
      APPID: "App ID",
      CIFPEP: "CIF PEP",
      CIFCLOSEDRELATIVEPEP: "CIF Close Relative PEP",
      CIFRELATIVEPEP: "CIF Relative PEP",
      RELATEDPARTY: "Related Party",
      COMPANYEMPLOYEE: "Company Employee",
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

  const fields: UiFieldConfig[] = useMemo(
    () => [
      {
        type: "section",
        title: "Affiliation",
        fields: [
          {
            name: "APPCIFID",
            label: "App CIF ID",
            type: "select",
            options: ddValues.APPCIFID,
            placeholder: "Select App CIF ID",
            required: true,
          },
          { name: "CIFPEP", label: "CIF PEP", type: "switch" },
          {
            name: "CIFCLOSEDRELATIVEPEP",
            label: "CIF Closed Relative PEP",
            type: "switch",
          },
          { name: "CIFRELATIVEPEP", label: "CIF Relative PEP", type: "switch" },
          { name: "RELATEDPARTY", label: "Related Party", type: "switch" },
          {
            name: "COMPANYEMPLOYEE",
            label: "Company Employee",
            type: "switch",
          },

          { name: "OTHDESC1", label: "Other Description 1", type: "textarea" },
          { name: "OTHDESC2", label: "Other Description 2", type: "textarea" },
          { name: "OTHDESC3", label: "Other Description 3", type: "textarea" },

          { name: "RECSTATUS", label: "Record Status", type: "switch" },
        ],
      },
    ],
    [ddValues.APPCIFID],
  );

  const openAdd = () => {
    const APPID = resolveAppId(appId, storeAppId);
    if (!APPID) return toast.error("APPID not found");

    setSelectedRecord({
      APPID: Number(APPID),
      APPCIFID: 0,
      AFFRECID: 0,

      CIFPEP: false,
      CIFCLOSEDRELATIVEPEP: false,
      CIFRELATIVEPEP: false,
      RELATEDPARTY: false,
      COMPANYEMPLOYEE: false,

      OTHDESC1: "",
      OTHDESC2: "",
      OTHDESC3: "",

      RECSTATUS: true,

      MAKER: String(updateBy || "system"),
      UPDATEBY: String(updateBy || "system"),
      MAKEDATE: todaySql(),
      CHECKER: String(updateBy || "system"),
      CHECKDATE: todaySql(),
      UPDATEDATE: todaySql(),
    });

    setEditModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setSelectedRecord({ ...row });
    setEditModalOpen(true);
  };

  const toInt = (v: any) => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : 0;
  };

  const handleFormSubmit = async (values: any): Promise<void> => {
    const APPID = resolveAppId(appId, storeAppId);

    if (!APPID) {
      toast.error("APPID not found");
      return;
    }

    if (!updateBy) {
      toast.error("UpdateBy not found");
      return;
    }

    const isEdit = Boolean(selectedRecord?.AFFRECID);

    const appcifid = toInt(values.APPCIFID);
    if (!appcifid) {
      toast.error("APPCIFID is required");
      return;
    }

    const request: Row = {
      AFFRECID: isEdit ? toInt(selectedRecord!.AFFRECID) : 0,
      APPID: toInt(APPID),
      APPCIFID: appcifid,

      CIFPEP: Boolean(values.CIFPEP),
      CIFCLOSEDRELATIVEPEP: Boolean(values.CIFCLOSEDRELATIVEPEP),
      CIFRELATIVEPEP: Boolean(values.CIFRELATIVEPEP),
      RELATEDPARTY: Boolean(values.RELATEDPARTY),
      COMPANYEMPLOYEE: Boolean(values.COMPANYEMPLOYEE),

      OTHDESC1: values.OTHDESC1 ?? "",
      OTHDESC2: values.OTHDESC2 ?? "",
      OTHDESC3: values.OTHDESC3 ?? "",

      RECSTATUS: Boolean(values.RECSTATUS ?? true),

      MAKER: String(updateBy),
      UPDATEBY: String(updateBy),
      CHECKER: String(updateBy),

      // If it's add, use today; if edit, preserve old dates if present
      MAKEDATE: isEdit
        ? sqlDate(selectedRecord?.MAKEDATE)
        : sqlDate(todaySql()),
      CHECKDATE: isEdit
        ? sqlDate(selectedRecord?.CHECKDATE)
        : sqlDate(todaySql()),
      UPDATEDATE: sqlDate(todaySql()),
    };

    const payload = { Request: request, ...request };

    try {
      if (isEdit) {
        await axios.put(
          `${API_BASE}/api/ApplCifAffiliation/${request.AFFRECID}`,
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
        await axios.post(`${API_BASE}/api/ApplCifAffiliation`, payload, {
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
      console.error("submit error", e?.response?.data ?? e);
      const server = e?.response?.data;
      const msg =
        server?.title ||
        server?.message ||
        server?.data ||
        e?.message ||
        "Failed to submit";

      toast.error(msg);
      return;
    }
  };
  /* ✅ DELETE: try WITHOUT Appcifid first, fallback only if backend requires it */
  const handleDelete = async (row: Row) => {
    try {
      if (!updateBy) return toast.error("UpdateBy missing");

      const APPID = resolveAppId(appId, storeAppId);
      if (!APPID) return toast.error("APPID missing");

      // 1) primary delete: without Appcifid
      const url1 = `${API_BASE}/api/ApplCifAffiliation/?TACARECID=${row.AFFRECID}&Appid=${APPID}&Updateby=${updateBy}`;
      await axios.delete(url1, { headers: { Accept: "application/json" } });

      toast.success("Record Deleted");
      await fetchRecords();
    } catch (e1: any) {
      // 2) fallback delete: with Appcifid (old behavior)
      try {
        const APPID = resolveAppId(appId, storeAppId);
        if (!APPID) throw e1;

        const url2 = `${API_BASE}/api/ApplCifAffiliation/?TACARECID=${row.AFFRECID}&Appcifid=${row.APPCIFID}&Appid=${APPID}&Updateby=${updateBy}`;
        await axios.delete(url2, { headers: { Accept: "application/json" } });

        toast.success("Record Deleted");
        await fetchRecords();
      } catch (e2: any) {
        console.error("delete failed", e2?.response?.data ?? e2);
        toast.error(
          e2?.response?.data?.message || e2?.message || "Delete Failed",
        );
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold">
          {loading ? "Affiliations (Loading…)" : "Affiliations"}
        </div>

        <Button onClick={openAdd} disabled={ddLoading || loading}>
          Add New Record
        </Button>
      </div>

      <ReusableDataTable<Row>
        initialData={records}
        columns={columns}
        loading={loading}
        keyMappings={keyMappings}
        onUpdate={openEdit}
        onDelete={handleDelete}
        pageSizeOptions={[5, 10, 20]}
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        fields={fields as any}
        onSubmit={handleFormSubmit}
        title={
          selectedRecord?.AFFRECID ? "Edit Affiliation" : "Add Affiliation"
        }
        description="Fill the affiliation fields and save."
      />
    </>
  );
}
