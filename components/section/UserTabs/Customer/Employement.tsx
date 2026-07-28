"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { toast } from "sonner";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { EditModal } from "@/components/ui/editmodal";
import type { FieldConfig as BaseFieldConfig } from "@/types/field.types";
import { vbValue, fetchAppCifOptions } from "@/utils/dropDownApis";
import { useAuth } from "@/hooks/useAuth";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Row = Record<string, any>;
type Option = { value: string | number; label: string };

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

/* ---------------- small helpers ---------------- */
const str = (v: any) => (v == null ? "" : String(v));
const num = (v: any) => {
  const x = str(v).replace(/,/g, "").trim();
  if (!x) return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
};
const bool = (v: any) =>
  v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";
const ymd = (v: any) => (v ? str(v).slice(0, 10) : "");
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
        o?.code ??
        o?.KEY ??
        o?.key;
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
const getAppId = () => {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  return (
    url.searchParams.get("APPID") ||
    url.searchParams.get("appid") ||
    localStorage.getItem("selectedAppId") ||
    ""
  ).trim();
};
const customerName = (tab: any, rows: Row[]) =>
  str(
    tab?.CUSTOMERFULLNAME ??
    tab?.APPCUSTOMERFULLNAME ??
    tab?.CIFCUSTOMERFULLNAME ??
    rows?.[0]?.CUSTOMERFULLNAME ??
    rows?.[0]?.APPCUSTOMERFULLNAME ??
    rows?.[0]?.CIFCUSTOMERFULLNAME ??
    "",
  ).trim();

/* ---------------- UI field types ---------------- */
type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

export default function Employement({ tab }: any) {
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

  const [records, setRecords] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [ddLoading, setDdLoading] = useState(false);
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  /* -------- dropdowns (once) -------- */
  useEffect(() => {
    let mounted = true;

    const cats = [
      "EMPLOYMENTSTATUS",
      "EMPLOYMENTTYPE",
      "DESIGNATION",
      "ECONOMYSECTOR",
      "BUSINESSACTIVITY",
      "MILITARYCIVIL",
      "MILITARYRANK",
    ];

    (async () => {
      setDdLoading(true);
      try {
        const pairs = await Promise.all(
          cats.map(
            async (c) => [c, normalizeOptions(await vbValue(c))] as const,
          ),
        );
        if (!mounted) return;
        const merged: Record<string, Option[]> = {};
        pairs.forEach(([k, v]) => (merged[k] = v));

        // Fetch App CIF ID separately from port 8086 API
        const appCifOptions = await fetchAppCifOptions();
        merged["APPCIFID"] = appCifOptions;

        setDdValues(merged);
      } catch (e) {
        console.error("dd fetch failed", e);
      } finally {
        if (mounted) setDdLoading(false);
      }
    })();

  }, []);

  /* -------- GET -------- */
  const fetchRecords = useCallback(async () => {
    const APPID = getAppId();
    const appNum = Number(APPID);

    if (!APPID || Number.isNaN(appNum) || appNum <= 0) {
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/ApplCifEmployment`, {
        params: { APPID: appNum, language },
      });

      const list = extract(res).map((r: any, idx) => ({
        ...r,
        id: r?.id ?? r?.TACERECID ?? r?.RECID ?? r?.ID ?? idx + 1,
      }));

      setRecords(list);
    } catch (e: any) {
      console.error("Employment API error", e);
      setRecords([]);
      toast.error(e?.message || "Failed to load employment data");
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  /* -------- columns -------- */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,
      { accessorKey: "TACERECID", header: "Employment Rec ID" },
      {
        accessorKey: "EMPLOYERNAME",
        header: "Employer Name",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.EMPLOYERNAME ??
          row.original?.EMPLOYEENAME ??
          row.original?.BUSINESSNAME ??
          "—",
      },
      {
        accessorKey: "EMPLOYEENUMBER",
        header: "Employee Number",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.EMPLOYEENUMBER ??
          row.original?.EMPLOYEEID ??
          row.original?.EMPID ??
          "—",
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

  /* -------- fields (short + keep your required ones) -------- */
  const fields: UiFieldConfig[] = useMemo(
    () => [
      {
        type: "section",
        title: "Employment",
        fields: [
          {
            name: "Appcifid",
            label: "App CIF ID",
            type: "select",
            options: ddValues.APPCIFID ?? [],
            required: true,
          },
          {
            name: "vb_Employmentstatus",
            label: "Employment Status",
            type: "select",
            options: ddValues.EMPLOYMENTSTATUS ?? [],
            required: true,
          },

          {
            name: "Vb_Employementtype",
            label: "Employment Type",
            type: "select",
            options: ddValues.EMPLOYMENTTYPE ?? [],
          },
          {
            name: "Vb_Designation",
            label: "Designation",
            type: "select",
            options: ddValues.DESIGNATION ?? [],
          },
          {
            name: "Vb_Economysector",
            label: "Economy Sector",
            type: "select",
            options: ddValues.ECONOMYSECTOR ?? [],
          },
          {
            name: "Vb_Businessactivity",
            label: "Business Activity",
            type: "select",
            options: ddValues.BUSINESSACTIVITY ?? [],
          },
          {
            name: "Vb_Militarycivil",
            label: "Military/Civil",
            type: "select",
            options: ddValues.MILITARYCIVIL ?? [],
          },
          {
            name: "Vb_Militaryrank",
            label: "Military Rank",
            type: "select",
            options: ddValues.MILITARYRANK ?? [],
          },

          { name: "Employerid", label: "Employer ID", type: "number" },
          { name: "Employername", label: "Employer Name", type: "input" },
          { name: "Employernumber", label: "Employee Number", type: "input" },

          { name: "Dateofjoining", label: "Date of Joining", type: "date" },
          { name: "Enddate", label: "End Date", type: "date" },

          {
            name: "Managername",
            label: "Manager Name",
            type: "input",
            required: true,
          },
          {
            name: "Customerfullname",
            label: "Customer Full Name",
            type: "input",
            required: true,
          },

          { name: "Remarks", label: "Remarks", type: "textarea" },
          { name: "Isprimary", label: "Is Primary", type: "switch" },

          {
            name: "Tacerecid",
            label: "Record ID",
            type: "input",
            disabled: true,
          },
        ],
      },
    ],
    [ddValues],
  );

  /* -------- map row -> form -------- */
  const toForm = (row: Row) => ({
    Tacerecid: str(row.TACERECID ?? row.Tacerecid ?? row.RECID ?? row.ID ?? ""),
    Appcifid: str(row.APPCIFID ?? row.Appcifid ?? ""),
    vb_Employmentstatus: str(
      row.VB_EMPLOYMENTSTATUS ?? row.vb_Employmentstatus ?? "",
    ),
    Vb_Employementtype: str(row.VB_EMPLOYMENTTYPE ?? ""),
    Vb_Designation: str(row.VB_DESIGNATION ?? ""),
    Vb_Economysector: str(row.VB_ECONOMYSECTOR ?? ""),
    Vb_Businessactivity: str(row.VB_BUSINESSACTIVITY ?? ""),
    Vb_Militarycivil: str(row.VB_MILITARYCIVIL ?? ""),
    Vb_Militaryrank: str(row.VB_MILITARYRANK ?? ""),

    Employerid: str(row.EMPLOYERID ?? ""),
    Employername: str(row.EMPLOYERNAME ?? ""),
    Employernumber: str(row.EMPLOYEENUMBER ?? ""),

    Dateofjoining: ymd(row.DATEOFJOINING),
    Enddate: ymd(row.ENDDATE),

    Managername: str(row.MANAGERNAME ?? ""),
    Customerfullname: str(
      row.CUSTOMERFULLNAME ??
      row.APPCUSTOMERFULLNAME ??
      row.CIFCUSTOMERFULLNAME ??
      customerName(tab, records),
    ),

    Remarks: str(row.REMARKS ?? ""),
    Isprimary: bool(row.ISPRIMARY),
  });

  /* -------- open add/edit -------- */
  const openAdd = () => {
    setSelectedRecord({
      Appcifid: str(
        tab?.APPCIFID ??
        records?.[0]?.APPCIFID ??
        ddValues.APPCIFID?.[0]?.value ??
        "",
      ),
      vb_Employmentstatus: str(ddValues.EMPLOYMENTSTATUS?.[0]?.value ?? ""),
      Customerfullname: customerName(tab, records),
      Managername: "",
      Isprimary: false,
      Remarks: "",
      Tacerecid: "",
    });
    setEditModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setSelectedRecord(toForm(row));
    setEditModalOpen(true);
  };

  /* -------- submit (POST/PUT) -------- */
  const submit = async (data: any): Promise<void> => {
    const APPID = Number(getAppId());
    if (!APPID) return void toast.error("APPID missing");
    if (!maker) return void toast.error("MAKER missing (user not found)");

    const APPCIFID = num(data.Appcifid);
    const VB_EMPLOYMENTSTATUS = num(data.vb_Employmentstatus);

    const CUSTOMERFULLNAME =
      str(data.Customerfullname).trim() || customerName(tab, records);
    const MANAGERNAME = str(data.Managername).trim();

    if (!APPCIFID) return void toast.error("APPCIFID is required");
    if (!VB_EMPLOYMENTSTATUS)
      return void toast.error("Employment Status is required");
    if (!CUSTOMERFULLNAME)
      return void toast.error("Customer Full Name is required");
    if (!MANAGERNAME) return void toast.error("Manager Name is required");

    const NOW = safeSql(new Date().toISOString());

    const request: any = {
      APPID,
      APPCIFID,
      VB_EMPLOYMENTSTATUS,

      VB_EMPLOYMENTTYPE: num(data.Vb_Employementtype),
      VB_DESIGNATION: num(data.Vb_Designation),
      VB_ECONOMYSECTOR: num(data.Vb_Economysector),
      VB_BUSINESSACTIVITY: num(data.Vb_Businessactivity),
      VB_MILITARYCIVIL: num(data.Vb_Militarycivil),
      VB_MILITARYRANK: num(data.Vb_Militaryrank),

      EMPLOYERID: num(data.Employerid),
      EMPLOYERNAME: str(data.Employername).trim(),
      EMPLOYEENUMBER: str(data.Employernumber).trim(),

      DATEOFJOINING: safeSql(data.Dateofjoining),
      ENDDATE: safeSql(data.Enddate),

      REMARKS: str(data.Remarks).trim(),
      ISPRIMARY: bool(data.Isprimary),
      RECSTATUS: true,

      CUSTOMERFULLNAME,
      MANAGERNAME,

      MAKER: maker,
      UPDATEBY: maker,
      MAKEDATE: NOW,
      UPDATEDATE: NOW,
      CHECKDATE: NOW,
    };

    const id = num(data.Tacerecid);

    const payload: any = { ...request, request: { ...request } };
    if (id) {
      payload.TACERECID = id;
      payload.request.TACERECID = id;
    }

    try {
      if (id) {
        await axios.put(`${API_BASE}/api/ApplCifEmployment/${id}`, payload, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        toast.success("Record Updated");
      } else {
        await axios.post(`${API_BASE}/api/ApplCifEmployment`, payload, {
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
      console.error("Submit error:", e?.response?.data ?? e);
      toast.error(
        e?.response?.data?.title ||
        e?.response?.data?.data ||
        e?.message ||
        "Failed to submit",
      );
    }
  };

  /* -------- delete -------- */
  const handleDelete = async (row: Row) => {
    try {
      const APPID = row.APPID || getAppId();
      const TACERECID = row.TACERECID ?? row.RECID ?? row.ID;
      const APPCIFID = row.APPCIFID ?? row.Appcifid ?? row.CIFID;

      if (!TACERECID || !APPCIFID || !APPID || !maker)
        return void toast.error("Missing delete params");

      await axios.delete(
        `${API_BASE}/api/ApplCifEmployment/?Tacerecid=${encodeURIComponent(String(TACERECID))}&Appcifid=${encodeURIComponent(
          String(APPCIFID),
        )}&Appid=${encodeURIComponent(String(APPID))}&Updateby=${encodeURIComponent(String(maker))}`,
      );

      toast.success("Record Deleted");
      await fetchRecords();
    } catch (e) {
      console.error("Delete error:", e);
      toast.error("Delete Failed");
    }
  };

  const keyMappings = {
    TACERECID: "Employment Rec ID",
    APPCIFID: "App CIF ID",
    APPID: "App ID",
    EMPLOYMENTSTATUS: "Employment Status",
    EMPLOYMENTTYPE: "Employment Type",
    DESIGNATION: "Designation",
    ECONOMYSECTOR: "Economy Sector",
    BUSINESSACTIVITY: "Business Activity",
    MILITARYCIVIL: "Military / Civil",
    MILITARYRANK: "Military Rank",
    EMPLOYERID: "Employer ID",
    EMPLOYERNAME: "Employer Name",
    EMPLOYEENUMBER: "Employee Number",
    DATEOFJOINING: "Date of Joining",
    ENDDATE: "End Date",
    MANAGERNAME: "Manager Name",
    CUSTOMERFULLNAME: "Customer Full Name",
    ISPRIMARY: "Is Primary",
    REMARKS: "Remarks",
    RECSTATUS: "Record Status",
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {loading ? "Employment (Loading…)" : "Employment"}
        </h1>

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
        key={
          selectedRecord?.Tacerecid ? `edit-${selectedRecord.Tacerecid}` : "add"
        }
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        fields={fields as any}
        onSubmit={submit}
        title={selectedRecord?.Tacerecid ? "Edit Employment" : "Add Employment"}
        description={
          selectedRecord?.Tacerecid ? "Update and save." : "Fill and save."
        }
      />
    </>
  );
}
