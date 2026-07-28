"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { toast } from "sonner";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { EditModal } from "@/components/ui/editmodal";
import type { FieldConfig as BaseFieldConfig } from "@/types/field.types";
import { useAuth } from "@/hooks/useAuth";
import { vbValue, fetchAppCifOptions } from "@/utils/dropDownApis";
import { toNum, toBool, pick, toYMD, toIso } from "@/utils/helpers";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Row = Record<string, any>;
type Option = { value: number | string; label: string };

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

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
        String(value ?? "");
      if (value === null || value === undefined) return null;
      return { value: String(value), label: String(label) };
    })
    .filter(Boolean) as Option[];
};

/* ----------------------- UI Field Types (supports "section") ----------------------- */
type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

export default function CifBank({ tab, appId }: any) {
  const { user } = useAuth();
  const language = useSelector(languageParams);

  const [records, setRecords] = useState<Row[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [ddLoading, setDdLoading] = useState(false);
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});
  const ddFetched = useRef(false);
  const [formKey, setFormKey] = useState(0);

  const updateBy =
    user?.Userid ?? user?.USERID ?? user?.userId ?? user?.id ?? user?.ID ?? "";

  /* -------- resolve APPID (props/tab then localStorage) -------- */
  const [resolvedAppId, setResolvedAppId] = useState<string>("");

  useEffect(() => {
    const fromPropsOrTab = pick(appId, tab?.APPID, tab?.AppId, tab?.appId);
    if (fromPropsOrTab) return setResolvedAppId(String(fromPropsOrTab));

    if (typeof window !== "undefined") {
      const ls = localStorage.getItem("selectedAppId") || "";
      return setResolvedAppId(String(ls));
    }
    setResolvedAppId("");
  }, [appId, tab]);

  /* -------------------- ✅ APPCIFID: removed "required" condition --------------------
     - We still keep the field (because backend supports it and response can be null)
     - But we DO NOT block Add/Edit when APPCIFID is missing
     - We DO NOT show toast error for missing APPCIFID
  ------------------------------------------------------------------- */
  const resolvedAppCifId = pick(
    tab?.APPCIFID,
    tab?.Appcifid,
    tab?.appCifId,
    tab?.appcifid,
    selectedRecord?.Appcifid,
    selectedRecord?.APPCIFID,
  );

  /* -------- dropdowns -------- */
  useEffect(() => {
    const categories = [
      "BANKCODE",
      "COUNTRY",
      "CITY",
      "BANKACCOUNTTYPE",
      "CURRENCY",
      "SOURCESOFFUNDS",
    ];

    (async () => {
      setDdLoading(true);
      try {
        const pairs = await Promise.all(
          categories.map(async (cat) => {
            const raw = await vbValue(cat);
            return [cat, normalizeOptions(raw)] as const;
          }),
        );
        const merged: Record<string, Option[]> = {};
        pairs.forEach(([k, v]) => (merged[k] = v));

        // Fetch App CIF ID separately from port 8086 API
        const appCifOptions = await fetchAppCifOptions();
        merged["APPCIFID"] = appCifOptions;

        setDdValues(merged);
      } catch (e) {
        console.error("dropdown fetch failed", e);
      } finally {
        setDdLoading(false);
      }
    })();
  }, []);

  /* -------- GET (your backend returns ALWAYS array) -------- */
  const fetchRecords = useCallback(async () => {
    if (!resolvedAppId) {
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get<Row[]>(`${API_BASE}/api/ApplCifBank`, {
        params: { APPID: resolvedAppId, language },
      });

      const mapped = (data ?? []).map((r: any) => ({
        ...r,
        id: r.TACBRECID,
      }));

      setRecords(mapped);
    } catch (e: any) {
      console.error("ApplCifBank fetch failed", e);
      setRecords([]);
      toast.error(e?.message || "Failed to fetch bank data");
    } finally {
      setLoading(false);
    }
  }, [resolvedAppId, language]);

  useEffect(() => {
    if (!resolvedAppId) return;
    fetchRecords();
  }, [resolvedAppId, fetchRecords, language]);

  /* -------- columns -------- */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,
      { accessorKey: "Tacbrecid", header: "Cif Bank Rec Id" },
      { accessorKey: "BANKCODE", header: "Bank Code" },
      { accessorKey: "Bankbranch", header: "Bank Branch" },
      { accessorKey: "BANKACCOUNTTYPE", header: "Bank Account Type" },
      // { accessorKey: "COUNTRY", header: "Country" },
      // { accessorKey: "CITY", header: "City" },
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

  /* -------- fields -------- */
  const fields: UiFieldConfig[] = useMemo(
    () => [
      {
        type: "section",
        title: "IDs",
        fields: [
          {
            name: "Appcifid",
            label: "App CIF ID",
            type: "select",
            options: ddValues.APPCIFID ?? [],
            placeholder: "Select App CIF ID",
          },
          {
            name: "Tacbrecid",
            label: "Cif Bank Rec Id",
            type: "input",
            disabled: true,
          },
        ],
      },
      {
        type: "section",
        title: "Bank Details",
        fields: [
          {
            name: "Vb_Bankcode",
            label: "Bank Code",
            type: "select",
            options: ddValues.BANKCODE ?? [],
            placeholder: "Select Bank Code",
          },
          { name: "Bankbranch", label: "Bank Branch", type: "input" },
          {
            name: "Vb_Bankaccounttype",
            label: "Bank Account Type",
            type: "select",
            options: ddValues.BANKACCOUNTTYPE ?? [],
            placeholder: "Select Account Type",
          },
          { name: "Accounttitle", label: "Account Title", type: "input" },
          { name: "Accountnumber", label: "Account Number", type: "number" },
          { name: "Iban", label: "IBAN", type: "input" },
          { name: "Swiftcode", label: "Swift Code", type: "input" },
        ],
      },
      {
        type: "section",
        title: "Location & Currency",
        fields: [
          {
            name: "Vb_Country",
            label: "Country",
            type: "select",
            options: ddValues.COUNTRY ?? [],
            placeholder: "Select Country",
            required: true,
          },
          {
            name: "vb_City",
            label: "City",
            type: "select",
            options: ddValues.CITY ?? [],
            placeholder: "Select City",
            required: true,
          },
          {
            name: "Vb_Currency",
            label: "Currency",
            type: "select",
            options: ddValues.CURRENCY ?? [],
            placeholder: "Select Currency",
          },
          {
            name: "Vb_Sourceoffunds",
            label: "Source Of Funds",
            type: "select",
            options: ddValues.SOURCESOFFUNDS ?? [],
            placeholder: "Select Source Of Funds",
          },
          { name: "Accountsince", label: "Account Since", type: "date" },
        ],
      },
      {
        type: "section",
        title: "Stats",
        fields: [
          {
            name: "Noofchequebounced",
            label: "No Of Cheque Bounced",
            type: "number",
          },
          {
            name: "Noofsalarycredited",
            label: "No Of Salary Credited",
            type: "number",
          },
          {
            name: "Averagemonthlybalance",
            label: "Average Monthly Balance",
            type: "number",
          },
          { name: "Netcredits", label: "Net Credits", type: "number" },
          { name: "Netdebits", label: "Net Debits", type: "number" },
          { name: "Isprimary", label: "Is Primary", type: "switch" },
          { name: "Recstatus", label: "Record Status", type: "switch" },
        ],
      },
      {
        type: "section",
        title: "Remarks",
        fields: [
          { name: "Remarks", label: "Remarks", type: "textarea" },
          { name: "Othdesc1", label: "Other Description 1", type: "textarea" },
          { name: "Othdesc2", label: "Other Description 2", type: "textarea" },
          { name: "Othdesc3", label: "Other Description 3", type: "textarea" },
        ],
      },
    ],
    [ddValues],
  );

  /* -------- open add (✅ removed APPCIFID blocking) -------- */
  const openAdd = () => {
    if (!resolvedAppId)
      return toast.error("APPID missing (props/tab/localStorage)");

    const today = new Date().toISOString().slice(0, 10);

    // if available, set it; if not, keep empty => will send null
    const appCifId = toNum(resolvedAppCifId, null);

    setSelectedRecord({
      appId: resolvedAppId,
      Appcifid: appCifId ? String(appCifId) : "",
      Tacbrecid: "",

      Vb_Bankcode: "",
      Bankbranch: "",
      Vb_Country: "",
      vb_City: "",
      Vb_Bankaccounttype: "",
      Accounttitle: "",
      Accountnumber: "",
      Iban: "",
      Swiftcode: "",

      Vb_Currency: "",
      Vb_Sourceoffunds: "",
      Accountsince: today,

      Noofchequebounced: "",
      Noofsalarycredited: "",
      Averagemonthlybalance: "",
      Netcredits: "",
      Netdebits: "",

      Isprimary: false,
      Recstatus: true,

      Remarks: "",
      Othdesc1: "",
      Othdesc2: "",
      Othdesc3: "",

      Maker: updateBy,
      Updateby: updateBy,
      Makedate: today,
      Updatedate: today,
      Checker: "",
      Checkdate: "",
    });

    setFormKey((k) => k + 1);
    setEditModalOpen(true);
  };

  /* -------- map API row -> form keys (EDIT) -------- */
  const toForm = (row: Row) => ({
    appId: String(row.APPID ?? resolvedAppId),
    Appcifid: String(row.APPCIFID ?? ""), // can be null -> ""
    Tacbrecid: String(row.TACBRECID ?? ""),

    Vb_Bankcode: String(row.VB_BANKCODE ?? ""),
    Bankbranch: String(row.BANKBRANCH ?? ""),
    Vb_Country: String(row.VB_COUNTRY ?? ""),
    vb_City: String(row.VB_CITY ?? ""),
    Vb_Bankaccounttype: String(row.VB_BANKACCOUNTTYPE ?? ""),

    Accounttitle: String(row.ACCOUNTTITLE ?? ""),
    Accountnumber: row.ACCOUNTNUMBER ?? "",
    Iban: String(row.IBAN ?? ""),
    Swiftcode: String(row.SWIFTCODE ?? ""),

    Vb_Currency: String(row.VB_CURRENCY ?? ""),
    Vb_Sourceoffunds: String(row.VB_SOURCESOFFUNDS ?? ""),
    Accountsince: String(row.ACCOUNTSINCE ?? ""),

    Noofchequebounced: row.NOOFCHEQUEBOUNCED ?? "",
    Noofsalarycredited: row.NOOFSALARYCREDITED ?? "",
    Averagemonthlybalance: row.AVERAGEMONTHLYBALANCE ?? "",
    Netcredits: row.NETCREDITS ?? "",
    Netdebits: row.NETDEBITS ?? "",

    Isprimary: Boolean(row.ISPRIMARY),
    Recstatus: Boolean(row.RECSTATUS),

    Remarks: String(row.REMARKS ?? ""),
    Othdesc1: String(row.OTHDESC1 ?? ""),
    Othdesc2: String(row.OTHDESC2 ?? ""),
    Othdesc3: String(row.OTHDESC3 ?? ""),

    Maker: String(row.MAKER ?? updateBy),
    Updateby: String(row.UPDATEBY ?? updateBy),
    Makedate: toYMD(row.MAKEDATE),
    Updatedate: toYMD(row.UPDATEDATE),
    Checker: String(row.CHECKER ?? ""),
    Checkdate: row.CHECKDATE ? toYMD(row.CHECKDATE) : "",
  });

  /* -------- submit -------- */
  const handleFormSubmit = async (data: any): Promise<void> => {
    if (!resolvedAppId) {
      toast.error("APPID not found");
      return;
    }

    if (!updateBy) {
      toast.error("UpdateBy (user id) not found");
      return;
    }

    const tacbrecid = toNum(data.Tacbrecid, null);

    // ✅ APPCIFID is optional now: send null if empty
    const appCifId = data.Appcifid === "" ? null : toNum(data.Appcifid, null);

    const today = new Date().toISOString().slice(0, 10);

    const request: any = {
      APPID: toNum(pick(data.appId, resolvedAppId), null),
      APPCIFID: appCifId,

      TACBRECID: tacbrecid,

      VB_BANKCODE: toNum(data.Vb_Bankcode, null),
      BANKBRANCH: String(data.Bankbranch ?? ""),

      VB_COUNTRY: toNum(data.Vb_Country, null),
      VB_CITY: toNum(data.vb_City, null),

      VB_BANKACCOUNTTYPE: toNum(data.Vb_Bankaccounttype, null),
      ACCOUNTTITLE: String(data.Accounttitle ?? ""),
      ACCOUNTNUMBER: toNum(data.Accountnumber, null),
      IBAN: String(data.Iban ?? ""),
      SWIFTCODE: String(data.Swiftcode ?? ""),

      VB_CURRENCY: toNum(data.Vb_Currency, null),
      VB_SOURCESOFFUNDS: toNum(data.Vb_Sourceoffunds, null),

      ACCOUNTSINCE: toIso(pick(data.Accountsince, today)),

      NOOFCHEQUEBOUNCED: toNum(data.Noofchequebounced, null),
      NOOFSALARYCREDITED: toNum(data.Noofsalarycredited, null),
      AVERAGEMONTHLYBALANCE: toNum(data.Averagemonthlybalance, null),
      NETCREDITS: toNum(data.Netcredits, null),
      NETDEBITS: toNum(data.Netdebits, null),

      ISPRIMARY: Boolean(data.Isprimary),
      RECSTATUS: Boolean(data.Recstatus),

      REMARKS: String(data.Remarks ?? ""),
      OTHDESC1: String(data.Othdesc1 ?? ""),
      OTHDESC2: String(data.Othdesc2 ?? ""),
      OTHDESC3: String(data.Othdesc3 ?? ""),

      MAKER: String(pick(data.Maker, updateBy)),
      UPDATEBY: String(pick(data.Updateby, updateBy)),
      MAKEDATE: toIso(pick(data.Makedate, today)),
      UPDATEDATE: toIso(pick(data.Updatedate, today)),
      CHECKER: String(data.Checker ?? ""),
      CHECKDATE: data.Checkdate ? toIso(data.Checkdate) : null,

      Appid: String(resolvedAppId),
      Appcifid: appCifId,
    };

    if (!request.VB_COUNTRY) {
      toast.error("Country is required");
      return;
    }

    if (!request.MAKER) {
      toast.error("Maker is required");
      return;
    }

    const payload = { request, Request: request, ...request };

    try {
      if (tacbrecid) {
        await axios.put(`${API_BASE}/api/ApplCifBank/${tacbrecid}`, payload, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        toast.success("Record Updated");
      } else {
        await axios.post(`${API_BASE}/api/ApplCifBank`, payload, {
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
          server?.data ||
          server?.message ||
          server?.title ||
          e?.message ||
          "Failed to submit",
      });
      return;
    }
  };

  /* -------- delete (✅ no APPCIFID condition; send empty if null) -------- */
  const handleDelete = async (row: Row) => {
    try {
      if (!updateBy) return toast.error("Updateby missing (user id not found)");
      if (!resolvedAppId)
        return toast.error("APPID missing (props/tab/localStorage)");

      const TACBRECID = row.TACBRECID;
      const APPCIFID = row.APPCIFID; // can be null

      if (!TACBRECID) return toast.error("Tacbrecid missing for delete");

      const url =
        `${API_BASE}/api/ApplCifBank/?` +
        `Tacbrecid=${encodeURIComponent(String(TACBRECID))}` +
        `&Appcifid=${encodeURIComponent(String(APPCIFID ?? ""))}` +
        `&Appid=${encodeURIComponent(String(resolvedAppId))}` +
        `&Updateby=${encodeURIComponent(String(updateBy))}`;

      await axios.delete(url, { headers: { Accept: "application/json" } });

      toast.success("Record Deleted");
      await fetchRecords();
    } catch (e: any) {
      console.error("delete failed", e?.response?.data ?? e);
      const msg =
        e?.response?.data?.data ||
        e?.response?.data?.message ||
        e?.message ||
        "Delete Failed";
      toast.error(msg);
    }
  };

  const keyMappings = {
    TACBRECID: "TACB Record ID",
    APPCIFID: "App CIF ID",
    APPID: "App ID",
    VB_BANKCODE: "VB Bank Code",
    BANKCODE: "Bank Code",
    BANKBRANCH: "Bank Branch",
    VB_COUNTRY: "VB Country",
    COUNTRY: "Country",
    VB_CITY: "VB City",
    CITY: "City",
    VB_BANKACCOUNTTYPE: "VB Bank Account Type",
    BANKACCOUNTTYPE: "Bank Account Type",
    ACCOUNTTITLE: "Account Title",
    ACCOUNTNUMBER: "Account Number",
    IBAN: "IBAN",
    SWIFTCODE: "SWIFT Code",
    VB_CURRENCY: "VB Currency",
    CURRENCY: "Currency",
    VB_SOURCESOFFUNDS: "VB Source of Funds",
    SOURCESOFFUNDS: "Source of Funds",
    ACCOUNTSINCE: "Account Since",
    NOOFCHEQUEBOUNCED: "Number of Cheques Bounced",
    NOOFSALARYCREDITED: "Number of Salary Credits",
    AVERAGEMONTHLYBALANCE: "Average Monthly Balance",
    NETCREDITS: "Net Credits",
    NETDEBITS: "Net Debits",
    REMARKS: "Remarks",
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
        <div className="text-2xl font-bold">Banks</div>

        <Button onClick={openAdd} disabled={ddLoading || loading}>
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
          setFormKey((k) => k + 1);
          setEditModalOpen(true);
        }}
        onDelete={handleDelete}
        pageSizeOptions={[5, 10, 20]}
      />

      <EditModal
        key={formKey}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        fields={fields as any}
        onSubmit={handleFormSubmit}
        title={selectedRecord?.Tacbrecid ? "Edit Bank" : "Add Bank"}
        description="Fill the bank fields and save."
      />
    </>
  );
}
