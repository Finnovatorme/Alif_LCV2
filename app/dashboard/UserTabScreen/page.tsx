"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import Kpi from "@/components/section/UserTabs/Customer/KPI";
import Detail from "@/components/section/UserTabs/Customer/Detailed";
import Tabs from "@/components/section/UserTabs/Tabs";

import { setSelectedUserId } from "@/lib/redux/slices/userTabSlice";
// @ts-ignore
import { hasDashabordParams } from "@/lib/redux/slices/dashboardApplSlice";
import { useApplicationDetails } from "@/hooks/useApplicationDetails";
import { formatAmount, formatDate } from "@/app/utils/formatters";

/** ---------------- Types (only to fix TS issues) ---------------- */
type AppId = number | null;

type RootState = {
  userTab: {
    selectedUserId: AppId;
  };
};

type AppDispatch = ReturnType<typeof useDispatch>;

type ApplicationDetails = {
  APPID?: number | string;
  APPLICATIONTYPE?: string | null;
  MAKEDATE?: string | null;
  STATUS?: string | null;

  CUSTOMERFULLNAME?: string | null;
  CIFID?: string | number | null;
  IDNUMBER?: string | number | null;
  STAGENAME?: string | null;

  REQUESTAMOUNT?: number | string | null;
  REQUESTTENURE?: number | string | null;

  APPROVEDAMOUNT?: number | string | null;
  APPROVEDTENURE?: number | string | null;

  PRODUCTCODE?: string | null;
  SUBPRODUCTCODE?: string | null;
  SALESCHANNEL?: string | null;

  INCOME?: number | string | null;
  LIABILITIES?: number | string | null;

  MOBILEVERIFICATION?: boolean | null;
};

type UseApplicationDetailsReturn = {
  data: ApplicationDetails | null;
  loading: boolean;
  error: string | null;
};
/** -------------------------------------------------------------- */

/** ✅ small helpers to satisfy strict TS without changing UI */
const toNumberOrUndefined = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const toStringOrDash = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
};

const Page = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const selectedUserId = useSelector(
    (state: RootState) => state.userTab.selectedUserId,
  );

  useEffect(() => {
    if (selectedUserId) return;

    const savedAppId = localStorage.getItem("selectedAppId");
    if (savedAppId) {
      const appId = Number(savedAppId);
      dispatch(setSelectedUserId(appId));
      dispatch(hasDashabordParams({ APPID: appId }));
    }
  }, [dispatch, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      dispatch(hasDashabordParams({ APPID: selectedUserId }));
    }
  }, [selectedUserId, dispatch]);

  // ✅ hook wants number | undefined, so convert null -> undefined
  const selectedUserIdForHook: number | undefined = selectedUserId ?? undefined;

  const { data, loading, error } = useApplicationDetails(
    selectedUserIdForHook,
  ) as UseApplicationDetailsReturn;

  if (!selectedUserId) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        No application selected
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
    );
  }

  if (!data) return null;

  // ✅ normalized numbers for formatter
  const requestAmountNum = toNumberOrUndefined(data.REQUESTAMOUNT);
  const requestTenureText = toStringOrDash(data.REQUESTTENURE);
  const approvedAmountText = toStringOrDash(data.APPROVEDAMOUNT);
  const approvedTenureText = toStringOrDash(data.APPROVEDTENURE);

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="
            flex items-center justify-center w-10 h-10 rounded-full
            bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850
            cursor-pointer
            transition-all duration-200 ease-in-out

            hover:bg-gray-100 dark:hover:bg-gray-850
            hover:scale-105
            hover:shadow-md
          "
        >
          <ArrowLeftIcon
            className="
              w-5 h-5
              text-gray-700 dark:text-gray-200
              transition-colors duration-200
            "
          />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Details</h1>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        {/* Top Gradient */}
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        {/* HEADER */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3 text-sm">
            {/* Row 1 */}
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                Application ID:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.APPID}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                Application Type:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.APPLICATIONTYPE ?? "—"}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                Application Date:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatDate(data.MAKEDATE ?? undefined)}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                Applicaion status{" "}
              </span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {data.STATUS ?? "—"}
              </span>
            </div>
            {/* Row 2 */}
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                {/* Customer Name: */}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.CUSTOMERFULLNAME || "—"}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400">CIF ID:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.CIFID || "—"}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                National ID:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.IDNUMBER || "—"}
              </span>
            </div>{" "}
            <div className="flex gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                Stage Name:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.STAGENAME || "—"}
              </span>
            </div>
          </div>

          <div className="mt-4 h-px bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* KPI SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 px-6 pb-6">
          <Kpi
            label="Requested Amount"
            value={`${formatAmount(requestAmountNum)} SAR`}
            accent="indigo"
          />
          <Kpi
            label="Tenure"
            value={`${requestTenureText} Months`}
            accent="sky"
          />
          <Kpi
            label="Approved Amount"
            value={approvedAmountText}
            accent="emerald"
          />
          <Kpi
            label="Approved Tenure"
            value={approvedTenureText}
            accent="special"
          />
        </div>

        {/* COLLAPSIBLE DETAILS */}
        <div className="px-6 pb-6">
          <div className="h-px bg-gray-200 dark:bg-gray-800 mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <Detail label="Product Code" value={data.PRODUCTCODE} />
            <Detail label="Sub Product Code" value={data.SUBPRODUCTCODE} />
            <Detail label="Sales Channel" value={data.SALESCHANNEL} />
            <Detail label="Income" value={data.INCOME || "—"} />
            <Detail label="Liabilities" value={data.LIABILITIES || "—"} />
            <Detail
              label="Mobile Verification"
              value={
                data.MOBILEVERIFICATION === true
                  ? "Verified"
                  : data.MOBILEVERIFICATION === false
                    ? "Not Verified"
                    : "—"
              }
            />
          </div>
        </div>
      </div>

      <Tabs />
    </div>
  );
};

export default Page;
