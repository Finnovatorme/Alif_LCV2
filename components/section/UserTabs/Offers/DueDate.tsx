"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CalendarDays } from "lucide-react";
import { useSearchParams } from "next/navigation";
import axios from "@/utils/axios";
import GenericCardForm, {
  type FieldConfig,
} from "@/components/FormComponent/GenericCardForm";

// ✅ same logic as ApplSchemeDueday (vbValue -> ddOptions -> ddValuesParams)
import { vbValue } from "@/utils/dropDownApis";
import { useDispatch, useSelector } from "react-redux";
import { ddOptions, ddOptionsParams } from "@/lib/redux/slices/ddValuesSlice";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

interface DueDateProps {
  tab?: any;
  appId?: string | number;
}

export default function DueDate({ tab, appId }: DueDateProps) {
  const sp = useSearchParams();
  const dispatch = useDispatch();
  const language = useSelector(languageParams);
  const hasFetched = useRef(false);

  const [resolvedAppId, setResolvedAppId] = useState<string>("");
  const [tasdrecid, setTasdrecid] = useState<number | string | null>(null);
  const [formReset, setFormReset] = useState(false);

  // ✅ dd values from redux (same as old file)
  const ddValues = useSelector(ddOptionsParams);

  // ✅ take APPID from URL: ?appid=40247
  const appidFromQuery = useMemo(() => {
    return sp.get("appid") || sp.get("APPID") || sp.get("appId") || "";
  }, [sp]);

  // ✅ resolve APPID (priority: prop -> query -> tab)
  useEffect(() => {
    const fromProp =
      appId !== undefined && appId !== null && String(appId).trim() !== ""
        ? String(appId).trim()
        : "";

    const fromTab = tab?.APPID ?? tab?.AppId ?? tab?.appId ?? tab?.appid ?? "";

    let fromLocal = "";

    if (typeof window !== "undefined") {
      fromLocal =
        localStorage.getItem("selectedAppId") ||
        localStorage.getItem("APPID") ||
        localStorage.getItem("appId") ||
        "";
    }

    const rid =
      fromProp ||
      appidFromQuery ||
      String(fromTab || "").trim() ||
      String(fromLocal || "").trim();

    setResolvedAppId(rid);

    console.log("Resolved APPID:", {
      fromProp,
      fromQuery: appidFromQuery,
      fromTab,
      fromLocal,
      final: rid,
    });
  }, [appId, tab, appidFromQuery]);

  /* ---------------- ✅ SAME DROPDOWN LOGIC (DUEDAY) ---------------- */
  const getVbValues = useCallback(
    async (cat: string) => {
      const vbTypeOptions = await vbValue(cat);
      const vbToAdd = { [cat]: vbTypeOptions };
      dispatch(ddOptions(vbToAdd));
    },
    [dispatch],
  );

  useEffect(() => {
    const categories = ["DUEDAY"];

    categories.forEach((cat) => {
      getVbValues(cat);
    });
  }, [getVbValues]);

  // ✅ build fields (now DUEDAY is a select using ddValues.DUEDAY)
  const FORM_FIELDS: FieldConfig[] = useMemo(
    () => [
      {
        name: "DUEDAY",
        label: "Due Day",
        type: "select",
        options: ddValues?.DUEDAY,
      },
      {
        name: "DUEDAYCUTOFFDAYS",
        label: "Due Day Cut Off Days *",
        type: "number",
        required: true,
      },
    ],
    [ddValues],
  );

  // ✅ Fetch TASDRECID
  useEffect(() => {
    if (!resolvedAppId) return;

    const fetchTasdrecid = async () => {
      try {
        const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
        const res = await axios.get(
          `${baseUrl}/api/ApplSchemeDueday?APPID=${resolvedAppId}&Language=${language}`,
        );

        const record =
          res.data?.data?.[0] ??
          res.data?.data ??
          res.data?.DATA?.[0] ??
          res.data?.DATA ??
          res.data?.result?.[0] ??
          res.data?.result ??
          res.data?.[0] ??
          res.data ??
          null;

        const recId =
          record?.TASDRECID ?? record?.tasdrecid ?? record?.Tasdrecid ?? null;

        setTasdrecid(recId);
      } catch (e) {
        console.error("Failed to fetch TASDRECID", e);
        setTasdrecid(null);
      }
    };

    fetchTasdrecid();
  }, [resolvedAppId, language]);

  // ✅ submit handler (forces DUEDAY as string)
  const handleSubmitRequest = async (dataToPost: any): Promise<void> => {
    if (!resolvedAppId) throw new Error("APPID not available yet");
    if (!tasdrecid) throw new Error("TASDRECID not loaded yet");

    const payload = {
      ...dataToPost,
      DUEDAY: String(dataToPost?.DUEDAY ?? ""),
      APPID: resolvedAppId,
    };

    const response = await axios.put(
      `${API_BASE}/api/ApplSchemeDueday?TASDRECID=${tasdrecid}`,
      payload,
    );

    if (response.status === 200) {
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      await axios.get(
        `${baseUrl}/api/ApplSchemeDueday?APPID=${resolvedAppId}&Language=${language}`,
      );
      setFormReset((prev) => !prev);
    }
  };

  if (!resolvedAppId) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        Waiting for APPID…
      </div>
    );
  }

  // ✅ TS FIX: GenericCardForm uses `onSubmit` prop (not `onSubmitRequest`)
  return (
    <GenericCardForm
      key={String(formReset)}
      title="Due Day"
      icon={CalendarDays}
      apiEndpoint="/api/ApplSchemeDueday"
      id={resolvedAppId}
      idParamName="APPID"
      formFields={FORM_FIELDS}
      onSubmit={handleSubmitRequest}
      Language={language}
    />
  );
}
