"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { toast } from "sonner";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { EditModal } from "@/components/ui/editmodal";
import type { FieldConfig } from "@/types/field.types";

import { useAuth } from "@/hooks/useAuth";
import { schemeChargeMasterGet } from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";
import axios from "@/utils/axios";

// ✅ redux
import { useDispatch, useSelector } from "react-redux";
import { ddOptions } from "@/lib/redux/slices/ddValuesSlice";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";

// ✅ api helper
import { fetchChargeIdOptions, fetchAppCifOptions } from "@/utils/dropDownApis";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Option = { value: string | number; label: string };

interface SchemeChargeProps {
  tab?: any;
  appId?: string | number;
}



/* ---------------- helpers ---------------- */
const pick = (...vals: any[]) => {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return "";
};

const toNum = (v: any, fallback: number | null = null) => {
  if (v === "" || v === null || v === undefined) return fallback;
  if (typeof v === "object") v = v?.value ?? v?.VALUE ?? v?.id ?? v?.ID ?? v;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : fallback;
};

const toBool = (v: any) => v === true || v === 1 || v === "1" || v === "true";

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

/* ---------------- types ---------------- */
type ApiRow = {
  TASCRECID?: number;
  APPCIFID?: number;
  APPID?: number;
  SCHEMEID?: number;

  CHARGEID?: number;
  CHARGEAMOUNT?: number;

  RECEIVABLEAMOUNT?: number;
  PAIDAMOUNT?: number;
  REMAININGAMOUNT?: number;

  CHARGEPAYMENTTYPE?: number | string;
  AMORTIZEFORREVENUE?: boolean | number | string;

  PAIDSTATUS?: boolean | number | string;
  RECSTATUS?: boolean | number | string;

  id?: number;
  [key: string]: any;
};

type Row = ApiRow & { id: number };

export default function SchemeChargeMasterSimple({
  tab,
  appId,
}: SchemeChargeProps) {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const language = useSelector(languageParams);

  const uid = useMemo(() => {
    const u: any = user;
    return String(u?.Userid ?? u?.userId ?? u?.id ?? "").trim() || "system";
  }, [user]);

  const [resolvedAppId, setResolvedAppId] = useState<string>("");

  const [records, setRecords] = useState<Row[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ LOCAL options
  const [chargeIdLocalOptions, setChargeIdLocalOptions] = useState<Option[]>(
    [],
  );
  const [appCifOptions, setAppCifOptions] = useState<Option[]>([]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ---------------- resolve APPID ---------------- */
  useEffect(() => {
    setResolvedAppId(resolveAppId(appId, tab));
  }, [appId, tab]);

  const hasFetchedCharge = useRef(false);
  const hasFetchedAppCif = useRef(false);

  /* ---------------- fetch dropdowns ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const options = await fetchAppCifOptions();
        if (mountedRef.current) setAppCifOptions(options);
      } catch (e) {
        console.error("fetchAppCifOptions failed", e);
      }
    })();
  }, [language]);

  /* ---------------- redux dd values (fallback) ---------------- */
  const ddValuesFromStore = useSelector((state: any) => {
    return (
      state?.ddValuesSlice?.ddValues ||
      state?.ddValuesSlice ||
      state?.ddValues?.ddValues ||
      state?.ddValues ||
      state?.featureDdValues?.ddValues ||
      state?.featureDdValues ||
      {}
    );
  });

  const chargeIdReduxOptions: Option[] = useMemo(() => {
    const raw = ddValuesFromStore?.CHARGEID;
    if (!Array.isArray(raw)) return [];
    return raw.map((o: any) => ({
      value: String(o?.value ?? o?.VALUE ?? o?.id ?? o?.ID ?? ""),
      label: String(o?.label ?? o?.LABEL ?? o?.name ?? o?.NAME ?? ""),
    }));
  }, [ddValuesFromStore]);

  const chargeIdOptions: Option[] = useMemo(() => {
    return chargeIdLocalOptions.length
      ? chargeIdLocalOptions
      : chargeIdReduxOptions;
  }, [chargeIdLocalOptions, chargeIdReduxOptions]);

  /* ---------------- fetch dropdown ---------------- */
  const getChargeIdValues = useCallback(async () => {
    try {
      const options = await fetchChargeIdOptions();

      const normalized: Option[] = (options ?? []).map((o: any) => ({
        value: String(o?.value ?? o?.VALUE ?? o?.id ?? o?.ID ?? ""),
        label: String(o?.label ?? o?.LABEL ?? o?.name ?? o?.NAME ?? ""),
      }));

      if (mountedRef.current) setChargeIdLocalOptions(normalized);
      dispatch(ddOptions({ CHARGEID: normalized }) as any);
    } catch (e) {
      console.error("❌ CHARGEID dropdown fetch failed:", e);
      if (mountedRef.current) setChargeIdLocalOptions([]);
      dispatch(ddOptions({ CHARGEID: [] }) as any);
    }
  }, [dispatch]);

  useEffect(() => {
    if (chargeIdLocalOptions.length > 0 || hasFetchedCharge.current) return;
    if (chargeIdReduxOptions.length > 0) {
      setChargeIdLocalOptions(chargeIdReduxOptions);
      hasFetchedCharge.current = true;
      return;
    }

    hasFetchedCharge.current = true;
    getChargeIdValues();
  }, [chargeIdLocalOptions.length, chargeIdReduxOptions.length, getChargeIdValues]);

  /* ---------------- GET records ---------------- */
  const fetchRecords = useCallback(async () => {
    if (!resolvedAppId) return;

    try {
      setLoading(true);

      const parameters = { APPID: resolvedAppId, language };
      const data = await schemeChargeMasterGet(parameters);

      if ((data as any)?.error) {
        toast.error((data as any)?.error || "Failed to fetch");
        if (mountedRef.current) setRecords([]);
        return;
      }

      const raw = Array.isArray(data) ? (data as ApiRow[]) : [];

      const mapped: Row[] = raw.map((r, idx) => ({
        ...r,
        id: r.TASCRECID ?? r.id ?? idx + 1,
        APPID: toNum(r.APPID, toNum(resolvedAppId, null)) ?? undefined,
        APPCIFID: toNum(r.APPCIFID, null) ?? undefined,
        SCHEMEID: toNum(r.SCHEMEID, null) ?? undefined,
        CHARGEID: toNum(r.CHARGEID, null) ?? undefined,
        CHARGEAMOUNT: toNum(r.CHARGEAMOUNT, null) ?? undefined,
        RECEIVABLEAMOUNT: toNum(r.RECEIVABLEAMOUNT, null) ?? undefined,
        PAIDAMOUNT: toNum(r.PAIDAMOUNT, null) ?? undefined,
        REMAININGAMOUNT: toNum(r.REMAININGAMOUNT, null) ?? undefined,
        CHARGEPAYMENTTYPE: r.CHARGEPAYMENTTYPE ?? "",
        AMORTIZEFORREVENUE: toBool(r.AMORTIZEFORREVENUE),
        PAIDSTATUS: toBool(r.PAIDSTATUS),
        RECSTATUS: toBool(r.RECSTATUS),
      }));

      if (mountedRef.current) setRecords(mapped);
    } catch (e: any) {
      console.error("Fetch Error:", e);
      toast.error("Failed to fetch data");
      if (mountedRef.current) setRecords([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [resolvedAppId, language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  /* ---------------- formFields ---------------- */
  const formFields = useMemo(
    () =>
      [
        {
          type: "select",
          name: "appcifid",
          label: "App CIF ID",
          error: "",
          required: true,
          options: appCifOptions,
        },
        {
          type: "select",
          name: "chargeid",
          label: "Charge ID",
          error: "",
          required: false,
          options: chargeIdOptions,
        },
        {
          type: "number",
          name: "chargeamount",
          label: "Charge Amount",
          error: "",
          required: false,
        },
      ] as unknown as FieldConfig[],
    [chargeIdOptions, appCifOptions],
  );

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      // {
      //   accessorKey: "CHARGEID",
      //   header: "Charge ID",
      //   cell: ({ row }: CellContext<Row, unknown>) =>
      //     row.original?.CHARGEID ?? "—",
      // },
      {
        accessorKey: "CHARGENAME",
        header: "Charge Name",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.CHARGENAME ?? "—",
      },
      {
        accessorKey: "CHARGEAMOUNT",
        header: "Charge Amount",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.CHARGEAMOUNT ?? "—",
      },
      {
        accessorKey: "RECEIVABLEAMOUNT",
        header: "Receivable Amount",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.RECEIVABLEAMOUNT ?? "—",
      },
      {
        accessorKey: "PAIDAMOUNT",
        header: "Paid Amount",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.PAIDAMOUNT ?? "—",
      },
      {
        accessorKey: "REMAININGAMOUNT",
        header: "Remaining Amount",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.REMAININGAMOUNT ?? "—",
      },
      {
        accessorKey: "CHARGEPAYMENTTYPE",
        header: "Charge Payment Type",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.CHARGEPAYMENTTYPE ?? "—",
      },
      {
        accessorKey: "AMORTIZEFORREVENUE",
        header: "Amortize For Revenue",
        cell: ({ row }: CellContext<Row, unknown>) =>
          toBool(row.original?.AMORTIZEFORREVENUE) ? "Yes" : "No",
      },
      {
        accessorKey: "PAIDSTATUS",
        header: "Paid Status",
        cell: ({ row }: CellContext<Row, unknown>) => {
          const v = toBool(row.original?.PAIDSTATUS);
          return (
            <span
              className={`flex flex-row items-center justify-center rounded-[5px] px-[10px] py-[2px] font-extrabold ${v
                ? "text-[#00c04b] bg-[#cefad0]"
                : "text-[#df2c14] bg-[#ffc9bb]"
                }`}
            >
              <p className="font-bold text-justify">{v ? "Paid" : "Unpaid"}</p>
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
      TASCRECID: "TASCRECID",
      APPID: "App ID",
      SCHEMEID: "Scheme ID",
      CHARGEID: "Charge ID",
      CHARGENAME: "Charge Name",
      CHARGEAMOUNT: "Charge Amount",
      RECEIVABLEAMOUNT: "Receivable Amount",
      PAIDAMOUNT: "Paid Amount",
      REMAININGAMOUNT: "Remaining Amount",
      PAIDSTATUS: "Paid Status",
      CHARGEPAYMENTTYPE: "Charge Payment Type",
      AMORTIZEFORREVENUE: "Amortize For Revenue",
      UPDATEBY: "Updated By",
      UPDATEDATE: "Update Date",
      RECSTATUS: "Record Status",
    }),
    [],
  );

  /* ---------------- postByDefault ---------------- */
  const applyPostByDefault = (payload: any) => {
    const now = new Date().toISOString();

    payload.Updateby = uid;
    payload.Updatedate = now;
    payload.Checker = uid;
    payload.Checkdate = now;
    payload.Recstatus = true;
    payload.Maker = uid;
    payload.Makedate = now;

    payload.UPDATEBY = payload.Updateby;
    payload.UPDATEDATE = payload.Updatedate;
    payload.CHECKER = payload.Checker;
    payload.CHECKDATE = payload.Checkdate;
    payload.RECSTATUS = payload.Recstatus;
    payload.MAKER = payload.Maker;
    payload.MAKEDATE = payload.Makedate;

    return payload;
  };

  /* ---------------- open add/edit ---------------- */
  const openAdd = () => {
    if (!resolvedAppId) {
      toast.error("APPID not available yet");
      return;
    }

    const base = {
      APPID: toNum(resolvedAppId, null),
      APPCIFID: toNum(pick(tab?.APPCIFID, tab?.Appcifid), null) ?? null,
      SCHEMEID: toNum(pick(tab?.SCHEMEID, tab?.Schemeid), null) ?? null,

      CHARGEID: null,
      CHARGEAMOUNT: null,
      RECSTATUS: true,
    };

    setSelectedRecord({
      ...base,
      appcifid: base.APPCIFID ? String(base.APPCIFID) : "",
      chargeid: "",
      chargeamount: "",
    });

    setEditModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setSelectedRecord({
      ...row,
      appcifid:
        row.APPCIFID !== null && row.APPCIFID !== undefined
          ? String(row.APPCIFID)
          : "",
      chargeid:
        row.CHARGEID !== null && row.CHARGEID !== undefined
          ? String(row.CHARGEID)
          : "",
      chargeamount: row.CHARGEAMOUNT ?? "",
    });
    setEditModalOpen(true);
  };

  /* ---------------- submit ---------------- */
  const postApplicationData = async (payloadWrapped: any) => {
    const isEdit = Boolean(selectedRecord?.TASCRECID);
    return isEdit
      ? axios.put(
        `${process.env.LO_API_KEY}/api/ApplSchemeChargeMaster/${selectedRecord.TASCRECID}`,
        payloadWrapped,
      )
      : axios.post(
        `${process.env.LO_API_KEY}/api/ApplSchemeChargeMaster`,
        payloadWrapped,
      );
  };

  // ✅ TS FIX: ensure Promise<void> and never "return toast.error(...)"
  const handleFormSubmit = async (formData: any): Promise<void> => {
    if (!resolvedAppId) {
      toast.error("APPID not available yet");
      return;
    }

    const APPID = toNum(resolvedAppId, null);

    const APPCIFID = toNum(pick(formData?.appcifid), null);

    const SCHEMEID = toNum(
      pick(selectedRecord?.SCHEMEID, tab?.SCHEMEID, tab?.Schemeid),
      null,
    );

    if (!APPID) {
      toast.error("APPID is required");
      return;
    }

    if (!APPCIFID) {
      toast.error("APPCIFID is required");
      return;
    }

    const CHARGEID = toNum(pick(formData?.chargeid), null);
    const CHARGEAMOUNT = toNum(pick(formData?.chargeamount), null);

    const requestBase: any = {
      APPID,
      CHARGEID,
      CHARGEAMOUNT,
      LANGUAGE: language,
    };

    if (APPCIFID !== null && APPCIFID !== undefined)
      requestBase.APPCIFID = APPCIFID;
    if (SCHEMEID !== null && SCHEMEID !== undefined)
      requestBase.SCHEMEID = SCHEMEID;

    applyPostByDefault(requestBase);

    const payloadWrapped = {
      request: requestBase,
      Request: requestBase,
      ...requestBase,
    };

    try {
      const res = await postApplicationData(payloadWrapped);

      if (res?.status === 200) {
        toast.success(
          selectedRecord?.TASCRECID ? "Record Updated" : "Record Added",
        );
        await fetchRecords();
        setEditModalOpen(false);
        setSelectedRecord(null);
      } else {
        toast.error("Operation failed");
      }
    } catch (e: any) {
      const server = e?.response?.data;
      console.error("Submit Error:", server ?? e);

      toast.error("Operation Failed", {
        description:
          server?.errors?.request?.[0] ||
          server?.errors?.["$.SCHEMEID"]?.[0] ||
          server?.errors?.["$.APPCIFID"]?.[0] ||
          server?.message ||
          server?.title ||
          e?.message ||
          "Failed to submit",
      });
    }
  };

  /* ---------------- delete ---------------- */
  const handleDelete = async (row: Row) => {
    const tascrecid = row.TASCRECID;
    if (!tascrecid) {
      toast.error("TASCRECID not found");
      return;
    }

    const APPID = row.APPID ?? toNum(resolvedAppId, null);

    const APPCIFID =
      row.APPCIFID ?? toNum(pick(tab?.APPCIFID, tab?.Appcifid), null);

    try {
      const qs = new URLSearchParams();
      qs.set("Tascrecid", String(tascrecid));
      if (APPCIFID !== null && APPCIFID !== undefined)
        qs.set("Appcifid", String(APPCIFID));
      if (APPID !== null && APPID !== undefined) qs.set("Appid", String(APPID));
      qs.set("Updateby", String(uid));

      const res = await axios.delete(
        `${process.env.LO_API_KEY}/api/ApplSchemeChargeMaster/?${qs.toString()}`,
      );

      if (res?.status === 200) {
        toast.success("Record Deleted");
        await fetchRecords();
      } else {
        toast.error("Delete failed");
      }
    } catch (e: any) {
      console.error("Delete Error:", e?.response?.data ?? e);
      toast.error("Delete failed");
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
        <div>
          <h1 className="text-3xl font-bold">Scheme Charge Master</h1>
          {/* <p className="text-sm text-slate-500">APPID: {resolvedAppId}</p> */}
        </div>

        <Button onClick={openAdd}>Add New Record</Button>
      </div>

      <ReusableDataTable<Row>
        initialData={records}
        columns={columns}
        loading={loading}
        keyMappings={keyMappings}
        onUpdate={(row) => openEdit(row as Row)}
        onDelete={(row) => handleDelete(row as Row)}
        pageSizeOptions={[5, 10, 20]}
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        fields={formFields as any}
        onSubmit={handleFormSubmit}
        title={selectedRecord?.TASCRECID ? "Edit Charge" : "Add Charge"}
        description="Fill the fields and save."
      />
    </>
  );
}
