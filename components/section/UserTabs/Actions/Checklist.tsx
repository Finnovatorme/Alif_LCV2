"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  ListChecks,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useSelector } from "react-redux";
import {
  getWfTransactionChecklists,
  updateWfTransactionChecklistStatus,
  WfTransactionChecklistItem,
} from "@/app/dashboard/Legal/HandlingAPIs";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeKSA } from "@/utils/helpers";
import { cn } from "@/lib/utils";

export interface ChecklistRow extends WfTransactionChecklistItem {
  id: number;
}

interface ChecklistProps {
  appId?: number | string;
  twtrecid?: number | string;
  language?: number | string;
}

export default function Checklist({
  appId: propAppId,
  twtrecid: propTwtrecid,
  language: propLanguage,
}: ChecklistProps) {
  const appParams = useSelector(dashboardParams);
  const reduxLang = useSelector(languageParams);

  const activeLang = propLanguage ?? reduxLang;
  const isAr = activeLang === 2 || activeLang === "ar";

  const [records, setRecords] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "allowed" | "not_allowed">("all");

  // Safe number helper
  const toNum = (v: any, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = propTwtrecid ? { twtrecid: propTwtrecid } : undefined;
      const data = await getWfTransactionChecklists(params);

      const mapped: ChecklistRow[] = (Array.isArray(data) ? data : []).map(
        (item: WfTransactionChecklistItem, idx: number) => ({
          ...item,
          id: toNum(item.TWTCRECID, idx + 1),
          CHECKLISTSTATUS: Boolean(item.CHECKLISTSTATUS),
          RECSTATUS: Boolean(item.RECSTATUS),
        })
      );

      setRecords(mapped);
      if (mapped.length > 0) {
        toast.success(
          isAr
            ? `تم تحميل قائمة التحقق (${mapped.length}) بنجاح`
            : `Checklist loaded (${mapped.length} records) successfully`
        );
      } else {
        toast.info(isAr ? "لا توجد سجلات لقائمة التحقق" : "No checklist records found");
      }
    } catch (error) {
      console.error("Fetch checklist error:", error);
      toast.error(
        isAr ? "فشل تحميل بيانات قائمة التحقق" : "Failed to fetch checklist records"
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [propTwtrecid, isAr]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Handle status toggle via PUT /api/WfTransactionChecklistUpdate
  const handleToggleStatus = async (row: ChecklistRow, newStatus: boolean) => {
    const recId = row.TWTCRECID;
    if (!recId) {
      toast.error(isAr ? "معرف السجل غير موجود" : "Record ID missing");
      return;
    }

    const prevStatus = Boolean(row.CHECKLISTSTATUS);
    if (prevStatus === newStatus) return;

    // Optimistic UI update
    setUpdatingId(recId);
    setRecords((prev) =>
      prev.map((r) =>
        r.TWTCRECID === recId
          ? {
              ...r,
              CHECKLISTSTATUS: newStatus,
              UPDATEDATE: new Date().toISOString(),
            }
          : r
      )
    );

    try {
      await updateWfTransactionChecklistStatus({
        twtcrecid: recId,
        checkliststatus: newStatus,
      });

      toast.success(
        isAr
          ? `تم تحديث السجل #${recId} إلى: ${newStatus ? "مسموح (Allowed)" : "غير مسموح (Not Allowed)"}`
          : `Record #${recId} updated to: ${newStatus ? "Allowed" : "Not Allowed"}`
      );
    } catch (error: any) {
      console.error("Update checklist status failed:", error);
      // Revert optimistic update
      setRecords((prev) =>
        prev.map((r) =>
          r.TWTCRECID === recId
            ? { ...r, CHECKLISTSTATUS: prevStatus }
            : r
        )
      );
      toast.error(
        isAr
          ? `فشل تحديث حالة السجل #${recId}`
          : `Failed to update status for record #${recId}`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // KPI counts
  const totalCount = records.length;
  const allowedCount = records.filter((r) => r.CHECKLISTSTATUS).length;
  const notAllowedCount = totalCount - allowedCount;

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (statusFilter === "allowed") {
      return records.filter((r) => r.CHECKLISTSTATUS);
    }
    if (statusFilter === "not_allowed") {
      return records.filter((r) => !r.CHECKLISTSTATUS);
    }
    return records;
  }, [records, statusFilter]);

  const columns: ColumnDef<ChecklistRow>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "TWTCRECID",
        header: isAr ? "رقم التحقق (TWTCRECID)" : "Checklist Rec ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400">
            #{row.original.TWTCRECID}
          </span>
        ),
      },
      {
        accessorKey: "TWTRECID",
        header: isAr ? "رقم المعاملة (TWTRECID)" : "Transaction ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
            {row.original.TWTRECID ? `#${row.original.TWTRECID}` : "-"}
          </span>
        ),
      },
      {
        accessorKey: "CHECKLISTID",
        header: isAr ? "رمز التحقق (Checklist ID)" : "Checklist ID",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
            {row.original.CHECKLISTID ?? "-"}
          </span>
        ),
      },
      {
        id: "status_toggle",
        header: isAr ? "السماح / الحالة (Allow / Status)" : "Allow / Checklist Status",
        cell: ({ row }) => {
          const item = row.original;
          const isAllowed = Boolean(item.CHECKLISTSTATUS);
          const isUpdating = updatingId === item.TWTCRECID;

          return (
            <div
              className="flex items-center gap-2.5 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Switch
                checked={isAllowed}
                disabled={isUpdating}
                onCheckedChange={(checked) => handleToggleStatus(item, checked)}
                className={cn(
                  "cursor-pointer transition-all border shadow-xs shrink-0",
                  isAllowed
                    ? "data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500 border-emerald-500"
                    : "data-[state=unchecked]:bg-gray-900 dark:data-[state=unchecked]:bg-slate-950 border-gray-500 dark:border-gray-400 hover:border-emerald-400"
                )}
                aria-label={`Toggle checklist status for ${item.TWTCRECID}`}
              />

              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleToggleStatus(item, !isAllowed)}
                className="cursor-pointer focus:outline-none"
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all select-none",
                    isAllowed
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25"
                  )}
                >
                  {isAllowed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {isAr ? "مسموح (Allowed)" : "Allowed"}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      {isAr ? "غير مسموح (Not Allowed)" : "Not Allowed"}
                    </>
                  )}
                </span>
              </button>

              {isUpdating && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "REQUIREDVALIDATION",
        header: isAr ? "التحقق المطلوب" : "Validation Type",
        cell: ({ row }) => {
          const val = row.original.REQUIREDVALIDATION;
          const vb = row.original.VB_REQUIREDVALIDATION;
          const isReq = vb === 1 || String(val).toLowerCase().includes("require");

          return (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded font-medium",
                isReq
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              )}
            >
              {val || (vb === 1 ? (isAr ? "مطلوب" : "Required") : (isAr ? "اختياري" : "Optional"))}
            </span>
          );
        },
      },
      {
        accessorKey: "MAKEDATE",
        header: isAr ? "تاريخ الإنشاء" : "Created Date",
        cell: ({ row }) => (
          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {formatDateTimeKSA(row.original.MAKEDATE)}
          </span>
        ),
      },
      {
        accessorKey: "UPDATEDATE",
        header: isAr ? "تاريخ التحديث" : "Last Updated",
        cell: ({ row }) => (
          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {row.original.UPDATEDATE ? formatDateTimeKSA(row.original.UPDATEDATE) : "-"}
          </span>
        ),
      },
      {
        accessorKey: "RECSTATUS",
        header: isAr ? "الحالة" : "Record Status",
        cell: ({ row }) => {
          const active = Boolean(row.original.RECSTATUS);
          return (
            <Badge
              variant={active ? "default" : "outline"}
              className={cn(
                "text-[11px] font-medium",
                active
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                  : "bg-gray-500/10 text-gray-500 border-gray-500/30"
              )}
            >
              {active ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
            </Badge>
          );
        },
      },
    ],
    [isAr, updatingId]
  );

  return (
    <div className="w-full space-y-4 font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-linear-to-r from-card to-card/60 backdrop-blur-sm shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
            <ListChecks className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {isAr ? "قائمة التحقق للمعاملة" : "Transaction Checklist"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? "إدارة وتحديث متطلبات التحقق والموافقة على البنود (Allow / Not Allow)"
                : "Review and toggle approval / compliance verification checks per transaction"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Buttons */}
          <div className="inline-flex items-center p-1 rounded-lg bg-muted/60 border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors",
                statusFilter === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAr ? "الكل" : "All"} ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("allowed")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1",
                statusFilter === "allowed"
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? "مسموح" : "Allowed"} ({allowedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("not_allowed")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1",
                statusFilter === "not_allowed"
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {isAr ? "غير مسموح" : "Not Allowed"} ({notAllowedCount})
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="relative">
        <ReusableDataTable<ChecklistRow>
          initialData={filteredRecords}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      </div>
    </div>
  );
}
