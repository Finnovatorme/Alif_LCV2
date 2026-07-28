"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ChartPieSimple } from "@/components/ui/pi-chart";
import { ChartRadialShape } from "@/components/ui/radical-chart";
import { ChartRadialStacked } from "@/components/ui/stacked-chart";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { setSelectedUserId } from "@/lib/redux/slices/userTabSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  languageParams,
  hasDashabordParams,
} from "@/lib/redux/slices/dashboardApplSlice";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface User {
  userId?: string;
  UserId?: string;
  Userid?: string;
  name?: string;
  avatar?: string;
  email?: string;
}

const usersColumns: ColumnDef<any>[] = [
  { id: "select", header: "Select" },
  { id: "actions", header: "Actions" },
  { accessorKey: "APPID", header: "App Id" },
  { accessorKey: "FINANCIERNAME", header: "Financier Name" },
  { accessorKey: "CIFID", header: "Cif ID" },
  { accessorKey: "CUSTOMERNAME", header: "Customer Name" },
  { accessorKey: "APPLICATION_TYPE", header: "Application Type" },
  { accessorKey: "STAGENAME", header: "Stage Name" },
  { accessorKey: "PRODUCTCODE", header: "Product Code" },
];

const ordersColumns: ColumnDef<any>[] = [
  { id: "select", header: "Select" },
  { id: "actions", header: "Actions" },
  { accessorKey: "APPID", header: "App Id" },
  { accessorKey: "FINANCIERNAME", header: "Financier Name" },
  { accessorKey: "CIFID", header: "Cif ID" },
  { accessorKey: "CUSTOMERNAME", header: "Customer Name" },
  { accessorKey: "APPLICATION_TYPE", header: "Application Type" },
  { accessorKey: "STAGENAME", header: "Stage Name" },
  { accessorKey: "PRODUCTCODE", header: "Product Code" },
];
const keyMappings = {
  APPID: "App Id",
  FINANCIERNAME: "Financier Name",
  CIFID: "Cif ID",
  CUSTOMERNAME: "Customer Name",
  APPLICATION_TYPE: "Application Type",
  STAGENAME: "Stage Name",
  PRODUCTCODE: "Product Code",
  OTHDESC1: "Description in English",
  OTHDESC2: "Description in Arabic",
  OTHDESC3: "Description in Other Language",
  MAKER: "Maker ",
  MAKEDATE: "Make date",
  UPDATEBY: "Update by",
  UPDATEDATE: "Update date",
};
type AuthUser = {
  userId?: string;
  UserId?: string;
  Userid?: string;
  name?: string;
  avatar?: string;
  email?: string;
};

type UseAuthReturn = {
  user: AuthUser | null;
  loading: boolean;
};

export default function Page() {
  const { user, loading } = useAuth() as UseAuthReturn;
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedMyQueueRows, setSelectedMyQueueRows] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "Submit" | "Reject" | null
  >(null);
  const [modalLoading, setModalLoading] = useState(false);
  // const { user } = useAuth(); // hook se
  const dispatch = useDispatch();
  const router = useRouter();
  const language = useSelector(languageParams);
  useEffect(() => {
    console.log(loading || !user);
    if (loading || !user) return;
    console.log("works");
    const fetchUsers = async () => {
      const resolvedUserId = user.UserId || user.userId || user.Userid;
      if (!resolvedUserId) {
        console.warn("No UserId found for fetchUsers");
        return;
      }
      setLoadingUsers(true);
      try {
        const res = await axios.get(
          `${process.env.LO_API_KEY}/api/APPL_APPLICATION/GetPendingApplications`,
          {
            params: { UserId: resolvedUserId, Language: language },
          },
        );
        console.log("get-applications", res);
        setUsers(res.data || []);
      } catch (err) {
        console.error(err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchOrders = async () => {
      const resolvedUserId = user.UserId || user.userId || user.Userid;
      if (!resolvedUserId) return;
      setLoadingOrders(true);
      try {
        const res = await axios.get(
          `${process.env.LO_API_KEY}/api/GetPendingSharedQue`,
          {
            params: { UserId: resolvedUserId, Language: language },
          },
        );
        console.log("get-oreders", res);
        setOrders(res.data || []);
      } catch (err) {
        console.error(err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchUsers();
    fetchOrders();
  }, [user, loading, language]);

  const handleBulkAction = (action: "Submit" | "Reject") => {
    if (selectedMyQueueRows.length === 0) {
      toast.error("Please select at least one application.");
      return;
    }
    setPendingAction(action);
    setIsModalOpen(true);
  };

  const executeBulkAction = async () => {
    if (!pendingAction) return;

    setModalLoading(true);
    try {
      const payload = {
        twtRecIds: selectedMyQueueRows
          .map((row) => row.TWTRECID || row.APPID)
          .join(","),
        action: pendingAction,
        maker: user?.UserId || user?.userId || user?.Userid,
        comments: "",
      };
      const baseUrl = process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
      await axios.post(`${baseUrl}/api/BulkWorkflow/execute`, payload);
      toast.success(`${pendingAction} successful!`);
      setIsModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(`Error during ${pendingAction}:`, error);
      toast.error(`Failed to ${pendingAction} applications.`);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <div>Loading auth...</div>;

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-[white] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-8">
        <div className="grid sm:grid-cols-3 lg:grid-cols-3 gap-6">
          <div className="border border-[#d1d5db] dark:border-[#374153] rounded-xl bg-[#fafafa] dark:bg-[#18181b]">
            <ChartRadialStacked />
          </div>

          <div className="border border-[#d1d5db] dark:border-[#374153] rounded-xl bg-[#fafafa] dark:bg-[#18181b]">
            <ChartRadialShape />
          </div>

          <div className="border border-[#d1d5db] dark:border-[#374153] rounded-xl w-auto h-auto bg-[#fafafa] dark:bg-[#18181b] ">
            <ChartPieSimple />
          </div>
        </div>

        <ReusableDataTable
          title="My Queue"
          showAccumulate={true}
          showSortColumnName={true}
          onAccumulate={(row) => {
            dispatch(hasDashabordParams(row));
            dispatch(setSelectedUserId(row.APPID));
            localStorage.setItem("selectedAppId", String(row.APPID));
            router.push(`/dashboard/UserTabScreen?appid=${row.APPID}`);
          }}
          initialData={users}
          columns={usersColumns}
          loading={loadingUsers}
          keyMappings={keyMappings}
          onSelectionChange={setSelectedMyQueueRows}
          headerActions={
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleBulkAction("Submit")}
              >
                Submit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction("Reject")}
              >
                Reject
              </Button>
            </>
          }
        />
        <ReusableDataTable
          title="Shared Queue"
          initialData={orders}
          columns={ordersColumns}
          loading={loadingOrders}
          keyMappings={keyMappings}
        />
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={executeBulkAction}
        title={`Confirm ${pendingAction}`}
        description={`Are you sure you want to ${pendingAction?.toLowerCase()} the selected applications?`}
        confirmText={pendingAction || "Confirm"}
        variant={pendingAction === "Reject" ? "destructive" : "default"}
        loading={modalLoading}
      />
    </div>
  );
}
