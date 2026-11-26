"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  FileCheck2,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  Calendar,
  Building,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  LegalCourtDecisionRecord,
  AddLegalCourtDecisionPayload,
  getLegalCourtDecision,
  addLegalCourtDecision,
  updateLegalCourtDecision,
  deleteLegalCourtDecision,
  DECISION_TYPES,
  DECISION_TYPES_AR,
  DECISION_RESULTS,
  DECISION_RESULTS_AR,
  getDecisionTypeText,
  getDecisionResultText,
  formatUnilingualText,
} from "../HandlingAPIs";

interface DecisionTabProps {
  legalCase?: LegalCaseRecord | null;
  cifId?: number | string;
  loanId?: number | string;
  language?: number;
}

const EMPTY_DECISION_FORM = {
  tlchRecId: 0 as number,
  decisionReference: "",
  vbLegalDecisionType: "" as string | number,
  courtName: "",
  decisionDate: "",
  vbLegalDecisionResult: "" as string | number,
  appealAllowed: false,
  appealExpireDate: "",
  decisionDetails: "",
};

export const DecisionTab: React.FC<DecisionTabProps> = ({
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
  const [decisions, setDecisions] = useState<LegalCourtDecisionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");

  // Pagination state (10 per page default)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<LegalCourtDecisionRecord | null>(null);

  // React Hook Form with live validation
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: EMPTY_DECISION_FORM,
    mode: "onChange",
  });

  const appealAllowedValue = watch("appealAllowed");

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    item: LegalCourtDecisionRecord | null;
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
    type?: string;
    court?: string;
    result?: string;
    appeal?: string;
  } | null>(null);

  // Fetch decisions from API
  const fetchDecisions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLegalCourtDecision({
        TllcRecId: boundCaseId,
        CifId: targetCifId,
        LoanId: targetLoanId,
        Language: language,
      });

      if (Array.isArray(data)) {
        setDecisions(data);
      } else {
        setDecisions([]);
      }
    } catch (err: any) {
      console.error("Error loading decisions:", err);
      toast.error("Failed to load judicial decisions");
    } finally {
      setLoading(false);
    }
  }, [boundCaseId, targetCifId, targetLoanId, language]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({ ...EMPTY_DECISION_FORM });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: LegalCourtDecisionRecord) => {
    setEditingItem(item);
    const dDate = item.DECISIONDATE || item.decisionDate || "";
    const aDate = item.APPEALEXPIREDATE || item.appealExpireDate || "";

    reset({
      tlchRecId: Number(item.TLCHRECID ?? item.tlchRecId ?? 0),
      decisionReference: item.DECISIONREFERENCE || item.decisionReference || "",
      vbLegalDecisionType: item.VB_LEGALDECISIONTYPE ?? item.vbLegalDecisionType ?? "",
      courtName: item.COURTNAME || item.courtName || "",
      decisionDate: dDate ? dDate.split("T")[0] : "",
      vbLegalDecisionResult: item.VB_LEGALDECISIONRESULT ?? item.vbLegalDecisionResult ?? "",
      appealAllowed: Boolean(item.APPEALALLOWED ?? item.appealAllowed ?? false),
      appealExpireDate: aDate ? aDate.split("T")[0] : "",
      decisionDetails: item.DECISIONDETAILS || item.decisionDetails || "",
    });
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (formData: typeof EMPTY_DECISION_FORM) => {
    const currentUser = getLoggedInUser();
    const nowIso = new Date().toISOString();

    const payload: AddLegalCourtDecisionPayload = {
      tlchRecId: Number(formData.tlchRecId) || 0,
      tllcRecId: Number(boundCaseId) || 1,
      cifId: Number(targetCifId) || 0,
      loanId: Number(targetLoanId) || 0,
      decisionReference: formData.decisionReference.trim(),
      vbLegalDecisionType: formData.vbLegalDecisionType !== "" ? Number(formData.vbLegalDecisionType) : 1,
      courtName: formData.courtName.trim(),
      decisionDate: formData.decisionDate ? `${formData.decisionDate}T00:00:00.000Z` : nowIso,
      decisionDetails: formData.decisionDetails.trim(),
      vbLegalDecisionResult: formData.vbLegalDecisionResult !== "" ? Number(formData.vbLegalDecisionResult) : 1,
      appealAllowed: Boolean(formData.appealAllowed),
      appealExpireDate: formData.appealExpireDate ? `${formData.appealExpireDate}T00:00:00.000Z` : nowIso,
      updateDate: nowIso,
      updateBy: currentUser,
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const id = editingItem.TLCDRECID ?? editingItem.tlcdRecId ?? editingItem.id;
        if (!id) {
          toast.error("Decision ID not found for update");
          setIsSubmitting(false);
          return;
        }

        const res = await updateLegalCourtDecision(id, payload);
        if (res.success) {
          toast.success(res.message || "Court Decision updated successfully");
          // Instant direct table update
          setDecisions((prev) =>
            prev.map((d) =>
              (d.TLCDRECID ?? d.tlcdRecId ?? d.id) === id
                ? { ...d, ...payload, TLCDRECID: id, tlcdRecId: id }
                : d
            )
          );
          setIsModalOpen(false);
          fetchDecisions();
        } else {
          toast.error(res.message || "Failed to update Court Decision");
        }
      } else {
        const res = await addLegalCourtDecision(payload);
        if (res.success) {
          toast.success(res.message || "Court Decision added successfully");
          const createdId =
            res.data?.TLCDRECID ??
            res.data?.tlcdRecId ??
            res.data?.id ??
            Math.max(0, ...decisions.map((d) => Number(d.TLCDRECID ?? d.tlcdRecId ?? d.id ?? 0))) + 1;

          const newItem: LegalCourtDecisionRecord = {
            ...payload,
            TLCDRECID: createdId,
            tlcdRecId: createdId,
            id: createdId,
          };
          // Instant direct table update
          setDecisions((prev) => [newItem, ...prev]);
          setIsModalOpen(false);
          fetchDecisions();
        } else {
          toast.error(res.message || "Failed to register Court Decision");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred while saving decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (item: LegalCourtDecisionRecord) => {
    setDeleteModalState({
      isOpen: true,
      item,
      isLoading: false,
    });
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalState.item) return;
    const id = deleteModalState.item.TLCDRECID ?? deleteModalState.item.tlcdRecId ?? deleteModalState.item.id;
    if (!id) {
      toast.error("Decision ID not found");
      return;
    }

    const currentUser = getLoggedInUser();
    try {
      setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
      const res = await deleteLegalCourtDecision(id, currentUser);
      if (res.success) {
        toast.success(res.message || "Court Decision deleted successfully");
        // Instant direct table update
        setDecisions((prev) =>
          prev.filter((d) => (d.TLCDRECID ?? d.tlcdRecId ?? d.id) !== id)
        );
        setDeleteModalState({ isOpen: false, item: null, isLoading: false });
        fetchDecisions();
      } else {
        toast.error(res.message || "Failed to delete Court Decision");
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      toast.error(err?.message || "Error deleting decision");
      setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Filtered decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      const ref = d.DECISIONREFERENCE || d.decisionReference || "";
      const court = d.COURTNAME || d.courtName || "";
      const details = d.DECISIONDETAILS || d.decisionDetails || "";
      const typeCode = String(d.VB_LEGALDECISIONTYPE ?? d.vbLegalDecisionType ?? "");
      const resultCode = String(d.VB_LEGALDECISIONRESULT ?? d.vbLegalDecisionResult ?? "");

      const matchesSearch =
        ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        court.toLowerCase().includes(searchQuery.toLowerCase()) ||
        details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || typeCode === typeFilter;
      const matchesResult = resultFilter === "all" || resultCode === resultFilter;

      return matchesSearch && matchesType && matchesResult;
    });
  }, [decisions, searchQuery, typeFilter, resultFilter]);

  // Paginated decisions (max 10 per page default)
  const paginatedDecisions = useMemo(() => {
    return filteredDecisions.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredDecisions, page, pageSize]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Decisions */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Decisions</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {decisions.length}
              </h4>
              <p className="text-[10px] text-teal-500 font-medium mt-0.5">Judicial Verdicts</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Final Judgments */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Final Judgments</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {decisions.filter((d) => Number(d.VB_LEGALDECISIONTYPE ?? d.vbLegalDecisionType) === 1).length}
              </h4>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Enforceable Deeds</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Appeal Period Active */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Appeal Status</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {decisions.filter((d) => Boolean(d.APPEALALLOWED ?? d.appealAllowed)).length} Active
              </h4>
              <p className="text-[10px] text-amber-500 font-medium mt-0.5">Under 30-Day Window</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Issuing Court */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Issuing Court</p>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate max-w-[140px]">
                {decisions[0]?.COURTNAME || decisions[0]?.courtName || "General Court"}
              </h4>
              <p className="text-[10px] text-sky-500 font-medium mt-0.5">Riyadh Jurisdiction</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Building className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Decision Table Container */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />

        {/* Header & Controls Bar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isAr ? "الأحكام والقرارات القضائية" : "Judicial Decisions & Rulings"}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/20 whitespace-nowrap">
                  {isAr ? `قضية رقم #${boundCaseId}` : `Legal Case #${boundCaseId}`}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAr
                  ? "مراجعة الأحكام الصادرة، إثبات المديونية، إتاحة الاستئناف، والسندات واجبة النفاذ"
                  : "Review formal court verdicts, liability pronouncements, statutory appeals, and enforceable deeds"}
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
                placeholder={isAr ? "البحث في الأحكام..." : "Search decision..."}
                className="h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-36 sm:w-44"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">{isAr ? "جميع الأنواع" : "All Types"}</option>
              {Object.entries(isAr ? DECISION_TYPES_AR : DECISION_TYPES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {/* Result Filter */}
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">{isAr ? "جميع النتائج" : "All Results"}</option>
              {Object.entries(isAr ? DECISION_RESULTS_AR : DECISION_RESULTS).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchDecisions}
              title={isAr ? "تحديث الأحكام" : "Refresh decisions"}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Add Decision Button - Right Aligned */}
            <Button
              onClick={handleOpenAdd}
              className="h-9 px-4 shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto"
            >
              <Plus className="w-4 h-4" />
              {isAr ? "إضافة حكم / قرار" : "Add Decision"}
            </Button>
          </div>
        </div>

        {/* Dynamic-Height Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-5">{isAr ? "رقم الحكم / القرار" : "Decision Ref"}</th>
                <th className="py-3 px-4 min-w-[180px]">{isAr ? "نوع الحكم" : "Ruling Type"}</th>
                <th className="py-3 px-4">{isAr ? "المحكمة والدائرة" : "Court Name"}</th>
                <th className="py-3 px-4">{isAr ? "تاريخ الحكم" : "Decision Date"}</th>
                <th className="py-3 px-4">{isAr ? "منطوق ونتيجة الحكم" : "Judicial Result"}</th>
                <th className="py-3 px-4 text-center">{isAr ? "قابل للاستئناف" : "Appeal Allowed"}</th>
                <th className="py-3 px-4">{isAr ? "انتهاء مهلة الاستئناف" : "Appeal Expiry"}</th>
                <th className="py-3 px-4 min-w-[200px] max-w-[260px]">{isAr ? "أسباب ومنطوق الحكم" : "Ruling Details"}</th>
                <th className="py-3 px-5 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredDecisions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {isAr ? "لا توجد أحكام أو قرارات قضائية" : "No Judicial Decisions Found"}
                      </span>
                      <p className="text-xs max-w-sm text-gray-500">
                        {isAr
                          ? "لم يتم تسجيل أي أحكام أو قرارات قضائية صادرة على هذه القضية بعد."
                          : "There are currently no formal court decisions or verdicts registered for this legal case."}
                      </p>
                      <Button
                        onClick={handleOpenAdd}
                        className="mt-2 h-8 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {isAr ? "إضافة أول حكم" : "Add Decision"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDecisions.map((item, idx) => {
                  const id = item.TLCDRECID ?? item.tlcdRecId ?? item.id ?? idx + 1;
                  const refNo = item.DECISIONREFERENCE || item.decisionReference || `DEC-${id}`;
                  const typeCode = item.VB_LEGALDECISIONTYPE ?? item.vbLegalDecisionType ?? 1;
                  const typeText = formatUnilingualText(
                    (item.LEGALDECISIONTYPE && item.LEGALDECISIONTYPE.trim()) ||
                    (item.legalDecisionType && item.legalDecisionType.trim()) ||
                    getDecisionTypeText(typeCode, language),
                    language
                  );

                  const court = item.COURTNAME || item.courtName || "—";
                  const dDate = item.DECISIONDATE || item.decisionDate;
                  const aDate = item.APPEALEXPIREDATE || item.appealExpireDate;
                  const isAppeal = Boolean(item.APPEALALLOWED ?? item.appealAllowed);
                  const details = item.DECISIONDETAILS || item.decisionDetails || "";

                  const resultCode = item.VB_LEGALDECISIONRESULT ?? item.vbLegalDecisionResult ?? 1;
                  const resultText = formatUnilingualText(
                    (item.LEGALDECISIONRESULT && item.LEGALDECISIONRESULT.trim()) ||
                    (item.legalDecisionResult && item.legalDecisionResult.trim()) ||
                    getDecisionResultText(resultCode, language),
                    language
                  );

                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Decision Reference */}
                      <td className="py-3 px-5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          {refNo}
                        </span>
                      </td>

                      {/* Decision Type Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                            Number(typeCode) === 1
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                          }`}
                        >
                          {typeText}
                        </span>
                      </td>

                      {/* Court Name */}
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" title={court}>
                        {court}
                      </td>

                      {/* Decision Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {dDate ? formatDateKSA(dDate) : "—"}
                      </td>

                      {/* Judicial Result Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            Number(resultCode) === 1
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : Number(resultCode) === 3
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {resultText}
                        </span>
                      </td>

                      {/* Appeal Allowed */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            isAppeal
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {isAppeal ? (isAr ? "متاح" : "Yes") : (isAr ? "نهائي" : "No")}
                        </span>
                      </td>

                      {/* Appeal Expiry */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {isAppeal && aDate ? formatDateKSA(aDate) : "—"}
                      </td>

                      {/* Details with Hover Popover & Full Modal Preview */}
                      <td className="py-3 px-4">
                        <HoverDescriptionCell
                          text={details}
                          title="Decision Ruling Details"
                          arabicTitle="تفاصيل ومنطوق الحكم القضائي"
                          maxWidth="max-w-[210px]"
                          themeColor="emerald"
                          language={language}
                          onViewClick={() =>
                            setPreviewDescription({
                              refNo,
                              description: details,
                              type: typeText,
                              court,
                              result: resultText,
                              appeal: isAppeal ? (isAr ? "متاح للاستئناف" : "Appeal Allowed") : (isAr ? "حكم نهائي" : "Final Ruling"),
                            })
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Decision"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            title="Delete Decision"
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
        {filteredDecisions.length > 0 && (
          <TablePagination
            currentPage={page}
            totalItems={filteredDecisions.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="decisions"
            themeColor="emerald"
          />
        )}
      </div>

      {/* ====================================================================
       * MODAL: ADD / EDIT LEGAL COURT DECISION
       * ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />

            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingItem
                      ? (isAr ? "تعديل الحكم القضائي" : "Edit Court Decision")
                      : (isAr ? "إضافة حكم / قرار قضائي" : "Add Court Decision")}
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
                {/* Decision Reference */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "رقم الحكم / القرار القضائي *" : "Decision Reference *"}
                  </label>
                  <input
                    type="text"
                    {...register("decisionReference", {
                      required: isAr ? "رقم الحكم القضائي مطلوب" : "Decision Reference is required",
                      minLength: { value: 3, message: isAr ? "يجب ألا يقل عن 3 أحرف" : "Reference must be at least 3 characters" },
                    })}
                    placeholder="e.g. JUD-4501982/2026"
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 ${
                      errors.decisionReference
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                    }`}
                  />
                  {errors.decisionReference && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.decisionReference.message as string}
                    </p>
                  )}
                </div>

                {/* Decision Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "نوع الحكم / القرار *" : "Decision Type *"}
                  </label>
                  <select
                    {...register("vbLegalDecisionType", {
                      required: isAr ? "يرجى اختيار نوع الحكم" : "Please select a decision type",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.vbLegalDecisionType
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                    }`}
                  >
                    <option value="">{isAr ? "اختر نوع الحكم" : "Select Decision Type"}</option>
                    {Object.entries(isAr ? DECISION_TYPES_AR : DECISION_TYPES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalDecisionType && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.vbLegalDecisionType.message as string}
                    </p>
                  )}
                </div>

                {/* Court Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "المحكمة والدائرة المصدرة *" : "Issuing Court *"}
                  </label>
                  <input
                    type="text"
                    {...register("courtName", {
                      required: isAr ? "اسم المحكمة مطلوب" : "Issuing Court name is required",
                      minLength: { value: 2, message: isAr ? "اسم المحكمة قصير جداً" : "Court name is too short" },
                    })}
                    placeholder={isAr ? "مثال: المحكمة العامة بالرياض - الدائرة التجارية الثالثة" : "e.g. General Court of Riyadh - Commercial Circuit 3"}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.courtName
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                    }`}
                  />
                  {errors.courtName && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.courtName.message as string}
                    </p>
                  )}
                </div>

                {/* Decision Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "تاريخ صدور الحكم *" : "Decision Date *"}
                  </label>
                  <input
                    type="date"
                    {...register("decisionDate", {
                      required: isAr ? "تاريخ الحكم مطلوب" : "Decision date is required",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.decisionDate
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                    }`}
                  />
                  {errors.decisionDate && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.decisionDate.message as string}
                    </p>
                  )}
                </div>

                {/* Decision Result */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "منطوق ونتيجة الحكم *" : "Judicial Result *"}
                  </label>
                  <select
                    {...register("vbLegalDecisionResult", {
                      required: isAr ? "يرجى اختيار نتيجة الحكم" : "Please select a ruling result",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.vbLegalDecisionResult
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                    }`}
                  >
                    <option value="">{isAr ? "اختر نتيجة الحكم" : "Select Ruling Result"}</option>
                    {Object.entries(isAr ? DECISION_RESULTS_AR : DECISION_RESULTS).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalDecisionResult && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.vbLegalDecisionResult.message as string}
                    </p>
                  )}
                </div>

                {/* Appeal Expire Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "تاريخ انتهاء مهلة الاستئناف" : "Appeal Expiry Date"}
                  </label>
                  <input
                    type="date"
                    disabled={!appealAllowedValue}
                    {...register("appealExpireDate")}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Appeal Allowed Switch via Controller */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white block">
                    {isAr ? "قابل للاستئناف والطعن" : "Appeal Allowed"}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {isAr ? "تفعيل الخيار في حال كان الحكم خاضعاً لمهلة الاستئناف النظامية (30 يوماً)" : "Enable if verdict is subject to 30-day appellate review"}
                  </span>
                </div>
                <Controller
                  control={control}
                  name="appealAllowed"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Decision Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isAr ? "أسباب ومنطوق الحكم القضائي *" : "Decision Ruling Details / Summary *"}
                </label>
                <textarea
                  rows={3}
                  {...register("decisionDetails", {
                    required: isAr ? "أسباب ومنطوق الحكم مطلوبة" : "Decision ruling details or grounds are required",
                    minLength: { value: 5, message: isAr ? "يجب ألا يقل النص عن 5 أحرف" : "Details must be at least 5 characters" },
                  })}
                  placeholder={
                    isAr
                      ? "أدخل منطوق الحكم، الأسباب القضائية، أو تعليمات التنفيذ الصادرة..."
                      : "Enter operative words of the judgment, legal grounds, or execution instructions..."
                  }
                  className={`w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 resize-none ${
                    errors.decisionDetails
                      ? "border-rose-500 focus:ring-rose-500/30"
                      : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                  }`}
                />
                {errors.decisionDetails && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.decisionDetails.message as string}
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
                  className="h-10 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSubmitting
                      ? (isAr ? "جاري الحفظ..." : "Saving...")
                      : editingItem
                      ? (isAr ? "حفظ التعديلات" : "Update Decision")
                      : (isAr ? "إضافة الحكم" : "Save Decision")}
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
        title={isAr ? "حذف الحكم القضائي" : "Delete Court Decision"}
        description={
          isAr
            ? "هل أنت متأكد من رغبتك في حذف هذا الحكم القضائي؟ سيؤدي ذلك إلى حذف صك الحكم وتفاصيل النفاذ نهائياً."
            : "Are you sure you want to delete this judicial decision? This will permanently remove the court verdict and enforceability details from the legal case."
        }
        itemName={`Decision #${deleteModalState.item?.DECISIONREFERENCE || deleteModalState.item?.decisionReference || deleteModalState.item?.TLCDRECID || deleteModalState.item?.tlcdRecId || ""}`}
        confirmText={isAr ? "حذف الحكم" : "Delete Decision"}
        isLoading={deleteModalState.isLoading}
      />

      {/* ====================================================================
       * FULL DESCRIPTION PREVIEW MODAL
       * ==================================================================== */}
      {previewDescription && (
        <DescriptionPreviewModal
          isOpen={true}
          onClose={() => setPreviewDescription(null)}
          title="Judicial Decision Ruling Preview"
          arabicTitle="منطوق وأسباب الحكم القضائي"
          language={language}
          referenceNo={previewDescription.refNo}
          description={previewDescription.description}
          metadata={[
            ...(previewDescription.type ? [{ label: isAr ? "نوع الحكم" : "Decision Type", value: previewDescription.type }] : []),
            ...(previewDescription.court ? [{ label: isAr ? "المحكمة" : "Court", value: previewDescription.court }] : []),
            ...(previewDescription.result ? [{ label: isAr ? "منطوق الحكم" : "Ruling Result", value: previewDescription.result }] : []),
            ...(previewDescription.appeal ? [{ label: isAr ? "حالة الاستئناف" : "Appeal Status", value: previewDescription.appeal }] : []),
          ]}
          themeColor="emerald"
        />
      )}
    </div>
  );
};
