"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/utils/axios";
import { useDispatch, useSelector } from "react-redux";
import { languageParams, hasDashabordParams } from "@/lib/redux/slices/dashboardApplSlice";
import { setSelectedUserId } from "@/lib/redux/slices/userTabSlice";
import { useRouter } from "next/navigation";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import PendingFollowupChart from "@/components/dashboard/PendingFollowupChart";
import CompletedFollowupChart from "@/components/dashboard/CompletedFollowupChart";
import EscalatedCasesChart from "@/components/dashboard/EscalatedCasesChart";
import ProductsPieChart from "@/components/dashboard/ProductsPieChart";
import TargetAchievement from "@/components/dashboard/TargetAchievement";
import BarChartComponent from "@/components/dashboard/BarChartComponent";
import HorizontalBarChartComponent from "@/components/dashboard/HorizontalBarChartComponent";
import FollowupStatusChart from "@/components/dashboard/FollowupStatusChart";
import { LayoutDashboard, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Page() {
  const { user, loading } = useAuth() as any;
  const language = useSelector(languageParams);
  const dispatch = useDispatch();
  const router = useRouter();

  const [followUp, setFollowUp] = useState<Record<string, any>>({
    COMPLETE_FOLLOWUP: [],
    ESCALATED_CASES: [],
    PENDING_FOLLOWUP: [],
  });
  const [followUpCount, setFollowUpCount] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const handleViewDetailsPage = (row: any) => {
    const rawCif = row.CIFID ?? row.CifId ?? row.id;
    const cifId = rawCif !== undefined && rawCif !== null ? rawCif : "";
    const realAppId =
      row.APPID && !isNaN(Number(row.APPID)) && Number(row.APPID) > 0
        ? Number(row.APPID)
        : null;

    if (cifId !== "") {
      dispatch(setSelectedUserId(Number(cifId) || 0));
      dispatch(hasDashabordParams({ ...row, CIFID: cifId, APPID: realAppId, hideButton: false }));
      if (realAppId) {
        localStorage.setItem("selectedAppId", String(realAppId));
      } else {
        localStorage.removeItem("selectedAppId");
      }
      localStorage.setItem(
        "followupParams",
        JSON.stringify({ ...row, CIFID: cifId, APPID: realAppId, hideButton: false })
      );
    }
    router.push("/dashboard/SmartView/Followup/FollowupActions");
  };

  const columns: ColumnDef<any>[] = [
    { accessorKey: "CIFID", header: "Cif ID" },
    {
      accessorKey: "CUSTOMERNAME",
      header: "Customer Name",
      cell: ({ row }) => row.original.CUSTOMERNAME || "-",
    },
    { accessorKey: "USERID", header: "User ID" },
    { accessorKey: "COLLECTORNAME", header: "Collector Name" },
    { accessorKey: "LCALLOCATIONGROUP", header: "LC Allocation Group" },
    {
      accessorKey: "TOTALOVERDUEAMOUNT",
      header: "Total Overdue Amount",
      cell: ({ row }) => {
        const val = row.original.TOTALOVERDUEAMOUNT;
        return val !== undefined && val !== null && !isNaN(Number(val))
          ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "-";
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button
          size="sm"
          className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
          onClick={() => handleViewDetailsPage(row.original)}
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </Button>
      ),
    },
  ];

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

  const fetchDashboardData = useCallback(async (userIdToFetch?: string | number) => {
    const targetUserId = userIdToFetch || activeUserId;

    if (!targetUserId) {
      return;
    }

    setDashboardLoading(true);
    try {
      const hostUrl =
        process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
      const langCode = language === "ar" || language === 2 ? 2 : 1;
      const response = await axios.get(`${hostUrl}/api/Dashboard`, {
        params: {
          UserID: targetUserId,
          UserId: targetUserId,
          Recstatus: true,
          language: langCode,
        },
      });

      const rawPayload = response.data;
      let resData = rawPayload?.data || rawPayload;
      if (Array.isArray(resData) && resData.length > 0 && !resData[0]?.CIFID) {
        resData = resData[0];
      }

      const getArray = (dataObj: any, keys: string[]) => {
        if (!dataObj) return [];
        for (const k of keys) {
          if (Array.isArray(dataObj[k])) return dataObj[k];
          if (Array.isArray(dataObj[k.toUpperCase()])) return dataObj[k.toUpperCase()];
          if (Array.isArray(dataObj[k.toLowerCase()])) return dataObj[k.toLowerCase()];
        }
        return [];
      };

      const completeList = getArray(resData, ["COMPLETE_FOLLOWUP", "complete_followup", "CompleteFollowup"]);
      const escalatedList = getArray(resData, ["ESCALATED_CASES", "escalated_cases", "EscalatedCases"]);
      const pendingList = getArray(resData, ["PENDING_FOLLOWUP", "pending_followup", "PendingFollowup"]);

      const normalized = {
        ...(typeof resData === "object" && !Array.isArray(resData) ? resData : {}),
        COMPLETE_FOLLOWUP: completeList,
        ESCALATED_CASES: escalatedList,
        PENDING_FOLLOWUP: pendingList,
      };

      setFollowUp(normalized);
      setFollowUpCount(
        completeList.length +
        escalatedList.length +
        pendingList.length
      );
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setDashboardLoading(false);
    }
  }, [activeUserId, language]);

  useEffect(() => {
    // Only fetch once when auth is resolved and activeUserId is available
    if (loading || !activeUserId) return;

    const fetchKey = `${activeUserId}-${language}`;
    if (lastFetchedKeyRef.current === fetchKey) return;
    lastFetchedKeyRef.current = fetchKey;

    fetchDashboardData(activeUserId);
  }, [loading, activeUserId, language, fetchDashboardData]);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const chartData = [
    { id: 0, value: followUp.PENDING_FOLLOWUP?.length || 0, label: "Pending" },
    { id: 1, value: followUp.COMPLETE_FOLLOWUP?.length || 0, label: "Completed" },
    { id: 2, value: followUp.ESCALATED_CASES?.length || 0, label: "Escalated" },
  ];

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-6 lg:p-10 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
            Collection Dashboard
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={dashboardLoading}
          onClick={() => fetchDashboardData(activeUserId)}
          className="h-10 px-4 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2 cursor-pointer text-xs shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${dashboardLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <PendingFollowupChart
          title="Pending Followup"
          total={followUp.PENDING_FOLLOWUP?.length || 0}
          max={followUpCount}
        />
        <CompletedFollowupChart
          title="Completed Followup"
          total={followUp.COMPLETE_FOLLOWUP?.length || 0}
          max={followUpCount}
        />
        <EscalatedCasesChart
          title="Escalated Cases"
          total={followUp.ESCALATED_CASES?.length || 0}
          max={followUpCount}
        />
        <ProductsPieChart
          title="FollowUps"
          data={chartData}
        />
        <TargetAchievement
          title="Target General"
          allocated={followUpCount || 20}
          achieved={followUp.COMPLETE_FOLLOWUP?.length || 0}
          data={followUp}
        />
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Table Container 1 */}
          <div className="xl:col-span-9">
            <ReusableDataTable
              title="Pending Followup"
              initialData={followUp.PENDING_FOLLOWUP || []}
              columns={columns}
              loading={dashboardLoading}
            />
          </div>
          <div className="xl:col-span-3">
            <BarChartComponent title="Customer Distribution By Group" data={followUp} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Table Container 2 */}
          <div className="xl:col-span-9">
            <ReusableDataTable
              title="Completed Followup"
              initialData={followUp.COMPLETE_FOLLOWUP || []}
              columns={columns}
              loading={dashboardLoading}
            />
          </div>
          <div className="xl:col-span-3">
            <HorizontalBarChartComponent title="Collection Performance" data={followUp} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Table Container 3 */}
          <div className="xl:col-span-9">
            <ReusableDataTable
              title="Escalated Followup"
              initialData={followUp.ESCALATED_CASES || []}
              columns={columns}
              loading={dashboardLoading}
            />
          </div>
          <div className="xl:col-span-3">
            <FollowupStatusChart title="Follow-up Status Distribution" data={followUp} />
          </div>
        </div>
      </div>
    </div>
  );
}
