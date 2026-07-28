"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import GenericCardForm, {
  FieldConfig,
} from "@/components/FormComponent/GenericCardForm";
import {
  applicationResponse,
  customerDetailsResponse,
} from "@/lib/redux/slices/tabsControllerSlice";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";

interface ApplicationProps {
  tab?: any;
  appId?: string | number;
}

const FORM_FIELDS: FieldConfig[] = [
  {
    name: "DOB",
    label: "Date Of Birth",
    type: "input",
    required: true,
  },
  {
    name: "MOBILENUMBER",
    label: "Mobile Number",
    type: "input",
    required: true,
  },

  {
    name: "REQUESTAMOUNT",
    label: "Request Amount",
    type: "number",
    required: true,
  },

  {
    name: "REQUESTTENURE",
    label: "Request Tenure",
    type: "number",
    required: true,
  },

  {
    name: "FINANCEPURPOSE",
    label: "Finance Purpose",
    type: "input",
    required: true,
  },

  { name: "PROVIDEDINCOME", label: "Provided Income", type: "number" },

  {
    name: "PROVIDEDLIABILITIES",
    label: "Provided Liabilities",
    type: "number",
  },

  { name: "BRANCHID", label: "Branch ID", type: "input" },

  { name: "BRANCHNAME", label: "Branch Name", type: "input" },

  { name: "SALESCHANNEL", label: "Sales Channel", type: "input" },

  { name: "SALESDIVISION", label: "Sales Division", type: "input" },

  { name: "SOURCEENTITY", label: "Source Entity", type: "input" },

  { name: "SALESPERSONUSERID", label: "Sales Person User ID", type: "input" },

  { name: "REFERENCEUSERID", label: "Reference User ID", type: "input" },

  { name: "PROMOCODE", label: "Promo Code", type: "input" },

  { name: "REFERRALCODE", label: "Referral Code", type: "input" },

  { name: "CUSTOMERCONSENT", label: "Customer Consent", type: "switch" },

  { name: "MOBILEVERIFICATION", label: "Mobile Verification", type: "switch" },

  { name: "NAFATHVERIFICATION", label: "Nafath Verification", type: "switch" },
  {
    name: "OTHDESC1",
    label: "Other Description in English",
    type: "textarea",
  },

  {
    name: "OTHDESC2",
    label: "Other Description in Arabic",
    type: "textarea",
  },

  {
    name: "OTHDESC3",
    label: "Other Description in Other Language",
    type: "textarea",
  },
];

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

export default function Application({ tab, appId }: ApplicationProps) {
  const isReadOnly = tab?.ALLOWDATAEDIT === false || tab?.ALLOWDATAEDIT === 0;
  const [resolvedAppId, setResolvedAppId] = useState<string>("");

  const dispatch = useDispatch();
  const language = useSelector(languageParams);

  useEffect(() => {
    const rid = resolveAppId(appId, tab);
    setResolvedAppId(rid);
  }, [appId, tab]);

  const handleDataLoaded = (record: any) => {
    // 👇 Console log to see API data
    console.log("APPLICATION API RESPONSE :", record);

    dispatch(applicationResponse(record));

    const customerRows =
      record?.APPL_CIF_CUST_DETAILS ??
      record?.ApplCifCustDetails ??
      record?.CUSTOMERDETAILS ??
      record?.CustomerDetails ??
      record?.CUSTOMER_DETAILS ??
      record?.CIF_CUSTOMER_DETAILS ??
      [];

    console.log("CUSTOMER DETAILS :", customerRows);

    dispatch(
      customerDetailsResponse(
        Array.isArray(customerRows) ? customerRows : [customerRows],
      ),
    );
  };

  const transformRequest = (requestRaw: any, baseRecord: any) => {
    const payload = {
      ...requestRaw,

      Maker: String(baseRecord?.Maker ?? baseRecord?.MAKER ?? "").trim(),

      IdNumber: String(
        baseRecord?.IdNumber ?? baseRecord?.IDNUMBER ?? "",
      ).trim(),

      ProductCode: String(
        baseRecord?.ProductCode ?? baseRecord?.PRODUCTCODE ?? "",
      ).trim(),

      SubProductCode: String(
        baseRecord?.SubProductCode ?? baseRecord?.SUBPRODUCTCODE ?? "",
      ).trim(),

      MobileNumber: String(
        baseRecord?.MobileNumber ?? baseRecord?.MOBILENUMBER ?? "",
      ).trim(),
    };

    console.log("REQUEST PAYLOAD :", payload);

    return payload;
  };

  return (
    <div>
      <GenericCardForm
        title="Application"
        apiEndpoint="/api/APPL_APPLICATION"
        id={resolvedAppId}
        idParamName="APPID"
        formFields={FORM_FIELDS}
        onDataLoaded={handleDataLoaded}
        transformRequest={transformRequest}
        Language={language}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
