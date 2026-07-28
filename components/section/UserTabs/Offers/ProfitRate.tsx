"use client";

import React, { useMemo } from "react";
import { Percent } from "lucide-react";
import { useSearchParams } from "next/navigation";
import GenericCardForm, {
  type FieldConfig,
} from "@/components/FormComponent/GenericCardForm";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";

const FORM_FIELDS: FieldConfig[] = [
  { name: "MINLOCK", label: "Min Lock", type: "number" },
  {
    name: "PROFITRATE",
    label: "Profit Rate *",
    type: "number",
    required: true,
  },
  { name: "MAXLOCK", label: "Max Lock", type: "number" },
];

export default function ProfitRate() {
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
      title="Profit Rate"
      icon={Percent}
      Language={language}
      apiEndpoint="/api/ApplSchemeProfitRate"
      id={resolvedAppId}
      idParamName="APPID"
      formFields={FORM_FIELDS}
      transformRequest={(requestRaw: any, baseRecord: any) => {
        // keep identifiers if backend expects them
        const recId =
          baseRecord?.TASPRECID ??
          baseRecord?.RECID ??
          requestRaw?.TASPRECID ??
          requestRaw?.RECID;

        return {
          ...(baseRecord ?? {}),
          ...(requestRaw ?? {}),
          APPID: resolvedAppId,
          ...(recId ? { TASPRECID: recId, RECID: recId } : {}),
        };
      }}
    />
  );
}
