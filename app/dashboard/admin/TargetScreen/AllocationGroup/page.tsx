"use client";

import React, { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowLeft, Plus, Loader2, X, Layers, Award, Tag } from "lucide-react";
import { toast } from "sonner";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { BooleanStatus } from "@/components/ui/BooleanStatus";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { ddOptionsParams } from "@/lib/redux/slices/ddValuesSlice";
import { fetchLCAllocationGroupOptions } from "@/utils/dropDownApis";
import { formatDateKSA } from "@/utils/helpers";
import {
  getTargetGroups,
  getIncentiveList,
  addTargetGroup,
  updateTargetGroup,
  deleteTargetGroup,
  targetGetData,
  TargetGroupItem,
  IncentiveItem,
} from "../../HandlingApi";

function AllocationGroupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const selectedLanguage = useSelector(languageParams);
  const ddValues = useSelector(ddOptionsParams);
  const language = selectedLanguage === "ar" ? 2 : 1;

  const currentUserId = String(
    user?.Userid || user?.userId || user?.UserId || user?.username || user?.id || "1"
  );

  // Extract query parameters with localStorage fallback
  const urlTctRecid = searchParams.get("tctRecid");
  const urlTargetName = searchParams.get("targetName");

  const [tctRecid, setTctRecid] = useState<number | null>(
    urlTctRecid ? Number(urlTctRecid) : null
  );
  const [targetName, setTargetName] = useState<string>(urlTargetName || "");

  // Page data states
  const [loading, setLoading] = useState<boolean>(true);
  const [tableData, setTableData] = useState<TargetGroupItem[]>([]);
  const [groupOptions, setGroupOptions] = useState<{ id: string; name: string }[]>([]);
  const [incentiveOptions, setIncentiveOptions] = useState<IncentiveItem[]>([]);
  const [allTargets, setAllTargets] = useState<any[]>([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form field states
  const [formTctRecid, setFormTctRecid] = useState<string>("");
  const [formGroupId, setFormGroupId] = useState<string>("");
  const [formIncentiveId, setFormIncentiveId] = useState<string>("");
  const [formRecStatus, setFormRecStatus] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<{
    tctRecid?: string;
    group?: string;
    incentive?: string;
  }>({});

  // Sync target info on mount
  useEffect(() => {
    if (!tctRecid && typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedTargetForAllocation");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.TCTRECID) {
            setTctRecid(Number(parsed.TCTRECID));
            setTargetName(parsed.TARGETNAME1 || "");
          }
        } catch (e) {
          console.error("Error parsing saved target:", e);
        }
      }
    }
  }, [tctRecid]);

  // Load dropdown options (Allocation Groups and Incentives)
  useEffect(() => {
    let isMounted = true;
    const loadDropdowns = async () => {
      try {
        const [groups, incentives, targets] = await Promise.all([
          fetchLCAllocationGroupOptions(String(language)),
          getIncentiveList(language),
          targetGetData(String(language)),
        ]);

        if (isMounted) {
          if (Array.isArray(groups)) {
            setGroupOptions(groups);
          }
          if (Array.isArray(incentives)) {
            setIncentiveOptions(incentives);
          }
          if (Array.isArray(targets)) {
            setAllTargets(targets);
          }
        }
      } catch (err) {
        console.error("Error loading dropdown options:", err);
      }
    };

    loadDropdowns();
    return () => {
      isMounted = false;
    };
  }, [language]);

  // Sync group options from Redux cache if available
  useEffect(() => {
    if (
      ddValues?.LCALLOCATIONGROUPS &&
      Array.isArray(ddValues.LCALLOCATIONGROUPS) &&
      ddValues.LCALLOCATIONGROUPS.length > 0
    ) {
      setGroupOptions((prev) =>
        prev.length === 0 ? ddValues.LCALLOCATIONGROUPS : prev
      );
    }
  }, [ddValues]);

  // Fetch Table Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTargetGroups({
        TctRecid: tctRecid ?? null,
        TctgRecid: null,
      });
      setTableData(Array.isArray(res) ? [...res] : []);
    } catch (err) {
      console.error("Error fetching target groups:", err);
      toast.error("Failed to load allocation groups");
    } finally {
      setLoading(false);
    }
  }, [tctRecid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Open Add Modal
  const handleOpenAdd = () => {
    setIsEdit(false);
    setSelectedRow(null);
    setFormTctRecid(tctRecid ? String(tctRecid) : "");
    setFormGroupId("");
    setFormIncentiveId("");
    setFormRecStatus(true);
    setFormErrors({});
    setModalOpen(true);
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (row: any) => {
    setIsEdit(true);
    setSelectedRow(row);
    setFormTctRecid(String(row.TCTRECID || tctRecid || ""));
    setFormGroupId(String(row.VB_LCALLOCATIONGROUP ?? ""));
    setFormIncentiveId(String(row.INCENTIVEID ?? ""));
    setFormRecStatus(row.RECSTATUS !== undefined ? Boolean(row.RECSTATUS) : true);
    setFormErrors({});
    setModalOpen(true);
  };

  // Handle Delete
  const handleDelete = async (row: any) => {
    try {
      await deleteTargetGroup({
        TctgRecid: row.TCTGRECID,
        TctRecid: row.TCTRECID || tctRecid || 0,
        UpdateBy: currentUserId,
      });

      // Optimistically update the deleted row's status to INACTIVE immediately
      setTableData((prev) =>
        prev.map((item) =>
          item.TCTGRECID === row.TCTGRECID
            ? {
                ...item,
                RECSTATUS: false,
                UPDATEBY: currentUserId,
                UPDATEDATE: new Date().toISOString(),
              }
            : item
        )
      );

      toast.success("Target Group deleted successfully!");
      
      // Delay re-fetch slightly to allow database commit / avoid any race condition
      setTimeout(() => {
        fetchData();
      }, 400);
    } catch (err: any) {
      console.error("Error deleting target group:", err);
      toast.error(
        err?.response?.data?.responsedescription ||
          err?.message ||
          "Failed to delete target group"
      );
    }
  };

  // Handle Submit Form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { tctRecid?: string; group?: string; incentive?: string } = {};
    const finalTctRecid = Number(formTctRecid || tctRecid || 0);

    if (!finalTctRecid) {
      errors.tctRecid = "Target is required.";
    }
    if (!formGroupId) {
      errors.group = "Please select an LC Allocation Group.";
    }
    if (!formIncentiveId) {
      errors.incentive = "Please select an Incentive.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    try {
      const payload = {
        tctRecid: finalTctRecid,
        vb_LcAllocationGroup: Number(formGroupId),
        incentiveId: Number(formIncentiveId),
        updateBy: currentUserId,
        updateDate: new Date().toISOString(),
        recStatus: isEdit ? formRecStatus : true,
      };

      if (isEdit && selectedRow?.TCTGRECID) {
        await updateTargetGroup(selectedRow.TCTGRECID, payload);
        toast.success("Target Group updated successfully!");
      } else {
        await addTargetGroup(payload);
        toast.success("Target Group added successfully!");
      }

      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error("Error saving target group:", err);
      toast.error(
        err?.response?.data?.responsedescription ||
          err?.message ||
          "Failed to save target group"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Define table columns
  const tableColumns = useMemo(
    () => [
      {
        id: "actions",
        header: "Actions",
      },
      {
        id: "LCALLOCATIONGROUP",
        accessorFn: (row: any) => {
          const direct =
            row?.ALLOCATIONGROUP ||
            row?.allocationGroup ||
            row?.LCALLOCATIONGROUP ||
            row?.lcAllocationGroup ||
            row?.ALLOCATIONGROUPNAME ||
            row?.allocationGroupName ||
            row?.VALDESC1 ||
            row?.valdesc1;
          if (direct) return direct;
          const gId =
            row?.VB_LCALLOCATIONGROUP ??
            row?.vb_LcAllocationGroup ??
            row?.vb_lcAllocationGroup ??
            row?.GROUPID ??
            row?.groupId;
          const found = groupOptions.find((g) => String(g.id) === String(gId));
          return found ? found.name : gId ? `Group ${gId}` : "-";
        },
        header: "LC Allocation Group",
        cell: ({ row }: any) => {
          const r = row.original;
          const direct =
            r?.ALLOCATIONGROUP ||
            r?.allocationGroup ||
            r?.LCALLOCATIONGROUP ||
            r?.lcAllocationGroup ||
            r?.ALLOCATIONGROUPNAME ||
            r?.allocationGroupName ||
            r?.VALDESC1 ||
            r?.valdesc1;
          if (direct) return direct;
          const gId =
            r?.VB_LCALLOCATIONGROUP ??
            r?.vb_LcAllocationGroup ??
            r?.vb_lcAllocationGroup ??
            r?.GROUPID ??
            r?.groupId;
          const found = groupOptions.find((g) => String(g.id) === String(gId));
          return found ? found.name : gId ? `Group ${gId}` : "-";
        },
      },
      {
        id: "INCENTIVENAME",
        accessorFn: (row: any) => {
          const direct =
            row?.INCENTIVENAME ||
            row?.incentiveName ||
            row?.INCENTIVECODE ||
            row?.incentiveCode ||
            row?.INCENTIVENAME1 ||
            row?.incentiveName1;
          if (direct) return direct;
          const incId =
            row?.INCENTIVEID ??
            row?.incentiveId ??
            row?.TCMIRECID ??
            row?.tcmiRecid;
          const found = incentiveOptions.find(
            (inc) =>
              String(inc.TCMIRECID ?? (inc as any).tcmiRecid) === String(incId)
          );
          return found
            ? (found.INCENTIVENAME1 || found.INCENTIVECODE || (found as any).incentiveName1 || (found as any).incentiveCode)
            : incId
            ? `Incentive ${incId}`
            : "-";
        },
        header: "Incentive",
        cell: ({ row }: any) => {
          const r = row.original;
          const direct =
            r?.INCENTIVENAME ||
            r?.incentiveName ||
            r?.INCENTIVECODE ||
            r?.incentiveCode ||
            r?.INCENTIVENAME1 ||
            r?.incentiveName1;
          if (direct) return direct;
          const incId =
            r?.INCENTIVEID ??
            r?.incentiveId ??
            r?.TCMIRECID ??
            r?.tcmiRecid;
          const found = incentiveOptions.find(
            (inc) =>
              String(inc.TCMIRECID ?? (inc as any).tcmiRecid) === String(incId)
          );
          return found
            ? (found.INCENTIVENAME1 || found.INCENTIVECODE || (found as any).incentiveName1 || (found as any).incentiveCode)
            : incId
            ? `Incentive ${incId}`
            : "-";
        },
      },
      {
        accessorKey: "UPDATEBY",
        header: "Update By",
        cell: ({ row }: any) =>
          row.original.UPDATEBY || row.original.MAKER || "-",
      },
      {
        accessorKey: "UPDATEDATE",
        header: "Update Date",
        cell: ({ row }: any) =>
          formatDateKSA(row.original.UPDATEDATE || row.original.MAKEDATE),
      },
      {
        accessorKey: "RECSTATUS",
        header: "Record Status",
        cell: ({ row }: any) => (
          <BooleanStatus
            value={row.original.RECSTATUS}
            trueText="Active"
            falseText="Inactive"
          />
        ),
      },
    ],
    [groupOptions, incentiveOptions]
  );

  const keyMappings = {
    TCTGRECID: "Target Group Rec ID",
    TCTRECID: "Target Rec ID",
    TARGETNAME1: "Target Name",
    ALLOCATIONGROUP: "LC Allocation Group",
    LCALLOCATIONGROUP: "LC Allocation Group",
    VB_LCALLOCATIONGROUP: "VB LC Allocation Group",
    INCENTIVENAME: "Incentive Name",
    INCENTIVECODE: "Incentive Code",
    INCENTIVEID: "Incentive ID",
    UPDATEBY: "Update By",
    UPDATEDATE: "Update Date",
    MAKER: "Maker",
    MAKEDATE: "Make Date",
    RECSTATUS: "Record Status",
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/admin/TargetScreen")}
            className="h-10 px-3.5 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2 cursor-pointer text-xs shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />

          </Button>

          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Target Allocation Groups
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage groups and incentives linked to targets
            </p>
          </div>
        </div>

        {/* Selected Target Badge */}
        {targetName && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs">
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              Target:
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {targetName}
            </span>
            {tctRecid && (
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                (ID: {tctRecid})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Table */}
      <ReusableDataTable
        title="Allocation Groups"
        headerActions={
          <Button
            onClick={handleOpenAdd}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-10 px-4 cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add New Record
          </Button>
        }
        loading={loading}
        columns={tableColumns}
        initialData={tableData}
        keyMappings={keyMappings}
        onUpdate={(row: any) => handleOpenEdit(row)}
        onDelete={(row: any) => handleDelete(row)}
      />

      {/* Add / Edit Allocation Group Modal */}
      {modalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              setModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-[#f1f5f9] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-white font-sans flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-3.5 flex items-center justify-between font-bold text-base shadow-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-white" />
                <span>
                  {isEdit ? "Edit Allocation Group" : "Add Allocation Group"}
                </span>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setModalOpen(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition-colors cursor-pointer text-white disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Information Strip */}
            <div className="bg-white dark:bg-gray-800 px-6 py-3 border-b border-gray-200/80 dark:border-gray-700/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-500 dark:text-gray-400">
                  Target:
                </span>
                <strong className="text-gray-900 dark:text-white font-bold truncate max-w-[240px]">
                  {targetName ||
                    allTargets.find((t) => String(t.TCTRECID) === String(formTctRecid))
                      ?.TARGETNAME1 ||
                    "Target ID: " + (formTctRecid || tctRecid || "—")}
                </strong>
              </div>

              <span className="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 font-medium text-[11px] border border-gray-200 dark:border-gray-700">
                By: {currentUserId}
              </span>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-5">
              {/* Target Selection if not fixed */}
              {!tctRecid && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-500" />
                    Target <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={formTctRecid}
                    onChange={(e) => {
                      setFormTctRecid(e.target.value);
                      if (e.target.value) {
                        setFormErrors((prev) => ({ ...prev, tctRecid: undefined }));
                      }
                    }}
                    className={`w-full h-11 px-3.5 rounded-xl border bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white transition-all appearance-none outline-none focus:ring-2 cursor-pointer shadow-xs ${
                      formErrors.tctRecid
                        ? "border-red-500 focus:ring-red-400/40"
                        : "border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <option value="">-- Select Target --</option>
                    {allTargets.map((t) => (
                      <option key={t.TCTRECID} value={t.TCTRECID}>
                        {t.TARGETNAME1} (ID: {t.TCTRECID})
                      </option>
                    ))}
                  </select>
                  {formErrors.tctRecid && (
                    <span className="text-[11px] font-medium text-red-500">
                      {formErrors.tctRecid}
                    </span>
                  )}
                </div>
              )}

              {/* 1. LC Allocation Group Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-gray-500" />
                  LC Allocation Group <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formGroupId}
                    onChange={(e) => {
                      setFormGroupId(e.target.value);
                      if (e.target.value) {
                        setFormErrors((prev) => ({ ...prev, group: undefined }));
                      }
                    }}
                    className={`w-full h-11 px-3.5 rounded-xl border bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white transition-all appearance-none outline-none focus:ring-2 cursor-pointer shadow-xs ${
                      formErrors.group
                        ? "border-red-500 focus:ring-red-400/40"
                        : "border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <option value="">-- Select LC Allocation Group --</option>
                    {groupOptions.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                    ▼
                  </div>
                </div>
                {formErrors.group && (
                  <span className="text-[11px] font-medium text-red-500">
                    {formErrors.group}
                  </span>
                )}
              </div>

              {/* 2. Incentive Dropdown (/api/CnfgMstIncentive on BS server) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-gray-500" />
                  Incentive <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formIncentiveId}
                    onChange={(e) => {
                      setFormIncentiveId(e.target.value);
                      if (e.target.value) {
                        setFormErrors((prev) => ({ ...prev, incentive: undefined }));
                      }
                    }}
                    className={`w-full h-11 px-3.5 rounded-xl border bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white transition-all appearance-none outline-none focus:ring-2 cursor-pointer shadow-xs ${
                      formErrors.incentive
                        ? "border-red-500 focus:ring-red-400/40"
                        : "border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <option value="">-- Select Incentive --</option>
                    {incentiveOptions.map((inc) => (
                      <option key={inc.TCMIRECID} value={inc.TCMIRECID}>
                        {inc.INCENTIVECODE}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                    ▼
                  </div>
                </div>
                {formErrors.incentive && (
                  <span className="text-[11px] font-medium text-red-500">
                    {formErrors.incentive}
                  </span>
                )}
              </div>

              {/* 3. Record Status Checkbox / Switch (Edit mode only) */}
              {isEdit && (
                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-xs transition-all">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="record-status"
                      checked={formRecStatus}
                      onCheckedChange={(checked) => setFormRecStatus(checked === true)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div className="flex flex-col gap-0.5">
                      <label
                        htmlFor="record-status"
                        className="text-xs font-bold text-gray-900 dark:text-white cursor-pointer"
                      >
                        Active Record Status
                      </label>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Enable or disable this allocation group record
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200/80 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => setModalOpen(false)}
                  className="h-10 px-5 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm cursor-pointer transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {isEdit ? "Update Group" : "Save Group"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AllocationGroupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AllocationGroupContent />
    </Suspense>
  );
}
