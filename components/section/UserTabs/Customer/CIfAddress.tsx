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
import { useAuth } from "@/hooks/useAuth";
import { vbValue, fetchAppCifOptions } from "@/utils/dropDownApis";
import type { FieldConfig as BaseFieldConfig } from "@/types/field.types";
import { toNum, toBool, pick, toYMD, toIso } from "@/utils/helpers";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Option = { value: number | string; label: string };
type Row = Record<string, any>;

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

function resolveAppId(propAppId?: string | number, tab?: any) {
  if (propAppId !== undefined && propAppId !== null && propAppId !== "")
    return String(propAppId);

  const fromTab = tab?.APPID ?? tab?.appId;
  if (fromTab !== undefined && fromTab !== null && fromTab !== "")
    return String(fromTab);

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
  const arr = Array.isArray(raw) ? raw : (raw?.data ?? raw?.DATA ?? []);
  if (!Array.isArray(arr)) return [];

  return arr
    .map((o: any) => {
      const value = o?.VBVALUE ?? o?.VALUE ?? o?.value ?? o?.ID ?? o?.id;
      const label =
        o?.VBVALUEDESC ??
        o?.VALUEDESC ??
        o?.label ??
        o?.LABEL ??
        o?.NAME ??
        o?.name;
      if (value === undefined || value === null) return null;
      return { value: String(value), label: String(label ?? value) };
    })
    .filter(Boolean) as Option[];
}

/* ----------------------- UI Field Types (supports "section") ----------------------- */
type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

/* ---------------- component ---------------- */
export default function CIfAddress({ tab, appId }: any) {
  const { user } = useAuth();
  const language = useSelector(languageParams);

  const [records, setRecords] = useState<Row[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Row | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [ddLoading, setDdLoading] = useState(false);
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});
  const hasFetchedDd = useRef(false);

  const updateBy = user?.userId ?? "";

  /* -------- dropdowns (fetch once) -------- */
  useEffect(() => {
    if (hasFetchedDd.current) return;
    hasFetchedDd.current = true;

    const categories = [
      "ADDRESSTYPE",
      "ADDRSTATUS",
      "RESIDENCETYPE",
      "COUNTRY",
      "CONTACTPERSONTYPE",
      "CONTACTMETHOD",
      "PREFCONTACTTIME",
    ];

    (async () => {
      setDdLoading(true);
      try {
        // Fetch generic dropdowns
        const pairs = await Promise.all(
          categories.map(async (cat) => {
            const raw = await vbValue(cat);
            return [cat, normalizeOptions(raw)] as const;
          }),
        );

        const merged: Record<string, Option[]> = {};
        for (const [k, v] of pairs) merged[k] = v;

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

  /* -------- GET (your API returns array) -------- */
  const fetchRecords = useCallback(async () => {
    const APPID = resolveAppId(appId, tab);
    if (!APPID) {
      toast.error("APPID not found");
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get<any[]>(
        `${API_BASE}/api/ApplCifAddress`,
        {
          params: { APPID, language },
        },
      );

      const list = Array.isArray(data) ? data : [];
      const mapped = list.map((r, idx) => ({
        ...r,
        id: r.TACARECID ?? idx + 1,
      }));

      setRecords(mapped);
    } catch (e) {
      console.error("ApplCifAddress fetch failed", e);
      setRecords([]);
      toast.error("Failed to fetch address data");
    } finally {
      setLoading(false);
    }
  }, [appId, tab, language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  /* -------- columns -------- */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,
      {
        accessorKey: "TACARECID",
        header: "Rec ID",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.TACARECID ?? "—",
      },
      {
        accessorKey: "BUILDINGNO",
        header: "Building No",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.BUILDINGNO ?? "—",
      },
      {
        accessorKey: "ADDRESSTYPE",
        header: "Address Type",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.ADDRESS1 ?? "—",
      },
      {
        accessorKey: "RESIDENCETYPE",
        header: "Residence Type",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.CITYNAME ?? row.original?.CITY ?? "—",
      },
      {
        accessorKey: "REGION",
        header: "Region",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.REGION ?? row.original?.CITY ?? "—",
      },
      {
        accessorKey: "COUNTRY",
        header: "Country",
        cell: ({ row }: CellContext<Row, unknown>) =>
          row.original?.COUNTRY ?? "—",
      },
      {
        accessorKey: "RECSTATUS",
        header: "Status",
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
            name: "appCifId",
            label: "App CIF ID",
            type: "select",
            options: ddValues.APPCIFID ?? [],
            placeholder: "Select App CIF ID",
          },
          { name: "tacarecid", label: "Rec ID", type: "input", disabled: true },
        ],
      },
      {
        type: "section",
        title: "Address",
        fields: [
          { name: "buildingNo", label: "Building No", type: "number" },
          { name: "additionalNo", label: "Additional No", type: "number" },
          { name: "unitNo", label: "Unit No", type: "number" },
          { name: "nationalAddress", label: "National Address", type: "input" },

          {
            name: "vb_AddressType",
            label: "Address Type",
            type: "select",
            options: ddValues.ADDRESSTYPE ?? [],
            placeholder: "Select Address Type",
          },
          {
            name: "vb_AddrStatus",
            label: "Address Status",
            type: "select",
            options: ddValues.ADDRSTATUS ?? [],
            placeholder: "Select Address Status",
          },
          {
            name: "vb_ResidenceType",
            label: "Residence Type",
            type: "select",
            options: ddValues.RESIDENCETYPE ?? [],
            placeholder: "Select Residence Type",
          },
          {
            name: "vb_Country",
            label: "Country",
            type: "select",
            options: ddValues.COUNTRY ?? [],
            placeholder: "Select Country",
          },

          { name: "address1", label: "Address 1", type: "input" },
          { name: "address2", label: "Address 2", type: "input" },
          { name: "address3", label: "Address 3", type: "input" },
          { name: "region", label: "Region", type: "input" },
          { name: "district", label: "District", type: "input" },
          { name: "cityName", label: "City Name", type: "input" },
          { name: "pobox", label: "PO Box", type: "number" },
          { name: "zipCode", label: "Zip Code", type: "input" },
          { name: "landmark", label: "Landmark", type: "input" },

          {
            name: "occupancySince",
            label: "Occupancy Since",
            type: "date",
            required: true,
          },
        ],
      },
      {
        type: "section",
        title: "Contact",
        fields: [
          {
            name: "vb_ContactPersonType",
            label: "Contact Person Type",
            type: "select",
            options: ddValues.CONTACTPERSONTYPE ?? [],
          },
          { name: "contactPerson", label: "Contact Person", type: "input" },
          {
            name: "vb_ContactMethod",
            label: "Contact Method",
            type: "select",
            options: ddValues.CONTACTMETHOD ?? [],
          },
          {
            name: "vb_PrefContactTime",
            label: "Preferred Contact Time",
            type: "select",
            options: ddValues.PREFCONTACTTIME ?? [],
          },

          { name: "phone1", label: "Phone 1", type: "input" },
          { name: "phone1Extn", label: "Phone 1 Extn", type: "input" },
          { name: "phone2", label: "Phone 2", type: "input" },
          { name: "phone2Extn", label: "Phone 2 Extn", type: "input" },
          { name: "fax", label: "Fax", type: "input" },
          { name: "mobile1", label: "Mobile 1", type: "input" },
          { name: "mobile2", label: "Mobile 2", type: "input" },

          { name: "email", label: "Email", type: "input" },
          { name: "linkedIn", label: "LinkedIn", type: "input" },
          { name: "facebook", label: "Facebook", type: "input" },
          { name: "twitter", label: "Twitter", type: "input" },

          { name: "isPrimary", label: "Is Primary", type: "switch" },
          { name: "recStatus", label: "Record Status", type: "switch" },
        ],
      },
    ],
    [ddValues],
  );

  /* -------- open add (only sets ONE state) -------- */
  const openAdd = () => {
    const APPID = resolveAppId(appId, tab);
    const today = new Date().toISOString().slice(0, 10);

    setSelectedRecord({
      appId: APPID,
      appCifId: pick(tab?.APPCIFID, records?.[0]?.APPCIFID, ""),
      tacarecid: "",
      buildingNo: "",
      additionalNo: "",
      unitNo: "",
      nationalAddress: "",
      vb_AddressType: "",
      vb_AddrStatus: "",
      vb_ResidenceType: "",
      vb_Country: "",
      address1: "",
      address2: "",
      address3: "",
      region: "",
      district: "",
      cityName: "",
      pobox: "",
      zipCode: "",
      landmark: "",
      occupancySince: today,
      vb_ContactPersonType: "",
      contactPerson: "",
      vb_ContactMethod: "",
      vb_PrefContactTime: "",
      phone1: "",
      phone1Extn: "",
      phone2: "",
      phone2Extn: "",
      fax: "",
      mobile1: "",
      mobile2: "",
      email: "",
      linkedIn: "",
      facebook: "",
      twitter: "",
      isPrimary: false,
      recStatus: true,
    });

    setEditModalOpen(true);
  };

  /* -------- API row -> UI form data -------- */
  const toForm = (row: Row) => {
    const APPID = resolveAppId(appId, tab);
    return {
      appId: row.APPID ?? APPID,
      appCifId: row.APPCIFID ?? "",
      tacarecid: row.TACARECID ?? "",
      buildingNo: row.BUILDINGNO ?? "",
      additionalNo: row.ADDITIONALNO ?? "",
      unitNo: row.UNITNO ?? "",
      nationalAddress: row.NATIONALADDRESS ?? "",
      vb_AddressType: row.VB_ADDRESSTYPE ?? "",
      vb_AddrStatus: row.VB_ADDRSTATUS ?? "",
      vb_ResidenceType: row.VB_RESIDENCETYPE ?? "",
      vb_Country: row.VB_COUNTRY ?? "",
      address1: row.ADDRESS1 ?? "",
      address2: row.ADDRESS2 ?? "",
      address3: row.ADDRESS3 ?? "",
      region: row.REGION ?? "",
      district: row.DISTRICT ?? "",
      cityName: row.CITYNAME ?? row.CITY ?? "",
      pobox: row.POBOX ?? "",
      zipCode: row.ZIPCODE ?? "",
      landmark: row.LANDMARK ?? "",
      occupancySince: toYMD(row.OCCUPANCYSINCE),
      vb_ContactPersonType: row.VB_CONTACTPERSONTYPE ?? "",
      contactPerson: row.CONTACTPERSON ?? "",
      vb_ContactMethod: row.VB_CONTACTMETHOD ?? "",
      vb_PrefContactTime: row.VB_PREFCONTACTTIME ?? "",
      phone1: row.PHONE1 ?? "",
      phone1Extn: row.PHONE1EXTN ?? "",
      phone2: row.PHONE2 ?? "",
      phone2Extn: row.PHONE2EXTN ?? "",
      fax: row.FAX ?? "",
      mobile1: row.MOBILE1 ?? "",
      mobile2: row.MOBILE2 ?? "",
      email: row.EMAIL ?? "",
      linkedIn: row.LINKEDIN ?? "",
      facebook: row.FACEBOOK ?? "",
      twitter: row.TWITTER ?? "",
      isPrimary: toBool(row.ISPRIMARY, false),
      recStatus: toBool(row.RECSTATUS, true),
    };
  };

  const keyMappings = {
    TACARECID: "TACA Record ID",
    APPCIFID: "Application CIF ID",
    APPID: "Application ID",
    CIFID: "CIF ID",
    BUILDINGNO: "Building Number",
    ADDITIONALNO: "Additional Number",
    UNITNO: "Unit Number",
    GPSCOORDINATESLA: "GPS Coordinates Latitude",
    GPSCOORDINATESLO: "GPS Coordinates Longitude",
    NATIONALADDRESS: "National Address",
    ADDRESSTYPE: "Address Type",
    ADDRSTATUS: "Address Status",
    RESIDENCETYPE: "Residence Type",
    ADDRESS1: "Address 1",
    ADDRESS2: "Address 2",
    ADDRESS3: "Address 3",
    COUNTRY: "Country",
    REGION: "Region Name",
    DISTRICT: "District Name",
    CITY: "City",
    CITYNAME: "City Name",
    POBOX: "PO Box",
    ZIPCODE: "Zip Code",
    LANDMARK: "Landmark",
    OCCUPANCYSINCE: "Occupancy Since",
    CONTACTPERSONTYPE: "Contact Person Type",
    CONTACTPERSON: "Contact Person",
    CONTACTMETHOD: "Contact Method",
    PREFCONTACTTIME: "Preferred Contact Time",
    PHONE1: "Phone 1",
    PHONE1EXTN: "Phone 1 Extension",
    PHONE2: "Phone 2",
    PHONE2EXTN: "Phone 2 Extension",
    FAX: "Fax",
    MOBILE1: "Mobile 1",
    MOBILE2: "Mobile 2",
    EMAIL: "Email",
    LINKEDIN: "LinkedIn",
    FACEBOOK: "Facebook",
    TWITTER: "Twitter",
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
  /* -------- submit -------- */
  const handleFormSubmit = async (data: any): Promise<void> => {
    const APPID = resolveAppId(appId, tab);
    if (!APPID) {
      toast.error("APPID not found");
      return;
    }
    if (!updateBy) {
      toast.error("UpdateBy (user id) not found");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const occupancy = pick(data.occupancySince, today);

    const request: any = {
      APPID: toNum(pick(data.appId, APPID), null),
      APPCIFID: toNum(data.appCifId, null),
      TACARECID: toNum(data.tacarecid, null),

      BUILDINGNO: toNum(data.buildingNo, null),
      ADDITIONALNO: toNum(data.additionalNo, null),
      UNITNO: toNum(data.unitNo, null),

      NATIONALADDRESS: String(data.nationalAddress ?? ""),

      VB_ADDRESSTYPE: toNum(data.vb_AddressType, null),
      VB_ADDRSTATUS: toNum(data.vb_AddrStatus, null),
      VB_RESIDENCETYPE: toNum(data.vb_ResidenceType, null),
      VB_COUNTRY: toNum(data.vb_Country, null),

      ADDRESS1: String(data.address1 ?? ""),
      ADDRESS2: String(data.address2 ?? ""),
      ADDRESS3: String(data.address3 ?? ""),

      REGION: String(data.region ?? ""),
      DISTRICT: String(data.district ?? ""),
      CITYNAME: String(data.cityName ?? ""),

      POBOX: toNum(data.pobox, null),
      ZIPCODE: String(data.zipCode ?? ""),
      LANDMARK: String(data.landmark ?? ""),

      OCCUPANCYSINCE: toIso(occupancy),

      VB_CONTACTPERSONTYPE: toNum(data.vb_ContactPersonType, null),
      CONTACTPERSON: String(data.contactPerson ?? ""),
      VB_CONTACTMETHOD: toNum(data.vb_ContactMethod, null),
      VB_PREFCONTACTTIME: toNum(data.vb_PrefContactTime, null),

      PHONE1: String(data.phone1 ?? ""),
      PHONE1EXTN: String(data.phone1Extn ?? ""),
      PHONE2: String(data.phone2 ?? ""),
      PHONE2EXTN: String(data.phone2Extn ?? ""),
      FAX: String(data.fax ?? ""),
      MOBILE1: String(data.mobile1 ?? ""),
      MOBILE2: String(data.mobile2 ?? ""),

      EMAIL: String(data.email ?? ""),
      LINKEDIN: String(data.linkedIn ?? ""),
      FACEBOOK: String(data.facebook ?? ""),
      TWITTER: String(data.twitter ?? ""),

      ISPRIMARY: Boolean(data.isPrimary),
      RECSTATUS: data.recStatus ?? true,

      MAKER: String(updateBy),
      UPDATEBY: String(updateBy),
      MAKEDATE: toIso(today),
      UPDATEDATE: toIso(today),

      // minimal aliases (some backends need these exact keys)
      Maker: String(updateBy),
      Updateby: String(updateBy),
      Makedate: toIso(today),
      Updatedate: toIso(today),
    };

    if (!request.APPCIFID) {
      toast.error("APPCIFID is required");
      return;
    }

    if (!request.OCCUPANCYSINCE) {
      toast.error("Occupancy Since is required");
      return;
    }

    const payload = { request, Request: request, ...request };

    try {
      const id = toNum(data.tacarecid, null);

      if (id) {
        await axios.put(`${API_BASE}/api/ApplCifAddress/${id}`, payload, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        toast.success("Record Updated");
      } else {
        await axios.post(`${API_BASE}/api/ApplCifAddress`, payload, {
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

      toast.error(
        server?.title || server?.data || e?.message || "Failed to submit",
      );
      return;
    }
  };

  /* -------- delete -------- */
  const handleDelete = async (row: Row) => {
    try {
      const APPID = resolveAppId(appId, tab);
      const TACARECID = row.TACARECID;
      const APPCIFID = row.APPCIFID;
      if (!APPID || !TACARECID || !APPCIFID || !updateBy) {
        toast.error("Missing params for delete");
        return;
      }

      const url = `${API_BASE}/api/ApplCifAddress/?Tacarecid=${TACARECID}&Appcifid=${APPCIFID}&Appid=${APPID}&Updateby=${updateBy}`;
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
        <div className="text-2xl font-bold">Address</div>
        <Button onClick={openAdd} disabled={ddLoading || loading}>
          Add New Record
        </Button>
      </div>

      <ReusableDataTable<Row>
        initialData={records}
        columns={columns}
        keyMappings={keyMappings}
        loading={loading}
        onUpdate={(row) => {
          setSelectedRecord(toForm(row)); // ✅ ONE STATE set
          setEditModalOpen(true);
        }}
        onDelete={handleDelete}
        pageSizeOptions={[5, 10, 20]}
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord} // ✅ single source of truth
        fields={fields as any}
        onSubmit={handleFormSubmit}
        title={selectedRecord?.tacarecid ? "Edit Address" : "Add Address"}
        description="Fill the address fields and save."
      />
    </>
  );
}
