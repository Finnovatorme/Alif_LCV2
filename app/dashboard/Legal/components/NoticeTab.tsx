"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  BellRing,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  FileText,
  Send,
  RefreshCw,
  Calendar,
  Check,
  Building,
  User,
  ShieldCheck,
  Info,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { TablePagination } from "@/components/ui/TablePagination";
import { HoverDescriptionCell } from "@/components/ui/HoverDescriptionCell";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDateKSA } from "@/utils/helpers";
import {
  LegalCaseRecord,
  LegalNoticeRecord,
  AddLegalNoticePayload,
  getLegalNotice,
  addLegalNotice,
  updateLegalNotice,
  deleteLegalNotice,
  DEFAULT_LEGAL_CASE,
  DEFAULT_LEGAL_NOTICES,
  NOTICE_CHANNELS,
  NOTICE_REASONS,
} from "../HandlingAPIs";

interface NoticeTabProps {
  legalCase?: LegalCaseRecord | null;
  cifId?: number | string;
  loanId?: number | string;
  language?: number;
}

const EMPTY_FORM = {
  noticeRequired: false,
  vbLegalNoticeReason: "" as string | number,
  vbLegalNoticeChannel: "" as string | number,
  noticeDate: "",
  deliveryDate: "",
  noticePeriodInDays: "" as string | number,
  noticeDetails: "",
  noticeExpiryDate: "",
};

export const NoticeTab: React.FC<NoticeTabProps> = ({
  legalCase,
  cifId,
  loanId,
  language = 1,
}) => {
  const activeCase = legalCase || DEFAULT_LEGAL_CASE;
  const boundCaseId = activeCase.TLLCRECID || 1;
  const boundCifId = activeCase.CIFID || Number(cifId) || 246;
  const boundLoanId = activeCase.LOANID || Number(loanId) || 10284;

  const [notices, setNotices] = useState<LegalNoticeRecord[]>(DEFAULT_LEGAL_NOTICES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [requiredFilter, setRequiredFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { user: authUser } = useAuth();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNotice, setEditingNotice] = useState<LegalNoticeRecord | null>(null);
  const [previewNotice, setPreviewNotice] = useState<LegalNoticeRecord | null>(null);

  // Reusable Delete Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    item: LegalNoticeRecord | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    item: null,
    isLoading: false,
  });

  // React Hook Form with live validation
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: EMPTY_FORM,
    mode: "onChange",
  });

  // Get current logged-in user or default
  const getLoggedInUser = (): string => {
    if (authUser?.userId || authUser?.Userid || authUser?.UserId || authUser?.username || authUser?.id) {
      return String(authUser.userId || authUser.Userid || authUser.UserId || authUser.username || authUser.id);
    }
    if (typeof window !== "undefined") {
      try {
        const auth = localStorage.getItem("authData");
        if (auth) {
          const parsed = JSON.parse(auth);
          return (
            parsed.username ||
            parsed.userName ||
            parsed.userId ||
            parsed.UserId ||
            parsed.name ||
            parsed.id ||
            "sysadmin"
          );
        }
      } catch {
        // ignore
      }
    }
    return activeCase.APPROVEDBY || "sysadmin";
  };

  // Fetch notices from live API
  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLegalNotice({
        TllcRecId: boundCaseId,
        CifId: boundCifId,
        LoanId: boundLoanId,
        Language: language,
      });
      if (Array.isArray(data) && data.length > 0) {
        setNotices(data);
      } else {
        setNotices(DEFAULT_LEGAL_NOTICES);
      }
    } catch (err) {
      console.error("Error fetching notices:", err);
      setNotices(DEFAULT_LEGAL_NOTICES);
    } finally {
      setLoading(false);
    }
  }, [boundCaseId, boundCifId, boundLoanId, language]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Handle Notice Period change -> auto-calculate expiry date if noticeDate is set
  const handlePeriodChange = (daysVal: string) => {
    setValue("noticePeriodInDays", daysVal, { shouldValidate: true });
    const days = parseInt(daysVal, 10);
    const nDate = watch("noticeDate");
    if (!isNaN(days) && days >= 0 && nDate) {
      const baseDate = new Date(nDate);
      const expiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      setValue("noticeExpiryDate", expiry.toISOString().slice(0, 10));
    }
  };

  // Handle Notice Date change -> adjust expiry date based on period if provided
  const handleNoticeDateChange = (dateStr: string) => {
    setValue("noticeDate", dateStr, { shouldValidate: true });
    const currentDelivery = watch("deliveryDate");
    if (!currentDelivery) {
      setValue("deliveryDate", dateStr);
    }
    const periodDays = parseInt(String(watch("noticePeriodInDays")), 10);
    if (dateStr && !isNaN(periodDays) && periodDays > 0) {
      const baseDate = new Date(dateStr);
      const expiry = new Date(baseDate.getTime() + periodDays * 24 * 60 * 60 * 1000);
      setValue("noticeExpiryDate", expiry.toISOString().slice(0, 10));
    }
  };

  // Open modal for ADD: Reset completely to clean blank fields
  const handleOpenAdd = () => {
    setEditingNotice(null);
    reset({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  // Open modal for EDIT: Populate with existing record data
  const handleOpenEdit = (item: LegalNoticeRecord) => {
    setEditingNotice(item);

    const parseDateOnly = (val?: string) => {
      if (!val) return "";
      return val.slice(0, 10);
    };

    reset({
      noticeRequired: Boolean(item.NOTICEREQUIRED ?? item.noticeRequired ?? false),
      vbLegalNoticeReason: item.VB_LEGALNOTICEREASON ?? item.vbLegalNoticeReason ?? "",
      vbLegalNoticeChannel: item.VB_LEGALNOTICECHANNEL ?? item.vbLegalNoticeChannel ?? "",
      noticeDate: parseDateOnly(item.NOTICEDATE || item.noticeDate),
      deliveryDate: parseDateOnly(item.DELIVERYDATE || item.deliveryDate),
      noticePeriodInDays:
        item.NOTICEPERIODINDAYS !== undefined && item.NOTICEPERIODINDAYS !== null
          ? String(item.NOTICEPERIODINDAYS)
          : item.noticePeriodInDays !== undefined && item.noticePeriodInDays !== null
          ? String(item.noticePeriodInDays)
          : "",
      noticeDetails: item.NOTICEDETAILS || item.noticeDetails || "",
      noticeExpiryDate: parseDateOnly(item.NOTICEEXPIRYDATE || item.noticeExpiryDate),
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item: LegalNoticeRecord) => {
    setDeleteModalState({
      isOpen: true,
      item,
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const item = deleteModalState.item;
    const recordId = item?.TLLNRECID ?? item?.tllnRecId;
    if (!recordId) return;

    setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
    const currentUser = getLoggedInUser();

    try {
      const res = await deleteLegalNotice(recordId, currentUser);
      if (res.success) {
        toast.success( "Legal notice deleted successfully");
        setNotices((prev) =>
          prev.filter((n) => (n.TLLNRECID ?? n.tllnRecId) !== recordId)
        );
        setDeleteModalState({ isOpen: false, item: null, isLoading: false });
      } else {
        toast.error(res.message || "Failed to delete legal notice");
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      toast.error(err?.message || "Error deleting legal notice");
      setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveNotice = async (formData: typeof EMPTY_FORM) => {
    setIsSubmitting(true);
    const currentUser = getLoggedInUser();

    const nDate = new Date(formData.noticeDate).toISOString();
    const dDate = formData.deliveryDate
      ? new Date(formData.deliveryDate).toISOString()
      : nDate;
    const periodDays = parseInt(String(formData.noticePeriodInDays), 10) || 0;
    const expDate = formData.noticeExpiryDate
      ? new Date(formData.noticeExpiryDate).toISOString()
      : new Date(Date.now() + (periodDays || 15) * 24 * 60 * 60 * 1000).toISOString();

    const payload: AddLegalNoticePayload = {
      tllcRecId: boundCaseId,
      cifId: boundCifId,
      loanId: boundLoanId,
      noticeRequired: Boolean(formData.noticeRequired),
      vbLegalNoticeReason: Number(formData.vbLegalNoticeReason),
      vbLegalNoticeChannel: Number(formData.vbLegalNoticeChannel),
      noticeDate: nDate,
      deliveryDate: dDate,
      noticePeriodInDays: periodDays,
      noticeDetails: formData.noticeDetails.trim(),
      noticeExpiryDate: expDate,
      updateDate: new Date().toISOString(),
      updateBy: currentUser,
    };

    try {
      if (editingNotice) {
        const id = editingNotice.TLLNRECID ?? editingNotice.tllnRecId;
        if (!id) {
          toast.error("Notice ID not found for update");
          setIsSubmitting(false);
          return;
        }

        const res = await updateLegalNotice(id, payload);
        if (res.success) {
          toast.success(res.message || "Notice updated successfully");
          setNotices((prev) =>
            prev.map((n) =>
              (n.TLLNRECID ?? n.tllnRecId) === id
                ? {
                    ...n,
                    ...payload,
                    TLLNRECID: id,
                    tllnRecId: id,
                    LEGALNOTICECHANNEL:
                      NOTICE_CHANNELS[payload.vbLegalNoticeChannel] || "SMS",
                    LEGALNOTICEREASON:
                      NOTICE_REASONS[payload.vbLegalNoticeReason] || "Default Notice",
                  }
                : n
            )
          );
          setIsModalOpen(false);
        } else {
          toast.error(res.message || "Failed to update notice");
        }
      } else {
        const res = await addLegalNotice(payload);
        if (res.success) {
          toast.success(res.message || "Legal notice added successfully");
          const createdId =
            res.data?.TLLNRECID ??
            res.data?.tllnRecId ??
            Math.max(0, ...notices?.map((n) => Number(n.TLLNRECID ?? n.tllnRecId ?? 0))) + 1;

          const newRecord: LegalNoticeRecord = {
            ...payload,
            TLLNRECID: createdId,
            tllnRecId: createdId,
            TLLCRECID: boundCaseId,
            tllcRecId: boundCaseId,
            CIFID: boundCifId,
            cifId: boundCifId,
            LOANID: boundLoanId,
            loanId: boundLoanId,
            LEGALNOTICECHANNEL: NOTICE_CHANNELS[payload.vbLegalNoticeChannel] || "SMS",
            LEGALNOTICEREASON:
              NOTICE_REASONS[payload.vbLegalNoticeReason] || "Default Notice",
          };
          setNotices((prev) => [newRecord, ...prev]);
          setIsModalOpen(false);
        } else {
          toast.error(res.message || "Failed to add legal notice");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Notices
  const filteredNotices = notices?.filter((item) => {
    const details = item.NOTICEDETAILS || item.noticeDetails || "";
    const reasonText =
      item.LEGALNOTICEREASON ||
      NOTICE_REASONS[item.VB_LEGALNOTICEREASON || item.vbLegalNoticeReason || 1] ||
      "";
    const channelText =
      item.LEGALNOTICECHANNEL ||
      NOTICE_CHANNELS[item.VB_LEGALNOTICECHANNEL || item.vbLegalNoticeChannel || 1] ||
      "";
    const idStr = String(item.TLLNRECID ?? item.tllnRecId ?? "");

    const matchesSearch =
      details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reasonText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channelText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idStr.includes(searchQuery);

    const channelVal = String(item.VB_LEGALNOTICECHANNEL ?? item.vbLegalNoticeChannel ?? "");
    const matchesChannel = channelFilter === "all" || channelVal === channelFilter;

    const isReq = item.NOTICEREQUIRED ?? item.noticeRequired ?? false;
    const matchesRequired =
      requiredFilter === "all" ||
      (requiredFilter === "true" && isReq) ||
      (requiredFilter === "false" && !isReq);

    return matchesSearch && matchesChannel && matchesRequired;
  });

  // Paginated Notices (10 per page default)
  const paginatedNotices = filteredNotices.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Main Container */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

        {/* Header and Controls */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Legal Demand Notices
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                  Case #{boundCaseId}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Issue, serve and track statutory default warnings & judicial notices
              </p>
            </div>
          </div>

          {/* Action Filters & Add Button (Pinned to Right Side) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5 shrink-0 ml-auto lg:ml-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notices..."
                className="h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-44 sm:w-52"
              />
            </div>

            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Channels</option>
              {Object.entries(NOTICE_CHANNELS).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>

            {/* Required Filter */}
            <select
              value={requiredFilter}
              onChange={(e) => setRequiredFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="true">Mandatory Notices</option>
              <option value="false">Optional Notices</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchNotices}
              title="Refresh notices"
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Add Notice Button - Right Aligned */}
            <Button
              onClick={handleOpenAdd}
              className="h-9 px-4 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto"
            >
              <Plus className="w-4 h-4" />
              Add Notice
            </Button>
          </div>
        </div>

        {/* Notices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-5">Notice ID</th>
                <th className="py-3 px-4 min-w-[220px]">Notice Details</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Notice Date</th>
                <th className="py-3 px-4">Delivery Date</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-center">Required</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredNotices?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    No legal notices found. Click <strong>Add Notice</strong> to create a new record.
                  </td>
                </tr>
              ) : (
                paginatedNotices?.map((notice, idx) => {
                  const id = notice.TLLNRECID ?? notice.tllnRecId ?? idx + 1;
                  const details = notice.NOTICEDETAILS || notice.noticeDetails || "—";
                  const reasonCode = notice.VB_LEGALNOTICEREASON ?? notice.vbLegalNoticeReason ?? 1;
                  const reasonText =
                    notice.LEGALNOTICEREASON || NOTICE_REASONS[reasonCode] || `Reason #${reasonCode}`;

                  const channelCode =
                    notice.VB_LEGALNOTICECHANNEL ?? notice.vbLegalNoticeChannel ?? 1;
                  const channelText =
                    notice.LEGALNOTICECHANNEL || NOTICE_CHANNELS[channelCode] || `Channel #${channelCode}`;

                  const nDate = notice.NOTICEDATE || notice.noticeDate;
                  const dDate = notice.DELIVERYDATE || notice.deliveryDate;
                  const period = notice.NOTICEPERIODINDAYS ?? notice.noticePeriodInDays ?? 0;
                  const expDate = notice.NOTICEEXPIRYDATE || notice.noticeExpiryDate;
                  const isRequired = notice.NOTICEREQUIRED ?? notice.noticeRequired ?? false;

                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Notice ID */}
                      <td className="py-3 px-5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                          #{id}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4">
                        <HoverDescriptionCell
                          text={details}
                          title="Legal Notice Text"
                          arabicTitle="تفاصيل نص الإشعار القانوني"
                          maxWidth="max-w-[220px]"
                          themeColor="blue"
                          language={language}
                          onViewClick={() => setPreviewNotice(notice)}
                        />
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        <span className="font-medium text-xs">{reasonText}</span>
                      </td>

                      {/* Channel Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            channelCode === 1
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                              : channelCode === 2
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : channelCode === 3
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : channelCode === 4
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                          }`}
                        >
                          {channelText}
                        </span>
                      </td>

                      {/* Notice Date */}
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
                        {nDate ? formatDateKSA(nDate) : "—"}
                      </td>

                      {/* Delivery Date */}
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
                        {dDate ? formatDateKSA(dDate) : "—"}
                      </td>

                      {/* Notice Period */}
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold whitespace-nowrap">
                        {period} Days
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-mono font-medium whitespace-nowrap">
                        {expDate ? formatDateKSA(expDate) : "—"}
                      </td>

                      {/* Notice Required */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isRequired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Mandatory
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/10 text-gray-500 dark:text-gray-400 border border-gray-500/20">
                            Optional
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewNotice(notice)}
                            title="Preview Notice"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(notice)}
                            title="Edit Notice"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(notice)}
                            title="Delete Notice"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredNotices.length > 0 && (
          <TablePagination
            currentPage={page}
            totalItems={filteredNotices.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="notices"
            themeColor="blue"
          />
        )}
      </div>

      {/* Professional Add / Edit Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Top Accent Gradient Line */}
            <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#0c1427]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingNotice
                      ? `Update Legal Notice #${editingNotice.TLLNRECID ?? editingNotice.tllnRecId}`
                      : "Add New Legal Notice"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {editingNotice
                      ? "Modify and update legal notice parameters"
                      : "Create and dispatch formal legal demand notice"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Pill Bar */}
            <div className="px-6 py-2.5 bg-gray-100/70 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800/80 flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Context:</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                Case #{boundCaseId}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                CIF: {boundCifId}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                Loan: {boundLoanId}
              </span>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit(handleSaveNotice)} className="p-6 space-y-4.5 overflow-y-auto">
              {/* 1. Notice Details / Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Notice Details / Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  {...register("noticeDetails", {
                    required: "Notice details / description is required",
                    minLength: { value: 5, message: "Details must be at least 5 characters" },
                  })}
                  placeholder="Enter formal notice subject, legal warning text, or dispatch summary..."
                  className={`w-full p-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 shadow-xs resize-none ${
                    errors.noticeDetails
                      ? "border-rose-500 focus:ring-rose-500/40"
                      : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                  }`}
                />
                {errors.noticeDetails && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.noticeDetails.message as string}
                  </p>
                )}
              </div>

              {/* 2. Notice Reason & Channel (2 Spacious Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Notice Reason <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("vbLegalNoticeReason", {
                      required: "Please select a notice reason",
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                      errors.vbLegalNoticeReason
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                    }`}
                  >
                    <option value="" disabled>
                      -- Select Notice Reason --
                    </option>
                    {Object.entries(NOTICE_REASONS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalNoticeReason && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.vbLegalNoticeReason.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Delivery Channel <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("vbLegalNoticeChannel", {
                      required: "Please select a delivery channel",
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                      errors.vbLegalNoticeChannel
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                    }`}
                  >
                    <option value="" disabled>
                      -- Select Channel --
                    </option>
                    {Object.entries(NOTICE_CHANNELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalNoticeChannel && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.vbLegalNoticeChannel.message as string}
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Notice Issue Date & Delivery Date (2 Spacious Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Notice Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("noticeDate", {
                      required: "Notice issue date is required",
                      onChange: (e) => handleNoticeDateChange(e.target.value),
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                      errors.noticeDate
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                    }`}
                  />
                  {errors.noticeDate && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.noticeDate.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    {...register("deliveryDate")}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-xs"
                  />
                </div>
              </div>

              {/* 4. Period (Days) & Expiry Date (2 Spacious Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Period in Days
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    {...register("noticePeriodInDays", {
                      onChange: (e) => handlePeriodChange(e.target.value),
                    })}
                    placeholder="e.g. 15 or 30"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Notice Expiry Date
                  </label>
                  <input
                    type="date"
                    {...register("noticeExpiryDate")}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-xs"
                  />
                </div>
              </div>

              {/* 5. Notice Required (Mandatory Notice) Card via Controller */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-800/50">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    Compulsory Legal Notice
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Mark as mandatory legal requirement before initiating court proceedings
                  </span>
                </div>
                <Controller
                  control={control}
                  name="noticeRequired"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : editingNotice ? (
                    "Update Notice"
                  ) : (
                    "Save Legal Notice"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewNotice && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewNotice(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Legal Notice Details #{previewNotice.TLLNRECID ?? previewNotice.tllnRecId}
              </span>
              <button
                type="button"
                onClick={() => setPreviewNotice(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200/80 dark:border-gray-700/80">
                <div>
                  <span className="text-gray-500 block text-[11px]">Case Ref:</span>
                  <strong className="text-gray-900 dark:text-white">
                    #{previewNotice.TLLCRECID ?? previewNotice.tllcRecId ?? boundCaseId}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Customer CIF:</span>
                  <strong className="text-gray-900 dark:text-white">
                    {previewNotice.CIFID ?? previewNotice.cifId ?? boundCifId}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Loan ID:</span>
                  <strong className="text-gray-900 dark:text-white">
                    {previewNotice.LOANID ?? previewNotice.loanId ?? boundLoanId}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Updated By:</span>
                  <strong className="text-gray-900 dark:text-white">
                    {previewNotice.UPDATEBY || previewNotice.updateBy || "aadna"}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Notice Details:</span>
                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 text-gray-900 dark:text-white font-medium">
                  {previewNotice.NOTICEDETAILS || previewNotice.noticeDetails || "—"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 block text-[11px]">Reason:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {previewNotice.LEGALNOTICEREASON ||
                      NOTICE_REASONS[
                        previewNotice.VB_LEGALNOTICEREASON ||
                          previewNotice.vbLegalNoticeReason ||
                          1
                      ]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Channel:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {previewNotice.LEGALNOTICECHANNEL ||
                      NOTICE_CHANNELS[
                        previewNotice.VB_LEGALNOTICECHANNEL ||
                          previewNotice.vbLegalNoticeChannel ||
                          1
                      ]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-gray-500 block text-[11px]">Notice Date:</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">
                    {formatDateKSA(previewNotice.NOTICEDATE || previewNotice.noticeDate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Delivery Date:</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">
                    {formatDateKSA(previewNotice.DELIVERYDATE || previewNotice.deliveryDate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Period:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {previewNotice.NOTICEPERIODINDAYS ?? previewNotice.noticePeriodInDays ?? 0} Days
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block text-[11px]">Notice Expiry Date:</span>
                <span className="font-mono text-rose-600 font-bold text-sm">
                  {formatDateKSA(
                    previewNotice.NOTICEEXPIRYDATE || previewNotice.noticeExpiryDate
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState({ isOpen: false, item: null, isLoading: false })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Notice?"
        description="Your notice will be permanently deleted and cannot be recovered."
        itemName={
          deleteModalState.item
            ? `Notice #${deleteModalState.item.TLLNRECID ?? deleteModalState.item.tllnRecId}`
            : undefined
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteModalState.isLoading}
      />
    </div>
  );
};
