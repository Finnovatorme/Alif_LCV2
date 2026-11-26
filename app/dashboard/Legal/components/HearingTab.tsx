"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Gavel,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  Calendar,
  Building,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDateKSA } from "@/utils/helpers";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { TablePagination } from "@/components/ui/TablePagination";
import { HoverDescriptionCell } from "@/components/ui/HoverDescriptionCell";
import { DescriptionPreviewModal } from "@/components/ui/DescriptionPreviewModal";
import { useAuth } from "@/hooks/useAuth";
import {
  LegalCaseRecord,
  DEFAULT_LEGAL_CASE,
  LegalCourtHearingRecord,
  AddLegalCourtHearingPayload,
  getLegalCourtHearing,
  addLegalCourtHearing,
  updateLegalCourtHearing,
  deleteLegalCourtHearing,
  COURT_EVENTS,
  COURT_EVENTS_AR,
  getCourtEventText,
  formatUnilingualText,
} from "../HandlingAPIs";

interface HearingTabProps {
  legalCase?: LegalCaseRecord | null;
  cifId?: number | string;
  loanId?: number | string;
  language?: number;
}

const EMPTY_HEARING_FORM = {
  hearingReference: "",
  vbLegalCourtEvent: "" as string | number,
  courtName: "",
  hearingDate: "",
  nextHearingDate: "",
  attendedBy: "",
  hearingDetails: "",
};

export const HearingTab: React.FC<HearingTabProps> = ({
  legalCase,
  cifId,
  loanId,
  language = 1,
}) => {
  const isAr = language === 2;
  const { user: authUser } = useAuth();

  // Primary IDs
  const boundCaseId =
    legalCase?.TLLCRECID ?? legalCase?.tllcRecId ?? DEFAULT_LEGAL_CASE.TLLCRECID;
  const targetCifId = cifId ?? legalCase?.CIFID ?? DEFAULT_LEGAL_CASE.CIFID;
  const targetLoanId = loanId ?? legalCase?.LOANID ?? DEFAULT_LEGAL_CASE.LOANID;

  // Active user resolver
  const getLoggedInUser = (): string => {
    if (authUser?.userId || authUser?.Userid || authUser?.UserId || authUser?.username || authUser?.id) {
      return String(authUser.userId || authUser.Userid || authUser.UserId || authUser.username || authUser.id);
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          return u.userId || u.Userid || u.UserId || u.username || u.id || "sysadmin";
        }
      } catch {}
    }
    return "sysadmin";
  };

  // State
  const [hearings, setHearings] = useState<LegalCourtHearingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  // Pagination state (10 per page default)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<LegalCourtHearingRecord | null>(null);

  // React Hook Form with live validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: EMPTY_HEARING_FORM,
    mode: "onChange",
  });

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    item: LegalCourtHearingRecord | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    item: null,
    isLoading: false,
  });

  // Full Description preview modal
  const [previewDescription, setPreviewDescription] = useState<{
    refNo: string;
    description: string;
    event?: string;
    court?: string;
    attendedBy?: string;
  } | null>(null);

  // Fetch hearings from API
  const fetchHearings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLegalCourtHearing({
        TllcRecId: boundCaseId,
        CifId: targetCifId,
        LoanId: targetLoanId,
        Language: language,
      });

      if (Array.isArray(data)) {
        setHearings(data);
      } else {
        setHearings([]);
      }
    } catch (err: any) {
      console.error("Error loading hearings:", err);
      toast.error("Failed to load court hearings");
    } finally {
      setLoading(false);
    }
  }, [boundCaseId, targetCifId, targetLoanId, language]);

  useEffect(() => {
    fetchHearings();
  }, [fetchHearings]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    reset(EMPTY_HEARING_FORM);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: LegalCourtHearingRecord) => {
    setEditingItem(item);
    const hDate = item.HEARINGDATE || item.hearingDate || "";
    const nDate = item.NEXTHEARINGDATE || item.nextHearingDate || "";

    reset({
      hearingReference: item.HEARINGREFERENCE || item.hearingReference || "",
      vbLegalCourtEvent: String(item.VB_LEGALCOURTEVENT ?? item.vbLegalCourtEvent ?? ""),
      courtName: item.COURTNAME || item.courtName || "",
      hearingDate: hDate ? hDate.split("T")[0] : "",
      nextHearingDate: nDate ? nDate.split("T")[0] : "",
      attendedBy: item.ATTENDEDBY || item.attendedBy || "",
      hearingDetails: item.HEARINGDETAILS || item.hearingDetails || "",
    });
    setIsModalOpen(true);
  };

  // Submit Add / Edit using React Hook Form validated values
  const handleSubmitForm = async (values: typeof EMPTY_HEARING_FORM) => {
    const currentUser = getLoggedInUser();
    const nowIso = new Date().toISOString();

    const payload: AddLegalCourtHearingPayload = {
      tllcRecId: Number(boundCaseId) || 1,
      cifId: Number(targetCifId) || 0,
      loanId: Number(targetLoanId) || 0,
      hearingReference: values.hearingReference.trim(),
      vbLegalCourtEvent: Number(values.vbLegalCourtEvent) || 1,
      courtName: values.courtName.trim(),
      hearingDate: values.hearingDate ? `${values.hearingDate}T00:00:00.000Z` : nowIso,
      nextHearingDate: values.nextHearingDate ? `${values.nextHearingDate}T00:00:00.000Z` : nowIso,
      attendedBy: values.attendedBy.trim(),
      hearingDetails: values.hearingDetails.trim(),
      updateDate: nowIso,
      updateBy: currentUser,
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const id = editingItem.TLCHRECID ?? editingItem.tlchRecId ?? editingItem.id;
        if (!id) {
          toast.error("Hearing ID not found for update");
          setIsSubmitting(false);
          return;
        }

        const res = await updateLegalCourtHearing(id, payload);
        if (res.success) {
          toast.success(res.message || "Court Hearing updated successfully");
          // Instant direct table update
          setHearings((prev) =>
            prev.map((h) =>
              (h.TLCHRECID ?? h.tlchRecId ?? h.id) === id
                ? { ...h, ...payload, TLCHRECID: id, tlchRecId: id }
                : h
            )
          );
          setIsModalOpen(false);
          fetchHearings();
        } else {
          toast.error(res.message || "Failed to update Court Hearing");
        }
      } else {
        const res = await addLegalCourtHearing(payload);
        if (res.success) {
          toast.success(res.message || "Court Hearing added successfully");
          const createdId =
            res.data?.TLCHRECID ??
            res.data?.tlchRecId ??
            res.data?.id ??
            Math.max(0, ...hearings.map((h) => Number(h.TLCHRECID ?? h.tlchRecId ?? h.id ?? 0))) + 1;

          const newItem: LegalCourtHearingRecord = {
            ...payload,
            TLCHRECID: createdId,
            tlchRecId: createdId,
            id: createdId,
          };
          // Instant direct table update
          setHearings((prev) => [newItem, ...prev]);
          setIsModalOpen(false);
          fetchHearings();
        } else {
          toast.error(res.message || "Failed to register Court Hearing");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred while saving hearing");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (item: LegalCourtHearingRecord) => {
    setDeleteModalState({
      isOpen: true,
      item,
      isLoading: false,
    });
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalState.item) return;
    const id = deleteModalState.item.TLCHRECID ?? deleteModalState.item.tlchRecId ?? deleteModalState.item.id;
    if (!id) {
      toast.error("Hearing ID not found");
      return;
    }

    const currentUser = getLoggedInUser();
    try {
      setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
      const res = await deleteLegalCourtHearing(id, currentUser);
      if (res.success) {
        toast.success(res.message || "Court Hearing deleted successfully");
        // Instant direct table update
        setHearings((prev) =>
          prev.filter((h) => (h.TLCHRECID ?? h.tlchRecId ?? h.id) !== id)
        );
        setDeleteModalState({ isOpen: false, item: null, isLoading: false });
        fetchHearings();
      } else {
        toast.error(res.message || "Failed to delete Court Hearing");
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      toast.error(err?.message || "Error deleting hearing");
      setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Filtered hearings
  const filteredHearings = useMemo(() => {
    return hearings.filter((h) => {
      const ref = h.HEARINGREFERENCE || h.hearingReference || "";
      const court = h.COURTNAME || h.courtName || "";
      const details = h.HEARINGDETAILS || h.hearingDetails || "";
      const attended = h.ATTENDEDBY || h.attendedBy || "";
      const eventCode = String(h.VB_LEGALCOURTEVENT ?? h.vbLegalCourtEvent ?? "");

      const matchesSearch =
        ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        court.toLowerCase().includes(searchQuery.toLowerCase()) ||
        details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attended.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEvent = eventFilter === "all" || eventCode === eventFilter;

      return matchesSearch && matchesEvent;
    });
  }, [hearings, searchQuery, eventFilter]);

  // Paginated hearings (max 10 per page default)
  const paginatedHearings = useMemo(() => {
    return filteredHearings.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredHearings, page, pageSize]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hearings */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "إجمالي الجلسات" : "Total Hearings"}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {hearings.length}
              </h4>
              <p className="text-[10px] text-sky-500 font-medium mt-0.5">
                {isAr ? "جلسات قضائية مسجلة" : "Court Proceedings"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Gavel className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Next Session Date */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "الجلسة القادمة" : "Next Hearing"}
              </p>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 font-mono">
                {hearings[0]?.NEXTHEARINGDATE || hearings[0]?.nextHearingDate
                  ? formatDateKSA(hearings[0].NEXTHEARINGDATE || hearings[0].nextHearingDate)
                  : (isAr ? "مجدولة" : "Scheduled")}
              </h4>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                {isAr ? "الموعد القضائي القادم" : "Upcoming Session"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Sessions Attended */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "التمثيل القانوني" : "Legal Representation"}
              </p>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate max-w-[140px]">
                {hearings[0]?.ATTENDEDBY || hearings[0]?.attendedBy || (isAr ? "محامٍ معتمد" : "Assigned Counsel")}
              </h4>
              <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
                {isAr ? "ممثل الترافع" : "Appointed Advocate"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Presiding Court */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "المحكمة المختصة" : "Presiding Court"}
              </p>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate max-w-[140px]">
                {hearings[0]?.COURTNAME || hearings[0]?.courtName || (isAr ? "المحكمة العامة" : "General Court")}
              </h4>
              <p className="text-[10px] text-cyan-500 font-medium mt-0.5">
                {isAr ? "الدائرة التجارية" : "Commercial Circuit"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <Building className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Hearing Table Container */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-500" />

        {/* Header & Controls Bar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isAr ? "جلسات المحكمة" : "Hearing Proceedings"}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20 whitespace-nowrap">
                  {isAr ? `قضية رقم #${boundCaseId}` : `Legal Case #${boundCaseId}`}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAr
                  ? "متابعة وقائع الجلسات، مراحل المرافعة، محاضر الحضور، والمواعيد القضائية القادمة"
                  : "Track court sessions, pleading stages, attendance minutes, and next scheduled appearances"}
              </p>
            </div>
          </div>

          {/* Action Filters & Add Button (Pinned to Right Side) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5 shrink-0 ml-auto xl:ml-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "البحث في الجلسات..." : "Search hearing..."}
                className="h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 w-36 sm:w-44"
              />
            </div>

            {/* Event Filter */}
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">{isAr ? "جميع الجلسات" : "All Events"}</option>
              {Object.entries(isAr ? COURT_EVENTS_AR : COURT_EVENTS).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchHearings}
              title={isAr ? "تحديث الجلسات" : "Refresh hearings"}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Add Hearing Button - Right Aligned */}
            <Button
              onClick={handleOpenAdd}
              className="h-9 px-4 shrink-0 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto"
            >
              <Plus className="w-4 h-4" />
              {isAr ? "إضافة جلسة" : "Add Hearing"}
            </Button>
          </div>
        </div>

        {/* Dynamic-Height Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-5">{isAr ? "رقم محضر الجلسة" : "Hearing Ref"}</th>
                <th className="py-3 px-4 min-w-[200px]">{isAr ? "نوع ومرحلة الجلسة" : "Court Event"}</th>
                <th className="py-3 px-4">{isAr ? "المحكمة والدائرة" : "Court Name"}</th>
                <th className="py-3 px-4">{isAr ? "تاريخ الجلسة" : "Hearing Date"}</th>
                <th className="py-3 px-4">{isAr ? "موعد الجلسة القادمة" : "Next Hearing Date"}</th>
                <th className="py-3 px-4">{isAr ? "اسم الحاضر" : "Attended By"}</th>
                <th className="py-3 px-4 min-w-[200px] max-w-[260px]">{isAr ? "تفاصيل ووقائع الجلسة" : "Hearing Details"}</th>
                <th className="py-3 px-5 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredHearings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                        <Gavel className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {isAr ? "لا توجد جلسات قضائية مسجلة" : "No Court Hearings Found"}
                      </span>
                      <p className="text-xs max-w-sm text-gray-500">
                        {isAr
                          ? "لم يتم تسجيل أي جلسات قضائية مجدولة لهذه القضية حتى الآن."
                          : "There are currently no scheduled court hearings recorded for this legal case."}
                      </p>
                      <Button
                        onClick={handleOpenAdd}
                        className="mt-2 h-8 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {isAr ? "إضافة جلسة" : "Add Hearing"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHearings.map((item, idx) => {
                  const id = item.TLCHRECID ?? item.tlchRecId ?? item.id ?? idx + 1;
                  const refNo = item.HEARINGREFERENCE || item.hearingReference || `HRG-${id}`;
                  const eventCode = item.VB_LEGALCOURTEVENT ?? item.vbLegalCourtEvent ?? 1;
                  const eventText = formatUnilingualText(
                    (item.LEGALCOURTEVENT && item.LEGALCOURTEVENT.trim()) ||
                      (item.legalCourtEvent && item.legalCourtEvent.trim()) ||
                      getCourtEventText(eventCode, language),
                    language
                  );

                  const court = item.COURTNAME || item.courtName || "—";
                  const hDate = item.HEARINGDATE || item.hearingDate;
                  const nDate = item.NEXTHEARINGDATE || item.nextHearingDate;
                  const attended = item.ATTENDEDBY || item.attendedBy || "—";
                  const details = item.HEARINGDETAILS || item.hearingDetails || "";

                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Hearing Reference */}
                      <td className="py-3 px-5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                          <Gavel className="w-3.5 h-3.5" />
                          {refNo}
                        </span>
                      </td>

                      {/* Court Event Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                            Number(eventCode) === 5
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : Number(eventCode) === 1
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                              : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                          }`}
                        >
                          {eventText}
                        </span>
                      </td>

                      {/* Court Name */}
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" title={court}>
                        {court}
                      </td>

                      {/* Hearing Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {hDate ? formatDateKSA(hDate) : "—"}
                      </td>

                      {/* Next Hearing Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {nDate ? formatDateKSA(nDate) : "—"}
                      </td>

                      {/* Attended By */}
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <User className="w-3 h-3 text-gray-400" />
                          {attended}
                        </span>
                      </td>

                      {/* Details with Hover Popover & Full Modal Preview */}
                      <td className="py-3 px-4">
                        <HoverDescriptionCell
                          text={details}
                          title="Hearing Session Details"
                          arabicTitle="تفاصيل وقائع الجلسة القضائية"
                          maxWidth="max-w-[210px]"
                          themeColor="cyan"
                          language={language}
                          onViewClick={() =>
                            setPreviewDescription({
                              refNo,
                              description: details,
                              event: eventText,
                              court,
                              attendedBy: attended,
                            })
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title={isAr ? "تعديل الجلسة" : "Edit Hearing"}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            title={isAr ? "حذف الجلسة" : "Delete Hearing"}
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

        {/* Pagination Controls (Max 10 per page default) */}
        {filteredHearings.length > 0 && (
          <TablePagination
            currentPage={page}
            totalItems={filteredHearings.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName={isAr ? "جلسات" : "hearings"}
            themeColor="indigo"
          />
        )}
      </div>

      {/* ====================================================================
       * MODAL: ADD / EDIT LEGAL COURT HEARING
       * ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-500" />

            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingItem
                      ? (isAr ? "تعديل الجلسة القضائية" : "Edit Court Hearing")
                      : (isAr ? "إضافة جلسة قضائية جديدة" : "Add Court Hearing")}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isAr ? `قضية #${boundCaseId}` : `Case #${boundCaseId}`} • CIF: {targetCifId} • Loan: {targetLoanId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit(handleSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hearing Reference */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "رقم محضر الجلسة *" : "Hearing Reference *"}
                  </label>
                  <input
                    type="text"
                    {...register("hearingReference", {
                      required: isAr ? "رقم محضر الجلسة مطلوب" : "Hearing Reference is required",
                      minLength: { value: 3, message: isAr ? "يجب ألا يقل عن 3 أحرف" : "Reference must be at least 3 characters" },
                    })}
                    placeholder={isAr ? "مثال: HRG-4501982" : "e.g. HRG-4501982"}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 ${
                      errors.hearingReference
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-sky-500/30"
                    }`}
                  />
                  {errors.hearingReference && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.hearingReference.message}</span>
                    </p>
                  )}
                </div>

                {/* Court Event */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "مرحلة ونوع الجلسة *" : "Court Event Stage *"}
                  </label>
                  <select
                    {...register("vbLegalCourtEvent", {
                      required: isAr ? "يرجى اختيار نوع ومرحلة الجلسة" : "Please select an Event Stage",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.vbLegalCourtEvent
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-sky-500/30"
                    }`}
                  >
                    <option value="">{isAr ? "اختر نوع الجلسة" : "Select Event Type"}</option>
                    {Object.entries(isAr ? COURT_EVENTS_AR : COURT_EVENTS).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalCourtEvent && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.vbLegalCourtEvent.message}</span>
                    </p>
                  )}
                </div>

                {/* Court Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "المحكمة والدائرة *" : "Court Name *"}
                  </label>
                  <input
                    type="text"
                    {...register("courtName", {
                      required: isAr ? "اسم المحكمة مطلوب" : "Court name is required",
                    })}
                    placeholder={isAr ? "مثال: المحكمة العامة بالرياض - الدائرة 3" : "e.g. General Court of Riyadh - Circuit 3"}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.courtName
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-sky-500/30"
                    }`}
                  />
                  {errors.courtName && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.courtName.message}</span>
                    </p>
                  )}
                </div>

                {/* Attended By */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "اسم الحاضر / الممثل القانوني *" : "Attended By *"}
                  </label>
                  <input
                    type="text"
                    {...register("attendedBy", {
                      required: isAr ? "اسم الحاضر مطلوب" : "Attended By / Counsel is required",
                    })}
                    placeholder={isAr ? "مثال: المحامي سعد الدوسري" : "e.g. Attorney Saad Al-Dosari"}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.attendedBy
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-sky-500/30"
                    }`}
                  />
                  {errors.attendedBy && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.attendedBy.message}</span>
                    </p>
                  )}
                </div>

                {/* Hearing Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "تاريخ انعقاد الجلسة *" : "Hearing Date *"}
                  </label>
                  <input
                    type="date"
                    {...register("hearingDate", {
                      required: isAr ? "تاريخ انعقاد الجلسة مطلوب" : "Hearing date is required",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.hearingDate
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-sky-500/30"
                    }`}
                  />
                  {errors.hearingDate && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.hearingDate.message}</span>
                    </p>
                  )}
                </div>

                {/* Next Hearing Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "موعد الجلسة القادمة *" : "Next Hearing Date *"}
                  </label>
                  <input
                    type="date"
                    {...register("nextHearingDate", {
                      required: isAr ? "موعد الجلسة القادمة مطلوب" : "Next hearing date is required",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.nextHearingDate
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-sky-500/30"
                    }`}
                  />
                  {errors.nextHearingDate && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.nextHearingDate.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Hearing Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isAr ? "محضر ووقائع الجلسة وقرارات الدائرة *" : "Hearing Minutes & Outcome Notes *"}
                </label>
                <textarea
                  rows={3}
                  {...register("hearingDetails", {
                    required: isAr ? "تفاصيل ووقائع الجلسة مطلوبة" : "Hearing minutes/details are required",
                    minLength: { value: 5, message: isAr ? "يجب ألا يقل المحضر عن 5 أحرف" : "Minutes must be at least 5 characters" },
                  })}
                  placeholder={
                    isAr
                      ? "أدخل وقائع الجلسة، الطلبات القضائية، والقرارات الصادرة..."
                      : "Enter minutes of the hearing session, judicial requests, or deferred tasks..."
                  }
                  className={`w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 resize-none ${
                    errors.hearingDetails
                      ? "border-rose-500 focus:ring-rose-500/30"
                      : "border-gray-200 dark:border-gray-700 focus:ring-sky-500/30"
                  }`}
                />
                {errors.hearingDetails && (
                  <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.hearingDetails.message}</span>
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-5 rounded-xl border-gray-200 dark:border-gray-700 text-xs font-semibold cursor-pointer"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSubmitting
                      ? (isAr ? "جاري الحفظ..." : "Saving...")
                      : editingItem
                      ? (isAr ? "حفظ التعديلات" : "Update Hearing")
                      : (isAr ? "تسجيل الجلسة" : "Save Hearing")}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
       * REUSABLE DELETE CONFIRMATION MODAL
       * ==================================================================== */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, item: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title={isAr ? "حذف الجلسة القضائية" : "Delete Court Hearing"}
        description={
          isAr
            ? "هل أنت متأكد من رغبتك في حذف محضر هذه الجلسة القضائية؟ سيؤدي ذلك إلى إزالتها نهائياً من ملف القضية."
            : "Are you sure you want to delete this court hearing record? This will permanently remove the hearing minutes and scheduling from the legal case."
        }
        itemName={
          isAr
            ? `جلسة #${deleteModalState.item?.HEARINGREFERENCE || deleteModalState.item?.hearingReference || deleteModalState.item?.TLCHRECID || deleteModalState.item?.tlchRecId || ""}`
            : `Hearing #${deleteModalState.item?.HEARINGREFERENCE || deleteModalState.item?.hearingReference || deleteModalState.item?.TLCHRECID || deleteModalState.item?.tlchRecId || ""}`
        }
        confirmText={isAr ? "حذف الجلسة" : "Delete Hearing"}
        isLoading={deleteModalState.isLoading}
      />

      {/* ====================================================================
       * FULL DESCRIPTION PREVIEW MODAL
       * ==================================================================== */}
      {previewDescription && (
        <DescriptionPreviewModal
          isOpen={true}
          onClose={() => setPreviewDescription(null)}
          title="Court Hearing Minutes Preview"
          arabicTitle="محضر وقائع الجلسة القضائية"
          referenceNo={previewDescription.refNo}
          description={previewDescription.description}
          language={language}
          metadata={[
            ...(previewDescription.event ? [{ label: isAr ? "نوع الجلسة" : "Hearing Event", value: previewDescription.event }] : []),
            ...(previewDescription.court ? [{ label: isAr ? "المحكمة" : "Court", value: previewDescription.court }] : []),
            ...(previewDescription.attendedBy ? [{ label: isAr ? "الحاضر" : "Attended By", value: previewDescription.attendedBy }] : []),
          ]}
          themeColor="cyan"
        />
      )}
    </div>
  );
};
