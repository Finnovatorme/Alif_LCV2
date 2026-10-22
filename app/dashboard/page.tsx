"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/utils/axios";
import { useDispatch, useSelector } from "react-redux";
import { languageParams, hasDashabordParams } from "@/lib/redux/slices/dashboardApplSlice";
import { setSelectedUserId } from "@/lib/redux/slices/userTabSlice";
import { useRouter } from "next/navigation";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import GaugeChart from "@/components/dashboard/GaugeChart";
import ProductsPieChart from "@/components/dashboard/ProductsPieChart";
import TargetAchievement from "@/components/dashboard/TargetAchievement";
import BarChartComponent from "@/components/dashboard/BarChartComponent";
import HorizontalBarChartComponent from "@/components/dashboard/HorizontalBarChartComponent";
import FollowupStatusChart from "@/components/dashboard/FollowupStatusChart";
import { LayoutDashboard, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Page() {
  const { user, loading } = useAuth() as any;
  const language = useSelector(languageParams);
  const dispatch = useDispatch();
  const router = useRouter();

  const [followUp, setFollowUp] = useState({
    COMPLETE_FOLLOWUP: [],
    ESCALATED_CASES: [],
    PENDING_FOLLOWUP: [],
  });
  const [followUpCount, setFollowUpCount] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const handleViewDetailsPage = (row: any) => {
    const cifId = row.CIFID || row.CifId || row.APPID || row.id;
    const appId = Number(cifId);
    if (cifId) {
      dispatch(setSelectedUserId(appId));
      dispatch(hasDashabordParams({ ...row, CIFID: cifId, hideButton: false }));
      localStorage.setItem("selectedAppId", String(cifId));
      localStorage.setItem(
        "followupParams",
        JSON.stringify({ ...row, CIFID: cifId, hideButton: false })
      );
    }
    router.push("/dashboard/SmartView/Followup/FollowupActions");
  };

  const columns: ColumnDef<any>[] = [
    { accessorKey: "CIFID", header: "Cif ID" },
    { accessorKey: "USERID", header: "User ID" },
    { accessorKey: "COLLECTORNAME", header: "Collector Name" },
    { accessorKey: "LCALLOCATIONGROUP", header: "LC Allocation Group" },
    { accessorKey: "TOTALOVERDUEAMOUNT", header: "Total Overdue Amount" },
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

  useEffect(() => {
    if (loading || !user) return;

    const fetchDashboardData = async () => {
      const resolvedUserId = user.UserId || user.userId || user.Userid;
      if (!resolvedUserId) return;

      setDashboardLoading(true);
      try {
        const hostUrl = process.env.HOST_API_KEY;
        const response = await axios.get(
          `${hostUrl}/api/Dashboard/get-UserDashboard`,
          {
            params: { UserId: resolvedUserId, Recstatus: true, language },
          }
        );
        const data = response.data;
        setFollowUp(data);
        setFollowUpCount(
          (data.COMPLETE_FOLLOWUP?.length || 0) +
          (data.ESCALATED_CASES?.length || 0) +
          (data.PENDING_FOLLOWUP?.length || 0)
        );
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, loading, language]);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const chartData = [
    { id: 0, value: followUp.PENDING_FOLLOWUP?.length || 0, label: "Pending" },
    { id: 1, value: followUp.COMPLETE_FOLLOWUP?.length || 0, label: "Completed" },
    { id: 2, value: followUp.ESCALATED_CASES?.length || 0, label: "Escalated" },
  ];

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-6 lg:p-10 font-sans">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <LayoutDashboard className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
          Collection Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <GaugeChart
          title="Pending Followup"
          total={followUp.PENDING_FOLLOWUP?.length || 0}
          chartData={followUpCount}
        />
        <GaugeChart
          title="Completed Followup"
          total={followUp.COMPLETE_FOLLOWUP?.length || 0}
          chartData={followUpCount}
        />
        <GaugeChart
          title="Escalated Cases"
          total={followUp.ESCALATED_CASES?.length || 0}
          chartData={followUpCount}
        />
        <ProductsPieChart
          title="FollowUps"
          data={chartData}
        />
        <TargetAchievement
          title="Target General"
          allocated={200}
          achieved={150}
        />
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Table Container 1 */}
          <div className="xl:col-span-7">
            <ReusableDataTable
              title="Pending Followup"
              initialData={followUp.PENDING_FOLLOWUP || []}
              columns={columns}
              loading={dashboardLoading}
            />
          </div>
          <div className="xl:col-span-5">
            <BarChartComponent title="Customer Distribution By Group" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Table Container 2 */}
          <div className="xl:col-span-7">
            <ReusableDataTable
              title="Completed Followup"
              initialData={followUp.COMPLETE_FOLLOWUP || []}
              columns={columns}
              loading={dashboardLoading}
            />
          </div>
          <div className="xl:col-span-5">
            <HorizontalBarChartComponent title="Collection Performance" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Table Container 3 */}
          <div className="xl:col-span-7">
            <ReusableDataTable
              title="Escalated Followup"
              initialData={followUp.ESCALATED_CASES || []}
              columns={columns}
              loading={dashboardLoading}
            />
          </div>
          <div className="xl:col-span-5">
            <FollowupStatusChart title="Follow-up Status Distribution" />
          </div>
        </div>
      </div>
    </div>
  );
}
