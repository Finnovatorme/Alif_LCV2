"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  Layers,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  languageParams,
  hasDashabordParams,
} from "@/lib/redux/slices/dashboardApplSlice";
import { setSelectedUserId } from "@/lib/redux/slices/userTabSlice";
import { formatDateKSA, formatAmountKSA } from "@/utils/helpers";
import {
  FollowUpScreenType,
  getFollowUpOwnershipData,
  UserFollowUpItem,
} from "./HandlingAPIs";

export type OwnershipFilter = "all" | "my" | "subordinate";

interface FollowUpViewProps {
  screenType?: FollowUpScreenType;
}

const SCREEN_CONFIG: Record<
  FollowUpScreenType,
  {
    title: string;
    recordTitle: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColorClass: string;
    tableGradientClass: string;
  }
> = {
  pending: {
    title: "Pending Follow Up",
    recordTitle: "Pending Followup Records",
    subtitle: "Pending follow-up cases for user:",
    icon: Clock,
    iconColorClass: "text-blue-600 dark:text-blue-400",
    tableGradientClass: "from-blue-500 via-sky-500 to-indigo-500",
  },
  completed: {
    title: "Completed Follow Up",
    recordTitle: "Completed Followup Records",
    subtitle: "Completed follow-up cases for user:",
    icon: CheckCircle2,
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    tableGradientClass: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  escalated: {
    title: "Escalated Cases",
    recordTitle: "Escalated Cases Records",
    subtitle: "Escalated follow-up cases for user:",
    icon: AlertTriangle,
    iconColorClass: "text-red-600 dark:text-red-400",
    tableGradientClass: "from-red-500 via-rose-500 to-orange-500",
  },
};

export const FollowUpView: React.FC<FollowUpViewProps> = ({
  screenType = "pending",
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const selectedLanguage = useSelector(languageParams);
  const { user, loading: authLoading } = useAuth() as any;

  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const [loading, setLoading] = useState<boolean>(true);

  const [allCases, setAllCases] = useState<UserFollowUpItem[]>([]);
  const [myCases, setMyCases] = useState<UserFollowUpItem[]>([]);
  const [subordinateCases, setSubordinateCases] = useState<UserFollowUpItem[]>([]);

  const language = selectedLanguage === "ar" || selectedLanguage === 2 ? 2 : 1;
  const config = SCREEN_CONFIG[screenType] || SCREEN_CONFIG.pending;
  const ScreenIcon = config.icon;

  // Resolve user id from session or stored auth data
  const resolvedUserId =
    user?.UserId ||
    user?.userId ||
    user?.Userid ||
    user?.USERID ||
    user?.username ||
    user?.Username ||
    user?.Username1 ||
    user?.id;

  const getStoredUserId = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("authData");
      if (stored) {
        const p = JSON.parse(stored);
        return (
          p?.UserId ||
          p?.userId ||
          p?.Userid ||
          p?.USERID ||
          p?.username ||
          p?.Username ||
          p?.Username1 ||
          p?.id ||
          null
        );
      }
    } catch (e) {
      console.error("Error reading authData from localStorage:", e);
    }
    return null;
  }, []);

  const activeUserId = resolvedUserId || getStoredUserId();
  const lastFetchedKeyRef = useRef<string>("");

  const handleViewDetailsPage = (row: any) => {
    const rawCif = row.CIFID ?? row.CifId ?? row.id;
    const cifId = rawCif !== undefined && rawCif !== null ? rawCif : "";
    const realAppId =
      row.APPID && !isNaN(Number(row.APPID)) && Number(row.APPID) > 0
        ? Number(row.APPID)
        : null;

    if (cifId !== "") {
      dispatch(setSelectedUserId(Number(cifId) || 0));
      dispatch(
        hasDashabordParams({
          ...row,
          CIFID: cifId,
          APPID: realAppId,
          hideButton: false,
        })
      );
      if (realAppId) {
        localStorage.setItem("selectedAppId", String(realAppId));
      } else {
        localStorage.removeItem("selectedAppId");
      }
      localStorage.setItem(
        "followupParams",
        JSON.stringify({
          ...row,
          CIFID: cifId,
          APPID: realAppId,
          hideButton: false,
        })
      );
    }
    router.push("/dashboard/SmartView/Followup/FollowupActions");
  };

  const baseColumns: ColumnDef<UserFollowUpItem>[] = [
    {
      accessorKey: "CIFID",
      header: "CIF ID",
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {row.original.CIFID ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "CUSTOMERNAME",
      header: "Customer Name",
      cell: ({ row }) => (
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {row.original.CUSTOMERNAME || "—"}
        </span>
      ),
    },
    {
      accessorKey: "USERID",
      header: "User ID",
      cell: ({ row }) => row.original.USERID || activeUserId || "—",
    },
    {
      accessorKey: "COLLECTORNAME",
      header: "Collector Name",
      cell: ({ row }) => row.original.COLLECTORNAME || "—",
    },
    {
      accessorKey: "LCALLOCATIONGROUP",
      header: "LC Allocation Group",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {row.original.LCALLOCATIONGROUP || "Unassigned"}
        </span>
      ),
    },
    {
      accessorKey: "TOTALOVERDUEAMOUNT",
      header: "Overdue Amount",
      cell: ({ row }) => {
        const val = row.original.TOTALOVERDUEAMOUNT;
        return val !== undefined && val !== null && !isNaN(Number(val)) ? (
          <span className="font-mono font-semibold text-red-600 dark:text-red-400">
            {formatAmountKSA(val)}
          </span>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "TOTALAMOUNTCOLLECTED",
      header: "Collected Amount",
      cell: ({ row }) => {
        const val = row.original.TOTALAMOUNTCOLLECTED;
        return val !== undefined && val !== null && !isNaN(Number(val)) ? (
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {formatAmountKSA(val)}
          </span>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "ALLOCATIONDATE",
      header: "Allocation Date",
      cell: ({ row }) => {
        const d = row.original.ALLOCATIONDATE;
        return d ? formatDateKSA(d) : "—";
      },
    },
  ];

  const screenSpecificColumns: ColumnDef<UserFollowUpItem>[] =
    screenType === "escalated"
      ? [
          {
            accessorKey: "ESCALATEDTO",
            header: "Escalated To",
            cell: ({ row }) => (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                {row.original.ESCALATEDTO || "—"}
              </span>
            ),
          },
          {
            accessorKey: "ESCALATIONDATE",
            header: "Escalation Date",
            cell: ({ row }) => {
              const d = row.original.ESCALATIONDATE;
              return d ? formatDateKSA(d) : "—";
            },
          },
        ]
      : [
          {
            accessorKey: "RECENTFOLLOWDATE",
            header: "Recent Followup",
            cell: ({ row }) => {
              const d = row.original.RECENTFOLLOWDATE || row.original.FOLLOWUPDATE;
              return d ? formatDateKSA(d) : "—";
            },
          },
        ];

  const actionColumn: ColumnDef<UserFollowUpItem> = {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <Button
        size="sm"
        className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
        onClick={() => handleViewDetailsPage(row.original)}
      >
        <Eye className="w-3.5 h-3.5" />
        Details
      </Button>
    ),
  };

  const columns: ColumnDef<UserFollowUpItem>[] = [
    ...baseColumns,
    ...screenSpecificColumns,
    actionColumn,
  ];

  const fetchScreenData = useCallback(
    async (userIdToFetch?: string | number) => {
      const targetUserId = String(userIdToFetch || activeUserId || "");
      if (!targetUserId) return;

      setLoading(true);
      try {
        const result = await getFollowUpOwnershipData(screenType, {
          UserId: targetUserId,
          Language: language,
          RecStatus: true,
        });

        setAllCases(result.allCases);
        setMyCases(result.myCases);
        setSubordinateCases(result.subordinateCases);
      } catch (err) {
        console.error(`Failed to load ${screenType} follow-up data:`, err);
        toast.error(`Failed to load ${screenType} follow-up records`);
      } finally {
        setLoading(false);
      }
    },
    [activeUserId, language, screenType]
  );

  useEffect(() => {
    if (authLoading || !activeUserId) return;

    const fetchKey = `${screenType}-${activeUserId}-${language}`;
    if (lastFetchedKeyRef.current === fetchKey) return;
    lastFetchedKeyRef.current = fetchKey;

    fetchScreenData(activeUserId);
  }, [authLoading, activeUserId, language, screenType, fetchScreenData]);

  const getActiveData = (): UserFollowUpItem[] => {
    switch (ownershipFilter) {
      case "all":
        return allCases;
      case "my":
        return myCases;
      case "subordinate":
        return subordinateCases;
      default:
        return allCases;
    }
  };

  const getFilterLabel = () => {
    switch (ownershipFilter) {
      case "all":
        return "All Cases";
      case "my":
        return "My Cases";
      case "subordinate":
        return "Subordinate Cases";
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-6 lg:p-10 font-sans gap-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 ${config.iconColorClass}`}
          >
            <ScreenIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
              {config.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              {config.subtitle}{" "}
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                {activeUserId || "—"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => fetchScreenData(activeUserId)}
            className="h-10 px-4 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2 cursor-pointer text-xs shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards: All Cases / My Cases / Subordinate Cases */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: All Cases */}
        <div
          onClick={() => setOwnershipFilter("all")}
          className={`relative overflow-hidden cursor-pointer rounded-2xl p-5 border transition-all duration-300 bg-white dark:bg-gray-900 shadow-md ${
            ownershipFilter === "all"
              ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg scale-[1.01]"
              : "border-gray-200/80 dark:border-gray-800 hover:border-blue-400/50"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              All Cases
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
              {allCases.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">cases</span>
          </div>
        </div>

        {/* Card 2: My Cases */}
        <div
          onClick={() => setOwnershipFilter("my")}
          className={`relative overflow-hidden cursor-pointer rounded-2xl p-5 border transition-all duration-300 bg-white dark:bg-gray-900 shadow-md ${
            ownershipFilter === "my"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg scale-[1.01]"
              : "border-gray-200/80 dark:border-gray-800 hover:border-emerald-400/50"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              My Cases
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
              {myCases.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">cases</span>
          </div>
        </div>

        {/* Card 3: Subordinate Cases */}
        <div
          onClick={() => setOwnershipFilter("subordinate")}
          className={`relative overflow-hidden cursor-pointer rounded-2xl p-5 border transition-all duration-300 bg-white dark:bg-gray-900 shadow-md ${
            ownershipFilter === "subordinate"
              ? "border-violet-500 ring-2 ring-violet-500/20 shadow-lg scale-[1.01]"
              : "border-gray-200/80 dark:border-gray-800 hover:border-violet-400/50"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Subordinate Cases
            </span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
              {subordinateCases.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">cases</span>
          </div>
        </div>
      </div>

      {/* Ownership Filter Buttons: All Cases / My Cases / Subordinate Cases */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        <button
          onClick={() => setOwnershipFilter("all")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
            ownershipFilter === "all"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Cases</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
              ownershipFilter === "all"
                ? "bg-white/20 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {allCases.length}
          </span>
        </button>

        <button
          onClick={() => setOwnershipFilter("my")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
            ownershipFilter === "my"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Cases</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
              ownershipFilter === "my"
                ? "bg-white/20 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {myCases.length}
          </span>
        </button>

        <button
          onClick={() => setOwnershipFilter("subordinate")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
            ownershipFilter === "subordinate"
              ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Subordinate Cases</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
              ownershipFilter === "subordinate"
                ? "bg-white/20 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {subordinateCases.length}
          </span>
        </button>
      </div>

      {/* Main Table Card Container with Top Linear Gradient and Shadow */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] flex flex-col">
        {/* Top Accent Gradient Bar */}
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.tableGradientClass}`}
        />

        <div className="p-6">
          <ReusableDataTable
            title={`${config.recordTitle} — ${getFilterLabel()}`}
            initialData={getActiveData()}
            columns={columns}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
