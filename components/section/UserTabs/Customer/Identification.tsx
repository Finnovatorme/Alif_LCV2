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

/* ---------------- UI Field Types ---------------- */
type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

export default function Identification({ tab, appId }: any) {
  const { user } = useAuth();
  const language = useSelector(languageParams);

  const userId = useMemo(() => {
    return str(user?.userId ?? "").trim();
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

  /* ✅ dropdowns once */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setDdLoading(true);
      try {
        const [appCifOptions, b, c, d] = await Promise.all([
          fetchAppCifOptions(),
          vbValue("IDTYPE"),
          vbValue("ISSUEAUTHORITY"),
          vbValue("PLACEOFISSUE"),
        ]);
        if (!mounted) return;
        setDdValues({
          APPCIFID: appCifOptions,
          IDTYPE: normalizeOptions(b),
          ISSUEAUTHORITY: normalizeOptions(c),
          PLACEOFISSUE: normalizeOptions(d),
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

  /* ✅ GET (your response is array as you showed) */
  const fetchRecords = useCallback(async () => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0) {
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get<Row[]>(
        `${API_BASE}/api/ApplCifIdentification`,
        {
          params: { APPID: appIdNum, language },
        },
      );

      const list = (Array.isArray(data) ? data : []).map((r: any, idx) => ({
        ...r,
        id: r?.id ?? r?.TACIRECID ?? idx + 1,
      }));
      setRecords(list);
    } catch (e: any) {
      console.error("ApplCifIdentification API failed", e);
      setRecords([]);
      toast.error(e?.message || "Failed to load identification");
    } finally {
      setLoading(false);
    }
  }, [currentAppId, appIdNum, language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  /* ✅ columns (use consistent keys from your response) */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      {
        id: "actions",
        header: "Actions",
      } as any,
      {
        accessorKey: "APPCIFID",
        header: "App CIF ID",
      },
      {
        accessorKey: "IDTYPE",
        header: "ID Type",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.IDTYPE ?? "—",
      },
      {
        accessorKey: "IDNUMBER",
        header: "ID Number",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.IDNUMBER ?? "—",
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

  /* ✅ fields */
  const fields: UiFieldConfig[] = useMemo(
    () => [
      {
        type: "section",
        title: "Identification",
        fields: [
          {
            name: "Appcifid",
            label: "App CIF ID",
            type: "select",
            required: true,
            options: ddValues.APPCIFID ?? [],
          },
          {
            name: "Vb_Idtype",
            label: "ID Type",
            type: "select",
            required: true,
            options: ddValues.IDTYPE ?? [],
          },
          {
            name: "Idnumber",
            label: "ID Number",
            type: "input",
            required: true,
          },
          {
            name: "Idseries",
            label: "ID Series",
            type: "input",
          },
          {
            name: "Idversionno",
            label:
              "ID Version No",
            type: "number",
          },
          { name: "date_Of_Issue_G", label: "Date Of Issue (G)", type: "date" },
          {
            name: "date_Of_Issue_H",
            label: "Date Of Issue (H)",
            type: "input",
          },
          {
            name: "date_Of_Expiry_G",
            label: "Date Of Expiry (G)",
            type: "date",
          },
          {
            name: "date_Of_Expiry_H",
            label: "Date Of Expiry (H)",
            type: "input",
          },
          {
            name: "Vb_Issueauthority",
            label: "Issue Authority",
            type: "select",
            options: ddValues.ISSUEAUTHORITY ?? [],
          },
          {
            name: "Vb_Placeofissue",
            label: "Place Of Issue",
            type: "select",
            options: ddValues.PLACEOFISSUE ?? [],
          },
          { name: "Isprimary", label: "Is Primary", type: "switch" },
          { name: "Othdesc1", label: "Other Description 1", type: "textarea" },
          { name: "Othdesc2", label: "Other Description 2", type: "textarea" },
          { name: "Othdesc3", label: "Other Description 3", type: "textarea" },
          {
            name: "Tacirecid",
            label: "TACI REC ID",
            type: "input",
            disabled: true,
          },
          { name: "Recstatus", label: "Record Status", type: "switch" },
        ],
      },
    ],
    [ddValues],
  );

  /* ✅ row -> form (use response keys directly) */
  const toForm = (row: Row) => ({
    Appid: appIdNum,
    Appcifid: str(row.APPCIFID ?? ""),
    Tacirecid: str(row.TACIRECID ?? ""),

    Vb_Idtype: str(row.VB_IDTYPE ?? ""),
    Idnumber: str(row.IDNUMBER ?? ""),
    Idseries: str(row.IDSERIES ?? ""),
    Idversionno: str(row.IDVERSIONNO ?? ""),

    date_Of_Issue_G: ymd(row.DATE_OF_ISSUE_G),
    date_Of_Issue_H: str(row.DATE_OF_ISSUE_H ?? ""),
    date_Of_Expiry_G: ymd(row.DATE_OF_EXPIRY_G),
    date_Of_Expiry_H: str(row.DATE_OF_EXPIRY_H ?? ""),

    Vb_Issueauthority: str(row.VB_ISSUEAUTHORITY ?? ""),
    Vb_Placeofissue: str(row.VB_PLACEOFISSUE ?? ""),

    Isprimary: Boolean(row.ISPRIMARY ?? false),

    Othdesc1: str(row.OTHDESC1 ?? ""),
    Othdesc2: str(row.OTHDESC2 ?? ""),
    Othdesc3: str(row.OTHDESC3 ?? ""),

    Recstatus: Boolean(row.RECSTATUS ?? true),

    Maker: str(row.MAKER ?? userId),
    Updateby: str(row.UPDATEBY ?? userId),

    Makedate: ymd(row.MAKEDATE),
    Updatedate: ymd(row.UPDATEDATE),
    Checker: str(row.CHECKER ?? ""),
    Checkdate: ymd(row.CHECKDATE),
  });

  /* ✅ add */
  const openAdd = () => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0)
      return toast.error("Invalid APPID");
    if (!userId) return toast.error("UserId not found");

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
      Vb_Idtype: "",
      Idnumber: "",
      Idseries: "",
      Idversionno: "",
      date_Of_Issue_G: "",
      date_Of_Issue_H: "",
      date_Of_Expiry_G: "",
      date_Of_Expiry_H: "",
      Vb_Issueauthority: "",
      Vb_Placeofissue: "",
      Isprimary: false,
      Recstatus: true,
      Othdesc1: "",
      Othdesc2: "",
      Othdesc3: "",
      Maker: userId,
      Updateby: userId,
      Makedate: today,
      Updatedate: today,
      Checkdate: today,
      Checker: "",
      Tacirecid: "",
    });

    setEditModalOpen(true);
  };

  /* ✅ submit */
  const handleSubmit = async (data: any): Promise<void> => {
    if (!currentAppId || Number.isNaN(appIdNum) || appIdNum <= 0) {
      toast.error("Invalid APPID");
      return;
    }

    if (!userId) {
      toast.error("UserId not found");
      return;
    }

    const tacirecid = num(data.Tacirecid);

    const request = {
      APPID: appIdNum,
      APPCIFID: num(data.Appcifid),
      TACIRECID: tacirecid,

      VB_IDTYPE: num(data.Vb_Idtype),
      IDNUMBER: str(data.Idnumber).trim(),
      IDSERIES: str(data.Idseries).trim(),
      IDVERSIONNO: num(data.Idversionno),

      DATE_OF_ISSUE_G: safeSql(data.date_Of_Issue_G),
      DATE_OF_EXPIRY_G: safeSql(data.date_Of_Expiry_G),
      DATE_OF_ISSUE_H: str(data.date_Of_Issue_H).trim(),
      DATE_OF_EXPIRY_H: str(data.date_Of_Expiry_H).trim(),

      VB_ISSUEAUTHORITY: num(data.Vb_Issueauthority),
      VB_PLACEOFISSUE: num(data.Vb_Placeofissue),

      ISPRIMARY: Boolean(data.Isprimary),
      OTHDESC1: str(data.Othdesc1),
      OTHDESC2: str(data.Othdesc2),
      OTHDESC3: str(data.Othdesc3),

      RECSTATUS: Boolean(data.Recstatus ?? true),

      MAKER: str(data.Maker || userId).trim(),
      UPDATEBY: str(data.Updateby || userId).trim(),
      MAKEDATE: safeSql(data.Makedate),
      UPDATEDATE: safeSql(data.Updatedate),
      CHECKDATE: safeSql(data.Checkdate),
      CHECKER: str(data.Checker),
    };

    const payload = { request, ...request };

    if (!payload.APPCIFID) {
      toast.error("APPCIFID is required");
      return;
    }
    if (!payload.VB_IDTYPE) {
      toast.error("ID Type is required");
      return;
    }
    if (!payload.IDNUMBER) {
      toast.error("ID Number is required");
      return;
    }

    try {
      if (tacirecid) {
        await axios.put(
          `${API_BASE}/api/ApplCifIdentification/${tacirecid}`,
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
        await axios.post(`${API_BASE}/api/ApplCifIdentification`, payload, {
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
          "Failed",
      });
      return;
    }
  };

  /* ✅ delete */
  const handleDelete = async (row: Row) => {
    const TACIRECID = row?.TACIRECID;
    const APPCIFID = row?.APPCIFID;

    if (
      !TACIRECID ||
      !APPCIFID ||
      !userId ||
      !currentAppId ||
      Number.isNaN(appIdNum)
    ) {
      return toast.error("Missing params for delete");
    }

    try {
      const url =
        `${API_BASE}/api/ApplCifIdentification/?` +
        `Tacirecid=${encodeURIComponent(String(TACIRECID))}` +
        `&Appcifid=${encodeURIComponent(String(APPCIFID))}` +
        `&Appid=${encodeURIComponent(String(appIdNum))}` +
        `&Updateby=${encodeURIComponent(String(userId))}`;

      await axios.delete(url);

      toast.success("Record Deleted");
      await fetchRecords();
    } catch (e) {
      console.error("delete error", e);
      toast.error("Delete Failed");
    }
  };

  const keyMappings = {
    TACIRECID: "TACI Record ID",
    APPCIFID: "App CIF ID",
    APPID: "App ID",
    CIFID: "CIF ID",
    IDTYPE: "ID Type",
    IDNUMBER: "ID Number",
    IDSERIES: "ID Series",
    IDVERSIONNO: "ID Version Number",
    DATE_OF_ISSUE_G: "Date of Issue (G)",
    DATE_OF_EXPIRY_G: "Date of Expiry (G)",
    DATE_OF_ISSUE_H: "Date of Issue (H)",
    DATE_OF_EXPIRY_H: "Date of Expiry (H)",
    ISSUEAUTHORITY: "Issue Authority",
    PLACEOFISSUE: "Place of Issue",
    ISPRIMARY: "Is Primary",
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
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {loading ? "Identification (Loading…)" : "Identification"}
          {!currentAppId ? (
            <span className="ml-3 text-sm font-normal text-red-500">
              (APPID missing: localStorage.selectedAppId)
            </span>
          ) : (
            <span className="ml-3 text-sm font-normal text-gray-500">
              (APPID: {currentAppId})
            </span>
          )}
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
          selectedRecord?.Tacirecid ? `edit-${selectedRecord.Tacirecid}` : "add"
        }
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        fields={fields as any}
        onSubmit={handleSubmit}
        title={
          selectedRecord?.Tacirecid
            ? "Edit Identification"
            : "Add Identification"
        }
        description={
          selectedRecord?.Tacirecid ? "Update and save." : "Fill and save."
        }
      />
    </>
  );
}
