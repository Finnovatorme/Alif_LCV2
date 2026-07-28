"use client";

import React, { useMemo } from "react";
import { FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import GenericCardForm, {
  type FieldConfig,
} from "@/components/FormComponent/GenericCardForm";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";

/**
 * NOTE:
 * - Your GenericCardForm supports: "input" | "number" | "textarea" | "select" | "switch"
 * - For dates (dd/mm/yyyy), we use type "input" and you can keep the placeholder.
 */
const FORM_FIELDS: FieldConfig[] = [
  {
    name: "APPLICATIONDATE",
    label: "Application Date",
    type: "input",
    placeholder: "dd/mm/yyyy",
  },
  {
    name: "APPROVALDATE",
    label: "Approval Date",
    type: "input",
    placeholder: "dd/mm/yyyy",
  },

  { name: "PRODUCTCODE", label: "Product Code", type: "input" },
  { name: "SUBPRODUCTCODE", label: "Sub Product Code", type: "input" },
  { name: "SCHEMEID", label: "Scheme ID", type: "input" },

  { name: "REQUESTAMOUNT", label: "Request Amount", type: "number" },
  { name: "REQUESTTENURE", label: "Request Tenure", type: "number" },
  { name: "APPROVEDAMOUNT", label: "Approved Amount", type: "number" },
  { name: "APPROVEDTENURE", label: "Approved Tenure", type: "number" },

  { name: "DOWNPAYMENTAMOUNT", label: "Downpayment Amount", type: "number" },
  { name: "RESIDUALTAMOUNT", label: "Residualt Amount", type: "number" },
  { name: "INSURANCEAMOUNT", label: "Insurance Amount", type: "number" },
  { name: "ASSETAMOUNT", label: "Asset Amount", type: "number" },
  { name: "TAXAMOUNT", label: "Tax Amount", type: "number" },

  {
    name: "CAPITALIZEDCHARGEAMOUNT",
    label: "Capitalized Charge Amount",
    type: "number",
  },
  {
    name: "AMORTIZEDCHARGEAMOUNT",
    label: "Amortized Charge Amount",
    type: "number",
  },
  {
    name: "UPFRONTCHARGEAMOUNT",
    label: "Upfront Charge Amount",
    type: "number",
  },
  { name: "OTHERCHARGEAMOUNT", label: "Other Charge Amount", type: "number" },

  { name: "PRINCIPALAMOUNT", label: "Principal Amount", type: "number" },
  {
    name: "PROFITCALCULATIONAMOUNT",
    label: "Profit Calculation Amount",
    type: "number",
  },
  { name: "PROFITRATE", label: "Profit Rate", type: "number" },
  { name: "OFFSETRATE", label: "Offset Rate", type: "number" },
  { name: "PROFITIRR", label: "Profit IRR", type: "number" },
  { name: "PROFITAPR", label: "Profit APR", type: "number" },
  { name: "PROFITAMOUNT", label: "Profit Amount", type: "number" },

  { name: "TOTALLOANAMOUNT", label: "Total Loan Amount", type: "number" },
  { name: "INSTALLMENTAMOUNT", label: "Installment Amount", type: "number" },

  { name: "OBLIGATIONAMOUNT", label: "Obligation Amount", type: "number" },
  { name: "INCOMEAMOUNT", label: "Income Amount", type: "number" },
  { name: "OTHERINCOME", label: "Other Income", type: "number" },
  {
    name: "GOVERNMENTSUPPORTINCOME",
    label: "Government Support Income",
    type: "number",
  },
  { name: "DISPOSABLEINCOME", label: "Disposable Income", type: "number" },

  { name: "ELIGIBLEMAXDBR", label: "Eligible Max DBR", type: "number" },
  {
    name: "ACTUALCALCULATEDDBR",
    label: "Actual Calculated DBR",
    type: "number",
  },
  {
    name: "PERSONALEXPENSEAMOUNT",
    label: "Personal Expense Amount",
    type: "number",
  },

  { name: "DECISIONSALES", label: "Decision Sales", type: "input" },
  { name: "DECISIONCREDIT", label: "Decision Credit", type: "input" },
  { name: "DECISIONCONTROL", label: "Decision Control", type: "input" },

  { name: "BROKENPERIODDAYS", label: "Broken Period Days", type: "number" },
  { name: "BROKENPERIODAMOUNT", label: "Broken Period Amount", type: "number" },
];

export default function LoanOffer() {
  const sp = useSearchParams();
  const language = useSelector(languageParams);

  const resolvedAppId = useMemo(() => {
    const fromQuery =
      sp.get("appid") || sp.get("APPID") || sp.get("appId") || "";

    if (fromQuery && String(fromQuery).trim() !== "") {
      return String(fromQuery).trim();
    }

    // fallback to localStorage (client only)
    if (typeof window !== "undefined") {
      const fromLocal =
        localStorage.getItem("selectedAppId") ||
        localStorage.getItem("APPID") ||
        localStorage.getItem("appId") ||
        "";

      return String(fromLocal || "").trim();
    }

    return "";
  }, [sp]);

  if (!resolvedAppId) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        Waiting for APPID…
      </div>
    );
  }

  return (
    <GenericCardForm
      title="Loan Offer"
      icon={FileText}
      Language={language}
      apiEndpoint="/api/ApplLoanOffer"
      id={resolvedAppId}
      idParamName="APPID"
      formFields={FORM_FIELDS}
      transformRequest={(requestRaw: any, baseRecord: any) => {
        // Keep identifiers if backend expects them
        const recId =
          baseRecord?.TLORECID ??
          baseRecord?.RECID ??
          requestRaw?.TLORECID ??
          requestRaw?.RECID;

        return {
          ...(baseRecord ?? {}),
          ...(requestRaw ?? {}),
          APPID: resolvedAppId,
          ...(recId ? { TLORECID: recId, RECID: recId } : {}),
        };
      }}
    />
  );
}
