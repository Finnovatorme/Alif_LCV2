"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import GenericCardForm, {
  type FieldConfig,
} from "@/components/FormComponent/GenericCardForm";

interface SelectedSchemeProps {
  tab?: any;
  appId?: string | number;
}

/* ------------------------- FIELDS ------------------------- */
const FORM_FIELDS: FieldConfig[] = [
  { name: "FINANCIERID", label: "Financier ID", type: "number" },
  { name: "PRODUCTCODE", label: "Product Code", type: "input" },
  { name: "SUBPRODUCTCODE", label: "Sub Product Code", type: "input" },

  {
    name: "VALIDFROM",
    label: "Valid From",
    type: "input",
    placeholder: "dd/mm/yyyy",
  },
  {
    name: "VALIDTO",
    label: "Valid To",
    type: "input",
    placeholder: "dd/mm/yyyy",
  },

  {
    name: "MINLOANAMOUNT",
    label: "Min Loan Amount *",
    type: "number",
    required: true,
  },
  {
    name: "MAXLOANAMOUNT",
    label: "Max Loan Amount *",
    type: "number",
    required: true,
  },
  { name: "MINTENURE", label: "Min Tenure *", type: "number", required: true },
  { name: "MAXTENURE", label: "Max Tenure *", type: "number", required: true },
  {
    name: "MAXPROFITRATE",
    label: "Max Profit Rate *",
    type: "number",
    required: true,
  },

  { name: "RESIDUALALLOWED", label: "Residual Allowed", type: "switch" },
  {
    name: "MAXRESIDUAL",
    label: "Max Residual *",
    type: "number",
    required: true,
  },

  { name: "DOWNPAYMENTALLOWED", label: "Downpayment Allowed", type: "switch" },
  {
    name: "MINDOWNPAYMENT",
    label: "Min Downpayment *",
    type: "number",
    required: true,
  },

  { name: "RESIDUALREPAYMENT", label: "Residual Repayment", type: "switch" },

  { name: "CURRENCY", label: "Currency", type: "input" },
  { name: "REPAYMENTTYPE", label: "Repayment Type", type: "input" },

  {
    name: "REPAYFREQPRINCIPAL",
    label: "Repay Frequency Principal",
    type: "input",
  },
  { name: "REPAYFREQPROFIT", label: "Repay Frequency Profit", type: "input" },
  {
    name: "REPAYFREQINSURANCE",
    label: "Repay Frequency Insurance",
    type: "input",
  },
  {
    name: "REPAYFREQCAPITALCHARGES",
    label: "Repay Frequency Capital Charges",
    type: "input",
  },
  {
    name: "REPAYFREQAMORTCHARGES",
    label: "Repay Frequency Amort Charges",
    type: "input",
  },

  {
    name: "AMORTMETHODPROFIT",
    label: "Amortization Method Profit",
    type: "input",
  },
  {
    name: "AMORTMETHODINSURANCE",
    label: "Amortization Method Insurance",
    type: "input",
  },
  {
    name: "AMORTMETHODAMORTCHARGES",
    label: "Amortization Method Amort Charges",
    type: "input",
  },

  { name: "ISASSETFINANCE", label: "Is Asset Finance", type: "switch" },
  {
    name: "MAXASSETSALLOWED",
    label: "Max Assets Allowed *",
    type: "number",
    required: true,
  },

  { name: "ISGRACEPERIOD", label: "Is Grace Period", type: "switch" },
  {
    name: "GRACEPERIODINMONTHS",
    label: "Grace Period In Months",
    type: "number",
  },
  { name: "GRACEPERIODTYPE", label: "Grace Period Type", type: "input" },
  {
    name: "REVENUEINGRACEPERIOD",
    label: "Revenue In Grace Period",
    type: "switch",
  },
  {
    name: "INSURANCEINGRACEPERIOD",
    label: "Insurance In Grace Period",
    type: "switch",
  },

  { name: "PROFITHOLIDAY", label: "Profit Holiday", type: "switch" },
  { name: "PRINCIPALHOLIDAY", label: "Principal Holiday", type: "switch" },

  { name: "DUEDAY_DEFAULT", label: "Due Day Default", type: "input" },
  {
    name: "DUEDAYCUTOFFDAYS_DEFAULT",
    label: "Due Day Cutoff Days Default *",
    type: "number",
    required: true,
  },
  { name: "CUTOFFDAYSINGRACE", label: "Cutoff Days In Grace", type: "input" },
  {
    name: "CUTOFFSHIFTAPPROVAL",
    label: "Cutoff Shift Approval",
    type: "switch",
  },

  {
    name: "LOANROUNDING",
    label: "Loan Rounding *",
    type: "number",
    required: true,
  },
  {
    name: "INSTALLMENTROUNDING",
    label: "Installment Rounding *",
    type: "number",
    required: true,
  },

  {
    name: "MINNOOFCOAPPL",
    label: "Min Number Of Co-applicants",
    type: "number",
  },
  {
    name: "MAXNOOFCOAPPL",
    label: "Max Number Of Co-applicants",
    type: "number",
  },
  { name: "MINNOOFGUARANTOR", label: "Min Number Of Guarantors", type: "number" },
  { name: "MAXNOOFGUARANTOR", label: "Max Number Of Guarantors", type: "number" },

  { name: "TOPUPLOCKMONTHS", label: "Top Up Lock Months", type: "number" },
  {
    name: "RESCHEDULELOCKMONTHS",
    label: "Reschedule Lock Months",
    type: "number",
  },
  {
    name: "RESTRUCTURELOCKMONTHS",
    label: "Restructure Lock Months",
    type: "number",
  },
  {
    name: "PREPAYMENTLOCKMONTHS",
    label: "Prepayment Lock Months",
    type: "number",
  },

  { name: "FORECLOSUREPENALTY", label: "Foreclosure Penalty", type: "number" },
  { name: "PREPAYMENTPENALTY", label: "Prepayment Penalty", type: "number" },
  {
    name: "MINPERIODBETWEENPREPAY",
    label: "Min Period Between Prepayments",
    type: "number",
  },
  { name: "PREPAYMENTMINALLOW", label: "Prepayment Min Allow", type: "number" },
  { name: "PREPAYMENTMAXALLOW", label: "Prepayment Max Allow", type: "number" },
  { name: "PREPAYMENTINAYEAR", label: "Prepayment In A Year", type: "number" },

  { name: "PROFITBASIS", label: "Profit Basis", type: "input" },
  { name: "DAYSINYEAR", label: "Days In Year", type: "number" },
  {
    name: "COMPOUNDINGFREQUENCY",
    label: "Compounding Frequency",
    type: "input",
  },

  { name: "CARDCATEGORY", label: "Card Category", type: "input" },
  { name: "CARDTYPE", label: "Card Type", type: "input" },

  { name: "ISSTEPUPALLOWED", label: "Is Step Up Allowed", type: "switch" },
  { name: "MAXNOOFSTEPUP", label: "Max Number Of Step Up", type: "number" },
  {
    name: "STEPUPELIGIBILITYTYPE",
    label: "Step Up Eligibility Type",
    type: "input",
  },

  {
    name: "OTHERDESCEN",
    label: "Other Description in English",
    type: "textarea",
  },
  {
    name: "OTHERDESCAR",
    label: "Other Description in Arabic",
    type: "textarea",
  },
  {
    name: "OTHERDESCOTHER",
    label: "Other Description in Other Language",
    type: "textarea",
  },
];

/* ------------------------- APPID RESOLVER (same as Application) ------------------------- */
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

/* ------------------------- DATE HELPERS ------------------------- */
function ddmmyyyyToIsoOrKeep(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return v;

  // dd/mm/yyyy
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}T00:00:00`;
  }

  // already ISO or anything else -> keep
  return v;
}

/* ------------------------- COMPONENT ------------------------- */
export default function SelectedScheme({ tab, appId }: SelectedSchemeProps) {
  const language = useSelector(languageParams);
  const [resolvedAppId, setResolvedAppId] = useState<string>("");

  useEffect(() => {
    const rid = resolveAppId(appId, tab);
    setResolvedAppId(rid);
  }, [appId, tab]);

  const transformRequest = (requestRaw: any, baseRecord: any) => {
    return {
      ...requestRaw,

      // ✅ keep common fields from base record if your API expects them (same approach as Application)
      Maker: String(baseRecord?.Maker ?? baseRecord?.MAKER ?? "").trim(),
      ProductCode: String(
        baseRecord?.ProductCode ??
          baseRecord?.PRODUCTCODE ??
          requestRaw?.PRODUCTCODE ??
          "",
      ).trim(),
      SubProductCode: String(
        baseRecord?.SubProductCode ??
          baseRecord?.SUBPRODUCTCODE ??
          requestRaw?.SUBPRODUCTCODE ??
          "",
      ).trim(),

      // ✅ date conversion if user types dd/mm/yyyy
      VALIDFROM: ddmmyyyyToIsoOrKeep(requestRaw?.VALIDFROM),
      VALIDTO: ddmmyyyyToIsoOrKeep(requestRaw?.VALIDTO),
    };
  };

  return (
    <GenericCardForm
      title="Selected Scheme"
      apiEndpoint="/api/ApplScheme"
      id={resolvedAppId}
      idParamName="APPID"
      formFields={FORM_FIELDS}
      transformRequest={transformRequest}
      Language={language}
      isReadOnly={tab?.ALLOWDATAEDIT === false || tab?.ALLOWDATAEDIT === 0}
    />
  );
}
