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
import { ddOptions, ddOptionsParams } from "@/lib/redux/slices/ddValuesSlice";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { EditModal } from "@/components/ui/editmodal";
import { useAuth } from "@/hooks/useAuth";
import { vbValue, fetchFinancierOptions } from "@/utils/dropDownApis";
import type { FieldConfig as BaseFieldConfig } from "@/types/field.types";
import { useDispatch, useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { isActive, toIso } from "@/utils/helpers";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Row = Record<string, any>;

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

const getAppId = () => {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  return (
    url.searchParams.get("appid") || localStorage.getItem("selectedAppId") || ""
  );
};

type SectionField = {
  type: "section";
  title: string;
  fields: (BaseFieldConfig & { error?: string })[];
};
type UiFieldConfig = SectionField | (BaseFieldConfig & { error?: string });

type Option = { value: string | number; label: string };

const normalizeOptions = (raw: any): Option[] => {
  const arr = Array.isArray(raw) ? raw : raw?.data;
  if (!Array.isArray(arr)) return [];

  return arr
    .map((o: any) => {
      if (o && typeof o === "object" && "value" in o && "label" in o) {
        return { value: String(o.value), label: String(o.label) };
      }
      return {
        value: String(o?.VBVALUE ?? ""),
        label: String(o?.VBVALUEDESC ?? ""),
      };
    })
    .filter((x) => x.value);
};

const DD_CATEGORIES = [
  "APPLICANTTYPE",
  "SALUTATION",
  "CUSTOMERTYPE",
  "GENDER",
  "NATIONALITY",
  "RESIDENTIALSTATUS",
  "RESIDENCETYPE",
  "MARITALSTATUS",
  "QUALIFICATIONTYPE",
  "CUSTOMERCATEGORY",
  "BASICGROUP",
  "RELIGION",
  "LANGUAGE",
  "ETHNIC",
  "INCOMEBRACKET",
  "COMPREGCATEGORY",
  "CUSTOMERSEGMENT",
  "ECONOMYSECTOR",
  "COMPANYINDUSTRY",
  "BUSINESSACTIVITY",
  "REGISTRATIONCOUNTRY",
  "REGISTRATIONCITY",
  "REVENUECATEGORY",
  "REFERREDBY",
  "RELATIONSHIPTYPE",
] as const;

/* -------------------- normalizers (used in submit) -------------------- */
const pickScalar = (v: any) => {
  if (Array.isArray(v)) return pickScalar(v[0]);
  if (v && typeof v === "object")
    return v.value ?? v.VALUE ?? v.VBVALUE ?? v.id ?? v.ID ?? "";
  return v ?? "";
};

const toNullableNumber = (v: any) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const toNullableInt = (v: any) => {
  const n = toNullableNumber(v);
  if (n === null) return null;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : null;
};

const toNullableFloat = (v: any) => {
  const n = toNullableNumber(v);
  return n === null ? null : n;
};

export default function ApplCifCustDetailsGridSimple() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const ddValues = useSelector(ddOptionsParams) as Record<string, any>;
  const language = useSelector(languageParams);

  const [records, setRecords] = useState<Row[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Row | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [ddLoading, setDdLoading] = useState(false);
  const hasFetchedDd = useRef(false);

  const updateBy = user?.userId ?? "";

  /* --------------------- dropdown loader --------------------- */
  const getVbValues = useCallback(
    async (cat: string) => {
      const raw = await vbValue(cat);
      dispatch(ddOptions({ [cat]: normalizeOptions(raw) }));
    },
    [dispatch],
  );

  useEffect(() => {
    const missing = DD_CATEGORIES.filter(
      (cat) => !(Array.isArray(ddValues?.[cat]) && ddValues[cat].length > 0),
    );

    (async () => {
      setDdLoading(true);
      try {
        // Fetch generic VB values
        await Promise.all(missing.map(getVbValues));

        // Fetch dedicated Financier logic (just like Assets module)
        const finOptions = await fetchFinancierOptions();
        dispatch(ddOptions({ FINANCIERID: finOptions }));
      } catch (e) {
        console.error("Dropdown fetch failed", e);
      } finally {
        setDdLoading(false);
      }
    })();
  }, [getVbValues, dispatch]);

  /* --------------------- fetch grid --------------------- */
  const fetchRecords = useCallback(async () => {
    const appId = getAppId();
    if (!appId) {
      toast.error("AppId not found in URL/localStorage");
      setRecords([]);
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.get<Row[]>(
        `${API_BASE}/api/ApplCifCustDetails`,
        { params: { APPID: appId, language } },
      );

      const mapped = (data ?? []).map((r) => ({
        ...r,
        id: r.APPCIFID,
        customerfullname_view: r.CUSTOMERFULLNAME ?? "",
      }));

      setRecords(mapped);
      mapped.length
        ? toast.success("Data fetched")
        : toast.info("No data found");
    } catch (e: any) {
      console.error("ApplCifCustDetails fetch failed", e);
      setRecords([]);
      toast.error(e?.message || "Failed to load customer list");
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, language]);

  /* --------------------- columns --------------------- */
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,
      { accessorKey: "customerfullname_view", header: "Customer Full Name" },
      { accessorKey: "CUSTOMERTYPE", header: "Customer Type" },
      { accessorKey: "APPLICANTTYPE", header: "Applicant Type" },
      { accessorKey: "CUSTOMERCATEGORY", header: "Customer Category" },
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

  /* --------------------- form fields (keep all fields) --------------------- */
  const fields: UiFieldConfig[] = useMemo(
    () => [
      {
        type: "section",
        title: "Customer",
        fields: [
          {
            name: "VB_FINANCIER",
            label: "Financier Name",
            type: "select",
            required: false,
            options: (ddValues?.FINANCIERID ?? []) as any,
            placeholder: "Select Financier",
          },
          {
            name: "VB_APPLICANTTYPE",
            label: "Application Type",
            type: "select",
            required: true,
            options: (ddValues?.APPLICANTTYPE ?? []) as any,
            placeholder: "Select Applicant Type",
          },
          {
            name: "VB_SALUTATION",
            label: "Salutation",
            type: "select",
            required: false,
            options: (ddValues?.SALUTATION ?? []) as any,
            placeholder: "Select Salutation",
          },
          {
            name: "VB_CUSTOMERTYPE",
            label: "Customer Type",
            type: "select",
            required: false,
            options: (ddValues?.CUSTOMERTYPE ?? []) as any,
            placeholder: "Select Customer Type",
          },
          {
            name: "VB_CUSTOMERCATEGORY",
            label: "Customer Category",
            type: "select",
            required: false,
            options: (ddValues?.CUSTOMERCATEGORY ?? []) as any,
            placeholder: "Select Category",
          },

          {
            name: "CUSTOMERFULLNAME",
            label: "Customer Full Name (English)",
            type: "input",
            required: true,
            disallow: ["special", "numbers"],
            placeholder: "Enter Full Name",
          },
          {
            name: "CUSTOMERFULLNAME1",
            label: "Customer Full Name (Arabic)",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Full Name 1",
          },
          {
            name: "CUSTOMERFULLNAME2",
            label: "Customer Full Name (Other Language)",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Full Name 2",
          },
          {
            name: "Customerfullname3",
            label: "Customer Full Name 3",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Full Name 3",
          },

          {
            name: "CUSTFIRSTNAME",
            label: "Customer First Name",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter First Name",
          },
          {
            name: "CUSTFIRSTNAME1",
            label: "Customer First Name 1",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter First Name 1",
          },
          {
            name: "CUSTFIRSTNAME2",
            label: "Customer First Name 2",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter First Name 2",
          },
          {
            name: "custfirstname3",
            label: "Customer First Name 3",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter First Name 3",
          },

          {
            name: "CUSTMIDDLENAME",
            label: "Customer Middle Name",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Middle Name",
          },
          {
            name: "CUSTMIDDLENAME1",
            label: "Customer Middle Name 1",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Middle Name 1",
          },
          {
            name: "CUSTMIDDLENAME2",
            label: "Customer Middle Name 2",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Middle Name 2",
          },
          {
            name: "custmiddlenamE3",
            label: "Customer Middle Name 3",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Middle Name 3",
          },

          {
            name: "CUSTLASTNAME",
            label: "Customer Last Name",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Last Name",
          },
          {
            name: "CUSTLASTNAME1",
            label: "Customer Last Name 1",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Last Name 1",
          },
          {
            name: "CUSTLASTNAME2",
            label: "Customer Last Name 2",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Last Name 2",
          },
          {
            name: "custlastname3",
            label: "Customer Last Name 3",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Last Name 3",
          },

          {
            name: "CUSTFAMILYNAME",
            label: "Customer Family Name",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Family Name",
          },
          {
            name: "CUSTFAMILYNAME1",
            label: "Customer Family Name 1",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Family Name 1",
          },
          {
            name: "CUSTFAMILYNAME2",
            label: "Customer Family Name 2",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Family Name 2",
          },
          {
            name: "custfamilyname2",
            label: "Customer Family Name 3",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Family Name 3",
          },

          {
            name: "DOB_G",
            label: "Date of Birth (G)",
            type: "date",
            required: true,
          },
          {
            name: "DOB_H",
            label: "Date of Birth (H)",
            type: "input",
            required: false,
            disabled: true,
          },
          {
            name: "AGE_G",
            label: "Age (G)",
            type: "number",
            required: false,
            min: 18,
            max: 99,
          },
          {
            name: "AGE_H",
            label: "Age (H)",
            type: "number",
            required: false,
            min: 18,
            max: 99,
          },

          {
            name: "VB_GENDER",
            label: "Gender",
            type: "select",
            required: false,
            options: (ddValues?.GENDER ?? []) as any,
            placeholder: "Select Gender",
          },
          {
            name: "VB_NATIONALITY",
            label: "Nationality",
            type: "select",
            required: false,
            options: (ddValues?.NATIONALITY ?? []) as any,
            placeholder: "Select Nationality",
          },
          {
            name: "VB_RESIDENTIALSTATUS",
            label: "Residential Status",
            type: "select",
            required: false,
            options: (ddValues?.RESIDENTIALSTATUS ?? []) as any,
            placeholder: "Select Status",
          },
          {
            name: "VB_RESIDENCETYPE",
            label: "Residence Type",
            type: "select",
            required: false,
            options: (ddValues?.RESIDENCETYPE ?? []) as any,
            placeholder: "Select Residence Type",
          },
          {
            name: "VB_MARITALSTATUS",
            label: "Marital Status",
            type: "select",
            required: false,
            options: (ddValues?.MARITALSTATUS ?? []) as any,
            placeholder: "Select Marital Status",
          },
          {
            name: "NOOFDEPENDENTS",
            label: "No. of Dependents",
            type: "number",
            required: false,
            min: 0,
            max: 100,
            step: 1,
          },
          {
            name: "NOOFDOMESTICWORKER",
            label: "No. of Domestic Worker",
            type: "number",
            required: true,
            min: 0,
            max: 100,
            step: 1,
          },
          {
            name: "NOOFDEPPRIVATESCHOOL",
            label: "No. of Dep Private School",
            type: "number",
            required: true,
            min: 0,
            max: 100,
            step: 1,
          },
          {
            name: "NOOFDEPPUBLICSCHOOL",
            label: "No. of Dep Public School",
            type: "number",
            required: true,
            min: 0,
            max: 100,
            step: 1,
          },

          {
            name: "VB_QUALIFICATIONTYPE",
            label: "Qualification Type",
            type: "select",
            required: false,
            options: (ddValues?.QUALIFICATIONTYPE ?? []) as any,
            placeholder: "Select Qualification",
          },
          {
            name: "MOTHERSNAME",
            label: "Mother's Name",
            type: "input",
            required: false,
            disallow: ["special", "numbers"],
            placeholder: "Enter Mother's Name",
          },
          {
            name: "VB_BASICGROUP",
            label: "Basic Group",
            type: "select",
            required: false,
            options: (ddValues?.BASICGROUP ?? []) as any,
            placeholder: "Select Basic Group",
          },
          {
            name: "VB_RELIGION",
            label: "Religion",
            type: "select",
            required: false,
            options: (ddValues?.RELIGION ?? []) as any,
            placeholder: "Select Religion",
          },
          {
            name: "VB_LANGUAGE",
            label: "Language",
            type: "select",
            required: false,
            options: (ddValues?.LANGUAGE ?? []) as any,
            placeholder: "Select Language",
          },
          {
            name: "VB_ETHNIC",
            label: "Ethnic",
            type: "select",
            required: false,
            options: (ddValues?.ETHNIC ?? []) as any,
            placeholder: "Select Ethnic",
          },
          {
            name: "VB_INCOMEBRACKET",
            label: "Income Bracket",
            type: "select",
            required: false,
            options: (ddValues?.INCOMEBRACKET ?? []) as any,
            placeholder: "Select Income Bracket",
          },
        ],
      },

      {
        type: "section",
        title: "Business",
        fields: [
          {
            name: "VB_COMPREGCATEGORY",
            label: "Company Reg Category",
            type: "select",
            required: false,
            options: (ddValues?.COMPREGCATEGORY ?? []) as any,
            placeholder: "Select Category",
          },
          {
            name: "VB_CUSTOMERSEGMENT",
            label: "Customer Segment",
            type: "select",
            required: false,
            options: (ddValues?.CUSTOMERSEGMENT ?? []) as any,
            placeholder: "Select Segment",
          },
          {
            name: "VB_ECONOMYSECTOR",
            label: "Economy Segment",
            type: "select",
            required: false,
            options: (ddValues?.ECONOMYSECTOR ?? []) as any,
            placeholder: "Select Economy Sector",
          },
          {
            name: "VB_COMPANYINDUSTRY",
            label: "Company Industry",
            type: "select",
            required: false,
            options: (ddValues?.COMPANYINDUSTRY ?? []) as any,
            placeholder: "Select Industry",
          },
          {
            name: "VB_BUSINESSACTIVITY",
            label: "Business Activity",
            type: "select",
            required: false,
            options: (ddValues?.BUSINESSACTIVITY ?? []) as any,
            placeholder: "Select Activity",
          },
          {
            name: "VB_REGISTRATIONCOUNTRY",
            label: "Registration Country",
            type: "select",
            required: false,
            options: (ddValues?.REGISTRATIONCOUNTRY ?? []) as any,
            placeholder: "Select Country",
          },
          {
            name: "VB_REGISTRATIONCITY",
            label: "Registration City",
            type: "select",
            required: false,
            options: (ddValues?.REGISTRATIONCITY ?? []) as any,
            placeholder: "Select City",
          },
          {
            name: "BUSINESSVATNO",
            label: "Business VAT No",
            type: "input",
            required: false,
            max: 15,
            placeholder: "Enter VAT No",
          },
          {
            name: "BUSGROUPVATNO",
            label: "Business Group No",
            type: "input",
            required: false,
            max: 15,
            placeholder: "Enter Group No",
          },
          {
            name: "PAIDUPCAPITAL",
            label: "Paid Up Capital",
            type: "number",
            required: false,
          },
          {
            name: "ESTABLISHMENTDATE_G",
            label: "Establishment Date (G)",
            type: "date",
            required: true,
          },
          {
            name: "ESTABLISHMENTDATE_H",
            label: "Establishment Date (H)",
            type: "input",
            required: false,
            readOnly: true,
          },
        ],
      },

      {
        type: "section",
        title: "Revenue & Relationship",
        fields: [
          {
            name: "VB_REVENUECATEGORY",
            label: "Revenue Category",
            type: "select",
            required: false,
            options: (ddValues?.REVENUECATEGORY ?? []) as any,
            placeholder: "Select Revenue Category",
          },
          {
            name: "ANNUALREVENUE",
            label: "Annual Revenue",
            type: "number",
            required: false,
          },
          {
            name: "CUSTOMERRATING",
            label: "Customer Rating",
            type: "input",
            required: false,
            disallow: ["special"],
            placeholder: "0 - 5",
          },
          {
            name: "SALARYCREDITTOBANK",
            label: "Salary Credit To Bank",
            type: "switch",
            required: false,
          },
          {
            name: "VB_REFERREDBY",
            label: "Referred By",
            type: "select",
            required: false,
            options: (ddValues?.REFERREDBY ?? []) as any,
            placeholder: "Select Referred By",
          },
          {
            name: "REFERALCODE",
            label: "Referal Code",
            type: "input",
            required: false,
            disallow: ["special"],
            placeholder: "Enter Code",
          },
          {
            name: "RELATEDAPPCIFID",
            label: "Related App CIF ID",
            type: "number",
            required: false,
          },
          {
            name: "VB_RELATIONSHIPTYPE",
            label: "Relationship Type",
            type: "select",
            required: false,
            options: (ddValues?.RELATIONSHIPTYPE ?? []) as any,
            placeholder: "Select Relationship",
          },
          {
            name: "BLACKLISTED",
            label: "Blacklisted",
            type: "switch",
            required: false,
          },
        ],
      },

      {
        type: "section",
        title: "Remarks / Other",
        fields: [
          {
            name: "REMARKS",
            label: "Remarks",
            type: "textarea",
            required: false,
            disallow: ["special"],
            placeholder: "Enter Remarks",
          },
          {
            name: "OTHDESC1",
            label: "Other Description 1",
            type: "textarea",
            required: false,
            disallow: ["special"],
            placeholder: "Enter Description",
          },
          {
            name: "OTHDESC2",
            label: "Other Description 2",
            type: "textarea",
            required: false,
            disallow: ["special"],
            placeholder: "Enter Description",
          },
          {
            name: "OTHDESC3",
            label: "Other Description 3",
            type: "textarea",
            required: false,
            disallow: ["special"],
            placeholder: "Enter Description",
          },
        ],
      },
    ],
    [ddValues],
  );

  /* --------------------- open modal helpers --------------------- */
  const openAdd = useCallback(() => {
    const appId = getAppId();
    const today = new Date().toISOString().slice(0, 10);

    const derivedCifid =
      records?.[0]?.cifid ?? records?.[0]?.CIFID ?? records?.[0]?.Cifid ?? null;

    setSelectedRecord({
      appid: appId,
      cifid: derivedCifid,
      VB_FINANCIER: "",
      vb_Applicanttype: "",
      vb_Salutation: "",
      vbCustomertype: "",
      vb_Customercategory: "",
      customerfullname: "",
      customerfullnamE1: "",
      customerfullnamE2: "",
      custfirstname: "",
      custfirstnamE1: "",
      custfirstnamE2: "",
      custmiddlename: "",
      custmiddlenamE1: "",
      custmiddlenamE2: "",
      custlastname: "",
      custlastnamE1: "",
      custlastnamE2: "",
      custfamilyname: "",
      custfamilynamE1: "",
      custfamilynamE2: "",
      doB_G: today,
      doB_H: "",
      agE_G: 0,
      agE_H: 0,
      vb_Gender: "",
      vb_Nationality: "",
      vb_Residentialstatus: "",
      vb_Residencetype: "",
      vb_Maritalstatus: "",
      noofdependents: 0,
      noofdomesticworker: 0,
      noofdepprivateschool: 0,
      noofdeppublicschool: 0,
      vb_Qualificationtype: "",
      mothersname: "",
      vb_Basicgroup: "",
      vb_Religion: "",
      vb_Language: "",
      vb_Ethnic: "",
      vb_Incomebracket: "",
      vb_Compregcategory: "",
      vb_Customersegment: "",
      vb_Economysector: "",
      vb_Companyindustry: "",
      vb_Businessactivity: "",
      vb_Registrationcountry: "",
      vb_Registrationcity: "",
      businessvatno: "",
      busgroupvatno: "",
      paidupcapital: 0,
      establishmentdatE_G: today,
      establishmentdatE_H: "",
      vb_Revenuecategory: "",
      annualrevenue: 0,
      customerrating: "",
      salarycredittobank: false,
      vb_Referredby: "",
      referalcode: "",
      blacklisted: false,
      relatedappcifid: 0,
      vb_Relationshiptype: "",
      remarks: "",
      othdesC1: "",
      othdesC2: "",
      othdesC3: "",
      othdesC4: "",
      maker: updateBy || "system",
      makedate: today,
      updateby: updateBy || "system",
      recstatus: true,
    });

    setEditModalOpen(true);
  }, [records, updateBy]);

  const openEdit = useCallback((row: Row) => {
    setSelectedRecord({
      ...row,
      doB_G: row.DOB_G?.slice(0, 10) ?? "",
      establishmentdatE_G: row.ESTABLISHMENTDATE_G?.slice(0, 10) ?? "",
      makedate:
        row.MAKEDATE?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      recstatus: row.RECSTATUS ?? true,
    });
    setEditModalOpen(true);
  }, []);

  /* --------------------- submit (keeps your request+root override) --------------------- */
  const handleFormSubmit = useCallback(
    async (data: any): Promise<void> => {
      const APPID = getAppId();
      if (!APPID) return void toast.error("AppId missing");
      if (!updateBy) return void toast.error("UpdateBy (user id) missing");

      const CIFID = data.CIFID ?? selectedRecord?.CIFID ?? records?.[0]?.CIFID;
      if (!CIFID) return void toast.error("CifId is required (not found)");

      const todayIso = new Date().toISOString().slice(0, 10) + "T00:00:00";
      const MAKER = String(updateBy || "system").trim();

      const CUSTOMERFULLNAME = String(
        data.CUSTOMERFULLNAME ?? data.customerfullname ?? "",
      ).trim();
      if (!CUSTOMERFULLNAME)
        return void toast.error("Customer Full Name is required");

      // normalize VB_* selects (fix decimal convert errors)
      const normalizedVB = {
        VB_FINANCIER: toNullableFloat(pickScalar(data.VB_FINANCIER)),
        VB_APPLICANTTYPE: toNullableFloat(pickScalar(data.VB_APPLICANTTYPE)),
        VB_SALUTATION: toNullableFloat(pickScalar(data.VB_SALUTATION)),
        VB_CUSTOMERTYPE: toNullableFloat(pickScalar(data.VB_CUSTOMERTYPE)),
        VB_CUSTOMERCATEGORY: toNullableFloat(
          pickScalar(data.VB_CUSTOMERCATEGORY),
        ),
        VB_GENDER: toNullableFloat(pickScalar(data.VB_GENDER)),
        VB_NATIONALITY: toNullableFloat(pickScalar(data.VB_NATIONALITY)),
        VB_RESIDENTIALSTATUS: toNullableFloat(
          pickScalar(data.VB_RESIDENTIALSTATUS),
        ),
        VB_RESIDENCETYPE: toNullableFloat(pickScalar(data.VB_RESIDENCETYPE)),
        VB_MARITALSTATUS: toNullableFloat(pickScalar(data.VB_MARITALSTATUS)),
        VB_QUALIFICATIONTYPE: toNullableFloat(
          pickScalar(data.VB_QUALIFICATIONTYPE),
        ),
        VB_BASICGROUP: toNullableFloat(pickScalar(data.VB_BASICGROUP)),
        VB_RELIGION: toNullableFloat(pickScalar(data.VB_RELIGION)),
        VB_LANGUAGE: toNullableFloat(pickScalar(data.VB_LANGUAGE)),
        VB_ETHNIC: toNullableFloat(pickScalar(data.VB_ETHNIC)),
        VB_INCOMEBRACKET: toNullableFloat(pickScalar(data.VB_INCOMEBRACKET)),
        VB_COMPREGCATEGORY: toNullableFloat(
          pickScalar(data.VB_COMPREGCATEGORY),
        ),
        VB_CUSTOMERSEGMENT: toNullableFloat(
          pickScalar(data.VB_CUSTOMERSEGMENT),
        ),
        VB_ECONOMYSECTOR: toNullableFloat(pickScalar(data.VB_ECONOMYSECTOR)),
        VB_COMPANYINDUSTRY: toNullableFloat(
          pickScalar(data.VB_COMPANYINDUSTRY),
        ),
        VB_BUSINESSACTIVITY: toNullableFloat(
          pickScalar(data.VB_BUSINESSACTIVITY),
        ),
        VB_REGISTRATIONCOUNTRY: toNullableFloat(
          pickScalar(data.VB_REGISTRATIONCOUNTRY),
        ),
        VB_REGISTRATIONCITY: toNullableFloat(
          pickScalar(data.VB_REGISTRATIONCITY),
        ),
        VB_REVENUECATEGORY: toNullableFloat(
          pickScalar(data.VB_REVENUECATEGORY),
        ),
        VB_REFERREDBY: toNullableFloat(pickScalar(data.VB_REFERREDBY)),
        VB_RELATIONSHIPTYPE: toNullableFloat(
          pickScalar(data.VB_RELATIONSHIPTYPE),
        ),
      };

      // normalize ints (fix AGE_G int convert + similar)
      const normalizedInts = {
        AGE_G: toNullableInt(data.AGE_G),
        AGE_H: toNullableInt(data.AGE_H),
        NOOFDEPENDENTS: toNullableInt(data.NOOFDEPENDENTS),
        NOOFDOMESTICWORKER: toNullableInt(data.NOOFDOMESTICWORKER),
        NOOFDEPPRIVATESCHOOL: toNullableInt(data.NOOFDEPPRIVATESCHOOL),
        NOOFDEPPUBLICSCHOOL: toNullableInt(data.NOOFDEPPUBLICSCHOOL),
        RELATEDAPPCIFID: toNullableInt(data.RELATEDAPPCIFID),
      };

      // optional numeric fields
      const normalizedNumbers = {
        PAIDUPCAPITAL: toNullableFloat(data.PAIDUPCAPITAL),
        ANNUALREVENUE: toNullableFloat(data.ANNUALREVENUE),
      };

      const body = {
        ...data,

        ...normalizedVB,
        ...normalizedInts,
        ...normalizedNumbers,

        APPID,
        CIFID,
        MAKER,
        UPDATEBY: MAKER,
        CUSTOMERFULLNAME,

        DOB_G: toIso(data.DOB_G) ?? todayIso,
        ESTABLISHMENTDATE_G: toIso(data.ESTABLISHMENTDATE_G) ?? todayIso,
        MAKEDATE: toIso(data.MAKEDATE) ?? todayIso,

        RECSTATUS: data.RECSTATUS ?? true,
        BLACKLISTED: data.BLACKLISTED ?? false,
      };

      try {
        const id = selectedRecord?.APPCIFID ?? null;

        // ✅ backend error says: request field is required → use lowercase `request`
        // ✅ “override allfields with req object” → root has all fields + request contains same
        const payload: any = { ...body, request: body };
        if (id) payload.APPCIFID = id;

        if (id) {
          await axios.put(`${API_BASE}/api/ApplCifCustDetails/${id}`, payload, {
            headers: { "Content-Type": "application/json" },
          });
          toast.success("Record Updated");
        } else {
          await axios.post(`${API_BASE}/api/ApplCifCustDetails`, payload, {
            headers: { "Content-Type": "application/json" },
          });
          toast.success("Record Added");
        }

        await fetchRecords();
        setEditModalOpen(false);
        setSelectedRecord(null);
      } catch (e: any) {
        const server = e?.response?.data;
        const msg =
          server?.message ||
          server?.title ||
          server?.data ||
          Object.values(server?.errors ?? {})
            .flat()
            .join(" | ") ||
          e?.message ||
          "Submit failed";

        toast.error(msg);
      }
    },
    [fetchRecords, records, selectedRecord, updateBy],
  );

  /* --------------------- delete --------------------- */
  const handleDelete = useCallback(
    async (row: Row) => {
      const appId = row.APPID || row.appid || getAppId();
      const appcifid =
        row.APPCIFID ?? row.Appcifid ?? row.appcifid ?? row.id ?? null;

      try {
        await axios.delete(
          `${API_BASE}/api/ApplCifCustDetails/?Appcifid=${appcifid}&Appid=${appId}&Updateby=${updateBy}`,
        );
        toast.success("Record Deleted");
        await fetchRecords();
      } catch (e) {
        console.error("Delete Error:", e);
        toast.error("Delete failed");
      }
    },
    [fetchRecords, updateBy],
  );

  /* --------------------- keyMappings (kept) --------------------- */
  const keyMappings = {
    APPCIFID: "App CIF ID",
    APPID: "App ID",
    CIFID: "CIF ID",
    APPCUSTOMERFULLNAME: "Customer Name",
    CIFCUSTOMERFULLNAME: "Customer Name",
    FINANCIER: "Financier Name",
    APPLICANTTYPE: "Applicant Type",
    CUSTOMERFULLNAME: "Customer Name (English)",
    CUSTOMERFULLNAME1: "Customer Name (Arabic)",
    CUSTOMERFULLNAME2: "Customer Name (Other Language)",
    SALUTATION: "Salutation",
    CUSTFIRSTNAME: "Customer First Name (English)",
    CUSTFIRSTNAME1: "Customer First Name (Arabic)",
    CUSTFIRSTNAME2: "Customer First Name (Other Language)",
    CUSTMIDDLENAME: "Customer Middle Name (English)",
    CUSTMIDDLENAME1: "Customer Middle Name (Arabic)",
    CUSTMIDDLENAME2: "Customer Middle Name (Other Language)",
    CUSTLASTNAME: "Customer Last Name (English)",
    CUSTLASTNAME1: "Customer Last Name (Arabic)",
    CUSTLASTNAME2: "Customer Last Name (Other Language)",
    CUSTFAMILYNAME: "Customer Family Name (English)",
    CUSTFAMILYNAME1: "Customer Family Name (Arabic)",
    CUSTFAMILYNAME2: "Customer Family Name (Other Language)",
    CUSTOMERTYPE: "Customer Type",
    DOB_G: "Date of Birth (G)",
    DOB_H: "Date of Birth (H)",
    AGE_G: "Age (G)",
    AGE_H: "Age (H)",
    ESTABLISHMENTDATE_G: "Establishment Date (G)",
    ESTABLISHMENTDATE_H: "Establishment Date (H)",
    GENDER: "Gender",
    NATIONALITY: "Nationality",
    RESIDENTIALSTATUS: "Residential Status",
    RESIDENCETYPE: "Residence Type",
    MARITALSTATUS: "Marital Status",
    NOOFDEPENDENTS: "Number of Dependents",
    NOOFDOMESTICWORKER: "Number of Domestic Workers",
    NOOFDEPPRIVATESCHOOL: "Dependents in Private School",
    NOOFDEPPUBLICSCHOOL: "Dependents in Public School",
    QUALIFICATIONTYPE: "Qualification Type",
    CUSTOMERCATEGORY: "Customer Category",
    MOTHERSNAME: "Mother's Name",
    BASICGROUP: "Basic Group",
    RELIGION: "Religion",
    LANGUAGE: "Language",
    ETHNIC: "Ethnic",
    INCOMEBRACKET: "Income Bracket",
    COMPREGCATEGORY: "Company Registration Category",
    CUSTOMERSEGMENT: "Customer Segment",
    ECONOMYSECTOR: "Economy Sector",
    COMPANYINDUSTRY: "Company Industry",
    BUSINESSACTIVITY: "Business Activity",
    REGISTRATIONCOUNTRY: "Registration Country",
    REGISTRATIONCITY: "Registration City",
    BUSINESSVATNO: "Business VAT No",
    BUSGROUPVATNO: "Business Group VAT No",
    PAIDUPCAPITAL: "Paid Up Capital",
    REVENUECATEGORY: "Revenue Category",
    ANNUALREVENUE: "Annual Revenue",
    CUSTOMERRATING: "Customer Rating",
    SALARYCREDITTOBANK: "Salary Credit to Bank",
    REFERREDBY: "Referred By",
    REFERALCODE: "Referral Code",
    BLACKLISTED: "Blacklisted",
    RELATEDAPPCIFID: "Related App CIF ID",
    RELATIONSHIPTYPE: "Relationship Type",
    REMARKS: "Remarks",
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
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Customer Details</h1>

        <Button onClick={openAdd} disabled={ddLoading}>
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
      />
    </>
  );
}
