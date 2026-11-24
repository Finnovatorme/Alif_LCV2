"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  ShieldAlert,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  Scale,
  Calendar,
  Building,
  DollarSign,
  Gavel,
  ShieldCheck,
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
  LegalCaseEnforcementRecord,
  AddLegalCaseEnforcementPayload,
  getLegalCaseEnforcement,
  addLegalCaseEnforcement,
  updateLegalCaseEnforcement,
  deleteLegalCaseEnforcement,
  ENFORCEMENT_TYPES,
  ENFORCEMENT_TYPES_AR,
  ENFORCEMENT_ACTIONS,
  ENFORCEMENT_ACTIONS_AR,
  getEnforcementTypeText,
  getEnforcementActionText,
  formatUnilingualText,
} from "../HandlingAPIs";

interface EnforcementTabProps {
  legalCase?: LegalCaseRecord | null;
  cifId?: number | string;
  loanId?: number | string;
  language?: number;
}

const EMPTY_ENFORCEMENT_FORM = {
  enforcementReference: "",
  vbLegalEnforcementType: "" as string | number,
  courtName: "",
  enforcedAmount: "" as string | number,
  enforcementDate: "",
  effectiveDate: "",
  deadlineDate: "",
  vbLegalEnforcementAction: "" as string | number,
  enforcementDetails: "",
};

export const EnforcementTab: React.FC<EnforcementTabProps> = ({
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
  const [enforcements, setEnforcements] = useState<LegalCaseEnforcementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  // Pagination state (10 per page default)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<LegalCaseEnforcementRecord | null>(null);

  // React Hook Form with live validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: EMPTY_ENFORCEMENT_FORM,
    mode: "onChange",
  });

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    item: LegalCaseEnforcementRecord | null;
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
    amount?: string | number;
  } | null>(null);

  // Fetch enforcements from API
  const fetchEnforcements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLegalCaseEnforcement({
        TllcRecId: boundCaseId,
        CifId: targetCifId,
        LoanId: targetLoanId,
        Language: language,
      });

      if (Array.isArray(data)) {
        setEnforcements(data);
      } else {
        setEnforcements([]);
      }
    } catch (err: any) {
      console.error("Error loading enforcements:", err);
      toast.error("Failed to load judicial enforcements");
    } finally {
      setLoading(false);
    }
  }, [boundCaseId, targetCifId, targetLoanId, language]);

  useEffect(() => {
    fetchEnforcements();
  }, [fetchEnforcements]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    reset(EMPTY_ENFORCEMENT_FORM);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: LegalCaseEnforcementRecord) => {
    setEditingItem(item);
    const enfDate = item.ENFORCEMENTDATE || item.enforcementDate || "";
    const effDate = item.EFFECTIVEDATE || item.effectiveDate || "";
    const deadDate = item.DEADLINEDATE || item.deadlineDate || "";

    reset({
      enforcementReference: item.ENFORCEMENTREFERENCE || item.enforcementReference || "",
      vbLegalEnforcementType: String(item.VB_LEGALENFORCEMENTTYPE ?? item.vbLegalEnforcementType ?? ""),
      courtName: item.COURTNAME || item.courtName || "",
      enforcedAmount: item.ENFORCEDAMOUNT ?? item.enforcedAmount ?? "",
      enforcementDate: enfDate ? enfDate.split("T")[0] : "",
      effectiveDate: effDate ? effDate.split("T")[0] : "",
      deadlineDate: deadDate ? deadDate.split("T")[0] : "",
      vbLegalEnforcementAction: String(item.VB_LEGALENFORCEMENTACTION ?? item.vbLegalEnforcementAction ?? ""),
      enforcementDetails: item.ENFORCEMENTDETAILS || item.enforcementDetails || "",
    });
    setIsModalOpen(true);
  };

  // Submit Add / Edit using React Hook Form validated values
  const handleSubmitForm = async (values: typeof EMPTY_ENFORCEMENT_FORM) => {
    const currentUser = getLoggedInUser();
    const nowIso = new Date().toISOString();

    const payload: AddLegalCaseEnforcementPayload = {
      tllcRecId: Number(boundCaseId) || 1,
      cifId: Number(targetCifId) || 0,
      loanId: Number(targetLoanId) || 0,
      enforcementReference: values.enforcementReference.trim(),
      vbLegalEnforcementType: Number(values.vbLegalEnforcementType) || 1,
      courtName: values.courtName.trim(),
      enforcedAmount: values.enforcedAmount !== "" ? Number(values.enforcedAmount) : 0,
      enforcementDate: values.enforcementDate ? `${values.enforcementDate}T00:00:00.000Z` : nowIso,
      effectiveDate: values.effectiveDate ? `${values.effectiveDate}T00:00:00.000Z` : nowIso,
      deadlineDate: values.deadlineDate ? `${values.deadlineDate}T00:00:00.000Z` : nowIso,
      vbLegalEnforcementAction: Number(values.vbLegalEnforcementAction) || 1,
      enforcementDetails: values.enforcementDetails.trim(),
      updateDate: nowIso,
      updateBy: currentUser,
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const id = editingItem.TLCERECID ?? editingItem.tlceRecId ?? editingItem.id;
        if (!id) {
          toast.error("Enforcement ID not found for update");
          setIsSubmitting(false);
          return;
        }

        const res = await updateLegalCaseEnforcement(id, payload);
        if (res.success) {
          toast.success(res.message || "Legal Enforcement updated successfully");
          // Instant direct table update
          setEnforcements((prev) =>
            prev.map((e) =>
              (e.TLCERECID ?? e.tlceRecId ?? e.id) === id
                ? { ...e, ...payload, TLCERECID: id, tlceRecId: id }
                : e
            )
          );
          setIsModalOpen(false);
          fetchEnforcements();
        } else {
          toast.error(res.message || "Failed to update Legal Enforcement");
        }
      } else {
        const res = await addLegalCaseEnforcement(payload);
        if (res.success) {
          toast.success(res.message || "Legal Enforcement registered successfully");
          const createdId =
            res.data?.TLCERECID ??
            res.data?.tlceRecId ??
            res.data?.id ??
            Math.max(0, ...enforcements.map((e) => Number(e.TLCERECID ?? e.tlceRecId ?? e.id ?? 0))) + 1;

          const newItem: LegalCaseEnforcementRecord = {
            ...payload,
            TLCERECID: createdId,
            tlceRecId: createdId,
            id: createdId,
          };
          // Instant direct table update
          setEnforcements((prev) => [newItem, ...prev]);
          setIsModalOpen(false);
          fetchEnforcements();
        } else {
          toast.error(res.message || "Failed to register Legal Enforcement");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred while saving enforcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (item: LegalCaseEnforcementRecord) => {
    setDeleteModalState({
      isOpen: true,
      item,
      isLoading: false,
    });
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalState.item) return;
    const id = deleteModalState.item.TLCERECID ?? deleteModalState.item.tlceRecId ?? deleteModalState.item.id;
    if (!id) {
      toast.error("Enforcement ID not found");
      return;
    }

    const currentUser = getLoggedInUser();
    try {
      setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
      const res = await deleteLegalCaseEnforcement(id, currentUser);
      if (res.success) {
        toast.success(res.message || "Legal Enforcement deleted successfully");
        // Instant direct table update
        setEnforcements((prev) =>
          prev.filter((e) => (e.TLCERECID ?? e.tlceRecId ?? e.id) !== id)
        );
        setDeleteModalState({ isOpen: false, item: null, isLoading: false });
        fetchEnforcements();
      } else {
        toast.error(res.message || "Failed to delete Legal Enforcement");
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      toast.error(err?.message || "Error deleting enforcement");
      setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Filtered enforcements
  const filteredEnforcements = useMemo(() => {
    return enforcements.filter((e) => {
      const ref = e.ENFORCEMENTREFERENCE || e.enforcementReference || "";
      const court = e.COURTNAME || e.courtName || "";
      const details = e.ENFORCEMENTDETAILS || e.enforcementDetails || "";
      const typeCode = String(e.VB_LEGALENFORCEMENTTYPE ?? e.vbLegalEnforcementType ?? "");
      const actionCode = String(e.VB_LEGALENFORCEMENTACTION ?? e.vbLegalEnforcementAction ?? "");

      const matchesSearch =
        ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        court.toLowerCase().includes(searchQuery.toLowerCase()) ||
        details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || typeCode === typeFilter;
      const matchesAction = actionFilter === "all" || actionCode === actionFilter;

      return matchesSearch && matchesType && matchesAction;
    });
  }, [enforcements, searchQuery, typeFilter, actionFilter]);

  // Paginated enforcements (max 10 per page default)
  const paginatedEnforcements = useMemo(() => {
    return filteredEnforcements.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredEnforcements, page, pageSize]);

  // Key KPI stats
  const totalEnforcedSum = useMemo(() => {
    return enforcements.reduce((acc, curr) => {
      const amt = Number(curr.ENFORCEDAMOUNT ?? curr.enforcedAmount ?? 0);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [enforcements]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header KPI Cards matching Najiz & Legal theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enforcements */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Enforcements</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {enforcements.length}
              </h4>
              <p className="text-[10px] text-indigo-500 font-medium mt-0.5">Execution Claims</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Gavel className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Enforced Sum */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Enforced Amount</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
                SAR {totalEnforcedSum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h4>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Under Judicial Recovery</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Active Sanctions */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Article 46 Sanctions</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {enforcements.filter((e) => Number(e.VB_LEGALENFORCEMENTTYPE ?? e.vbLegalEnforcementType) === 2).length} Active
              </h4>
              <p className="text-[10px] text-rose-500 font-medium mt-0.5">Asset & Travel Freezes</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Court Jurisdiction */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "جهة التنفيذ القضائي" : "Enforcement Authority"}
              </p>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate max-w-[140px]">
                {isAr ? "محكمة التنفيذ" : "Enforcement Court"}
              </h4>
              <p className="text-[10px] text-cyan-500 font-medium mt-0.5">
                {isAr ? "محاكم التنفيذ السعودية" : "Saudi Execution Courts"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <Building className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Enforcement Table Container */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        {/* Header & Controls Bar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isAr ? "تنفيذ الأحكام القضائية" : "Judicial Enforcements"}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20 whitespace-nowrap">
                  {isAr ? `قضية رقم #${boundCaseId}` : `Legal Case #${boundCaseId}`}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAr
                  ? "طلبات تنفيذ المادة 34، قرارات تجميد الأصول للمادة 46، وأوامر الاسترداد القضائية"
                  : "Article 34 execution demands, Article 46 asset freezes, and statutory court recovery orders"}
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
                placeholder={isAr ? "البحث في أوامر التنفيذ..." : "Search enforcement..."}
                className="h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-36 sm:w-44"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">{isAr ? "جميع الأنواع" : "All Types"}</option>
              {Object.entries(isAr ? ENFORCEMENT_TYPES_AR : ENFORCEMENT_TYPES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">{isAr ? "جميع الإجراءات" : "All Actions"}</option>
              {Object.entries(isAr ? ENFORCEMENT_ACTIONS_AR : ENFORCEMENT_ACTIONS).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchEnforcements}
              title={isAr ? "تحديث أوامر التنفيذ" : "Refresh enforcements"}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Add Enforcement Button - Right Aligned */}
            <Button
              onClick={handleOpenAdd}
              className="h-9 px-4 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto"
            >
              <Plus className="w-4 h-4" />
              {isAr ? "إضافة أمر تنفيذ" : "Add Enforcement"}
            </Button>
          </div>
        </div>

        {/* Dynamic-Height Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-5">{isAr ? "رقم أمر التنفيذ" : "Enforcement Ref"}</th>
                <th className="py-3 px-4 min-w-[200px]">{isAr ? "نوع التنفيذ" : "Enforcement Type"}</th>
                <th className="py-3 px-4">{isAr ? "المحكمة" : "Court Name"}</th>
                <th className="py-3 px-4">{isAr ? "مبلغ التنفيذ" : "Enforced Amount"}</th>
                <th className="py-3 px-4">{isAr ? "تاريخ الأمر" : "Order Date"}</th>
                <th className="py-3 px-4">{isAr ? "تاريخ السريان" : "Effective Date"}</th>
                <th className="py-3 px-4">{isAr ? "مهلة السداد" : "Deadline Date"}</th>
                <th className="py-3 px-4 min-w-[200px] max-w-[260px]">{isAr ? "التفاصيل" : "Details"}</th>
                <th className="py-3 px-4">{isAr ? "الإجراء المنفذ" : "Action Enforced"}</th>
                <th className="py-3 px-5 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredEnforcements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {isAr ? "لا توجد أوامر تنفيذ مسجلة" : "No Judicial Enforcements Found"}
                      </span>
                      <p className="text-xs max-w-sm text-gray-500">
                        {isAr
                          ? "لم يتم تسجيل أي طلبات أو قرارات تنفيذ قضائية على هذه القضية بعد."
                          : "There are currently no legal enforcement claims registered for this legal case."}
                      </p>
                      <Button
                        onClick={handleOpenAdd}
                        className="mt-2 h-8 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {isAr ? "إضافة أول تنفيذ" : "Add Enforcement"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEnforcements.map((item, idx) => {
                  const id = item.TLCERECID ?? item.tlceRecId ?? item.id ?? idx + 1;
                  const refNo = item.ENFORCEMENTREFERENCE || item.enforcementReference || `ENF-${id}`;
                  const typeCode = item.VB_LEGALENFORCEMENTTYPE ?? item.vbLegalEnforcementType ?? 1;
                  const typeText = formatUnilingualText(
                    (item.LEGALENFORCEMENTTYPE && item.LEGALENFORCEMENTTYPE.trim()) ||
                    (item.legalEnforcementType && item.legalEnforcementType.trim()) ||
                    getEnforcementTypeText(typeCode, language),
                    language
                  );

                  const court = item.COURTNAME || item.courtName || "—";
                  const amt = item.ENFORCEDAMOUNT ?? item.enforcedAmount ?? 0;
                  const enfDate = item.ENFORCEMENTDATE || item.enforcementDate;
                  const effDate = item.EFFECTIVEDATE || item.effectiveDate;
                  const deadDate = item.DEADLINEDATE || item.deadlineDate;
                  const details = item.ENFORCEMENTDETAILS || item.enforcementDetails || "";

                  const actionCode = item.VB_LEGALENFORCEMENTACTION ?? item.vbLegalEnforcementAction ?? 1;
                  const actionText = formatUnilingualText(
                    (item.LEGALENFORCEMENTACTION && item.LEGALENFORCEMENTACTION.trim()) ||
                    (item.legalEnforcementAction && item.legalEnforcementAction.trim()) ||
                    getEnforcementActionText(actionCode, language),
                    language
                  );

                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Enforcement Reference */}
                      <td className="py-3 px-5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                          <Gavel className="w-3.5 h-3.5" />
                          {refNo}
                        </span>
                      </td>

                      {/* Enforcement Type Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                            Number(typeCode) === 2
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : Number(typeCode) === 1
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                          }`}
                        >
                          {typeText}
                        </span>
                      </td>

                      {/* Court Name */}
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" title={court}>
                        {court}
                      </td>

                      {/* Enforced Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        SAR {Number(amt).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Order Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {enfDate ? formatDateKSA(enfDate) : "—"}
                      </td>

                      {/* Effective Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {effDate ? formatDateKSA(effDate) : "—"}
                      </td>

                      {/* Deadline Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {deadDate ? formatDateKSA(deadDate) : "—"}
                      </td>

                      {/* Details with Hover Popover & Full Modal Preview */}
                      <td className="py-3 px-4">
                        <HoverDescriptionCell
                          text={details}
                          title="Enforcement Details"
                          arabicTitle="تفاصيل أمر التنفيذ"
                          maxWidth="max-w-[210px]"
                          themeColor="indigo"
                          language={language}
                          onViewClick={() =>
                            setPreviewDescription({
                              refNo,
                              description: details,
                              type: typeText,
                              court,
                              amount: amt,
                            })
                          }
                        />
                      </td>

                      {/* Action Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            Number(actionCode) === 1 || Number(actionCode) === 2
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : Number(actionCode) === 3 || Number(actionCode) === 4
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          <ShieldAlert className="w-3 h-3" />
                          {actionText}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Enforcement"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            title="Delete Enforcement"
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
        {filteredEnforcements.length > 0 && (
          <TablePagination
            currentPage={page}
            totalItems={filteredEnforcements.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="enforcements"
            themeColor="indigo"
          />
        )}
      </div>

      {/* ====================================================================
       * MODAL: ADD / EDIT LEGAL CASE ENFORCEMENT
       * ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingItem
                      ? (isAr ? "تعديل أمر التنفيذ" : "Edit Legal Enforcement")
                      : (isAr ? "إضافة أمر تنفيذ" : "Add Legal Enforcement")}
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
                {/* Enforcement Reference */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "رقم طلب/أمر التنفيذ *" : "Enforcement Reference *"}
                  </label>
                  <input
                    type="text"
                    {...register("enforcementReference", {
                      required: isAr ? "رقم أمر التنفيذ مطلوب" : "Enforcement Reference is required",
                      minLength: { value: 3, message: isAr ? "يجب ألا يقل عن 3 أحرف" : "Reference must be at least 3 characters" },
                    })}
                    placeholder="e.g. ENF-450198234"
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 ${
                      errors.enforcementReference
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500/30"
                    }`}
                  />
                  {errors.enforcementReference && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.enforcementReference.message}</span>
                    </p>
                  )}
                </div>

                {/* Enforcement Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "نوع إجراء التنفيذ *" : "Enforcement Type *"}
                  </label>
                  <select
                    {...register("vbLegalEnforcementType", {
                      required: isAr ? "يرجى اختيار نوع التنفيذ" : "Please select an Enforcement Type",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.vbLegalEnforcementType
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500/30"
                    }`}
                  >
                    <option value="">{isAr ? "اختر نوع التنفيذ" : "Select Enforcement Type"}</option>
                    {Object.entries(isAr ? ENFORCEMENT_TYPES_AR : ENFORCEMENT_TYPES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalEnforcementType && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.vbLegalEnforcementType.message}</span>
                    </p>
                  )}
                </div>

                {/* Court Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "المحكمة المختصة *" : "Court Name *"}
                  </label>
                  <input
                    type="text"
                    {...register("courtName", {
                      required: isAr ? "اسم المحكمة مطلوب" : "Court name is required",
                    })}
                    placeholder={isAr ? "مثال: محكمة التنفيذ بالرياض" : "e.g. Enforcement Court of Riyadh"}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.courtName
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500/30"
                    }`}
                  />
                  {errors.courtName && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.courtName.message}</span>
                    </p>
                  )}
                </div>

                {/* Enforced Amount */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "مبلغ المطالبة بالتنفيذ (ر.س) *" : "Enforced Amount (SAR) *"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("enforcedAmount", {
                      required: isAr ? "المبلغ مطلوب" : "Enforced amount is required",
                      min: { value: 0, message: isAr ? "يجب أن يكون المبلغ 0 أو أكثر" : "Amount must be 0 or greater" },
                    })}
                    placeholder="e.g. 80000.00"
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 ${
                      errors.enforcedAmount
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500/30"
                    }`}
                  />
                  {errors.enforcedAmount && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.enforcedAmount.message}</span>
                    </p>
                  )}
                </div>

                {/* Enforcement Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "تاريخ الأمر *" : "Enforcement Date *"}
                  </label>
                  <input
                    type="date"
                    {...register("enforcementDate", {
                      required: isAr ? "تاريخ الأمر مطلوب" : "Enforcement date is required",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.enforcementDate
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500/30"
                    }`}
                  />
                  {errors.enforcementDate && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.enforcementDate.message}</span>
                    </p>
                  )}
                </div>

                {/* Effective Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "تاريخ السريان *" : "Effective Date *"}
                  </label>
                  <input
                    type="date"
                    {...register("effectiveDate", {
                      required: isAr ? "تاريخ السريان مطلوب" : "Effective date is required",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.effectiveDate
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500/30"
                    }`}
                  />
                  {errors.effectiveDate && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.effectiveDate.message}</span>
                    </p>
                  )}
                </div>

                {/* Deadline Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "تاريخ المهلة النهائية *" : "Deadline Date *"}
                  </label>
                  <input
                    type="date"
                    {...register("deadlineDate", {
                      required: isAr ? "تاريخ المهلة مطلوب" : "Deadline date is required",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.deadlineDate
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500/30"
                    }`}
                  />
                  {errors.deadlineDate && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.deadlineDate.message}</span>
                    </p>
                  )}
                </div>

                {/* Enforcement Action */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "الإجراء المتخذ *" : "Enforcement Action *"}
                  </label>
                  <select
                    {...register("vbLegalEnforcementAction", {
                      required: isAr ? "يرجى اختيار الإجراء" : "Please select an Enforcement Action",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.vbLegalEnforcementAction
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500/30"
                    }`}
                  >
                    <option value="">{isAr ? "اختر الإجراء" : "Select Action"}</option>
                    {Object.entries(isAr ? ENFORCEMENT_ACTIONS_AR : ENFORCEMENT_ACTIONS).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalEnforcementAction && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.vbLegalEnforcementAction.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Enforcement Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isAr ? "تفاصيل وملاحظات التنفيذ *" : "Enforcement Details / Summary *"}
                </label>
                <textarea
                  rows={3}
                  {...register("enforcementDetails", {
                    required: isAr ? "تفاصيل وملاحظات التنفيذ مطلوبة" : "Enforcement details are required",
                    minLength: { value: 5, message: isAr ? "يجب ألا يقل النص عن 5 أحرف" : "Details must be at least 5 characters" },
                  })}
                  placeholder={
                    isAr
                      ? "أدخل ملاحظات التنفيذ القضائي، قرارات الحجز، أو تفاصيل الأصول..."
                      : "Enter judicial enforcement remarks, statutory decisions, or asset details..."
                  }
                  className={`w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 resize-none ${
                    errors.enforcementDetails
                      ? "border-rose-500 focus:ring-rose-500/30"
                      : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500/30"
                  }`}
                />
                {errors.enforcementDetails && (
                  <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.enforcementDetails.message}</span>
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
                  className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSubmitting
                      ? (isAr ? "جاري الحفظ..." : "Saving...")
                      : editingItem
                      ? (isAr ? "حفظ التعديلات" : "Update Enforcement")
                      : (isAr ? "إضافة التنفيذ" : "Save Enforcement")}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
       * REUSABLE DELETE CONFIRMATION MODAL (Matching Image 2)
       * ==================================================================== */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, item: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title={isAr ? "حذف أمر التنفيذ" : "Delete Legal Enforcement"}
        description={
          isAr
            ? "هل أنت متأكد من رغبتك في حذف هذا الأمر؟ سيؤدي ذلك إلى حذف سجل التنفيذ والعقوبات نهائياً من القضية."
            : "Are you sure you want to delete this judicial enforcement order? This will permanently remove the execution record and sanction logs from the legal case."
        }
        itemName={`Enforcement #${deleteModalState.item?.ENFORCEMENTREFERENCE || deleteModalState.item?.enforcementReference || deleteModalState.item?.TLCERECID || deleteModalState.item?.tlceRecId || ""}`}
        confirmText={isAr ? "حذف الأمر" : "Delete Enforcement"}
        isLoading={deleteModalState.isLoading}
      />

      {/* ====================================================================
       * FULL DESCRIPTION PREVIEW MODAL
       * ==================================================================== */}
      {previewDescription && (
        <DescriptionPreviewModal
          isOpen={true}
          onClose={() => setPreviewDescription(null)}
          title="Enforcement Details Preview"
          arabicTitle="تفاصيل ومذكرات أمر التنفيذ القضائي"
          language={language}
          referenceNo={previewDescription.refNo}
          description={previewDescription.description}
          metadata={[
            ...(previewDescription.type ? [{ label: isAr ? "نوع التنفيذ" : "Enforcement Type", value: previewDescription.type }] : []),
            ...(previewDescription.court ? [{ label: isAr ? "المحكمة" : "Court", value: previewDescription.court }] : []),
            ...(previewDescription.amount !== undefined ? [{ label: isAr ? "مبلغ التنفيذ" : "Enforced Amount", value: `SAR ${Number(previewDescription.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}` }] : []),
          ]}
          themeColor="indigo"
        />
      )}
    </div>
  );
};
