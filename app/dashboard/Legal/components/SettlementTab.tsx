"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Handshake,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  BadgeCheck,
  CreditCard,
  Building,
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
  LegalCaseSettlementRecord,
  AddLegalCaseSettlementPayload,
  getLegalCaseSettlement,
  addLegalCaseSettlement,
  updateLegalCaseSettlement,
  deleteLegalCaseSettlement,
  SETTLEMENT_TYPES,
  SETTLEMENT_TYPES_AR,
  getSettlementTypeText,
  formatUnilingualText,
} from "../HandlingAPIs";

export interface SettlementTabProps {
  legalCase?: LegalCaseRecord | null;
  cifId?: number | string;
  loanId?: number | string;
  language?: number;
}

interface SettlementFormData {
  settlementReference: string;
  vbLegalSettlementType: number | string;
  settlementDate: string;
  settlementDetails: string;
  claimAmount: number | string;
  proposedAmount: number | string;
  approvedAmount: number | string;
  downPaymentAmount: number | string;
  downPaymentDate: string;
  noOfInstallments: number | string;
  firstInstallmentAmount: number | string;
  firstInstallmentDate: string;
  isApproved: boolean;
  approvalDetails: string;
}

const EMPTY_SETTLEMENT_FORM: SettlementFormData = {
  settlementReference: "",
  vbLegalSettlementType: "",
  settlementDate: "",
  settlementDetails: "",
  claimAmount: "",
  proposedAmount: "",
  approvedAmount: "",
  downPaymentAmount: "",
  downPaymentDate: "",
  noOfInstallments: "",
  firstInstallmentAmount: "",
  firstInstallmentDate: "",
  isApproved: false,
  approvalDetails: "",
};

/**
 * Safely resolves the primary key ID of a Settlement Record from the API response.
 * Covers all Finnovator casing and naming variations (TLCSRECID, tlcsRecId, etc.)
 */
export const getSettlementRecordId = (item: any): string | number => {
  if (!item) return "";

  // 1. Direct check of common backend conventions
  const direct =
    item.TLCSRECID ??
    item.tlcsRecId ??
    item.TlcsRecId ??
    item.tlcsrecid ??
    item.TLSRECID ??
    item.tlsRecId ??
    item.TLSCRECID ??
    item.tlscRecId ??
    item.TLLCSRECID ??
    item.tllcsRecId ??
    item.TLSETRECID ??
    item.tlsetRecId ??
    item.TLCSECRECID ??
    item.tlcsecRecId ??
    item.SETTLEMENTID ??
    item.settlementId ??
    item.RECID ??
    item.recId ??
    item.ID ??
    item.id;

  if (direct !== undefined && direct !== null && direct !== "" && direct !== "undefined") {
    return direct;
  }

  // 2. Scan all properties of the item for any ID or RECID property
  // Exclude case and foreign keys
  const excluded = new Set([
    "TLLCRECID", "tllcRecId", "TllcRecId", "tllcrecid",
    "CIFID", "cifId", "CifId", "cifid",
    "LOANID", "loanId", "LoanId", "loanid",
    "TMCARECID", "tmcaRecId", "TmcaRecId", "tmcarecid",
    "VB_LEGALSETTLEMENTTYPE", "vbLegalSettlementType",
    "CLAIMAMOUNT", "claimAmount",
    "PROPOSEDAMOUNT", "proposedAmount",
    "APPROVEDAMOUNT", "approvedAmount",
    "DOWNPAYMENTAMOUNT", "downPaymentAmount",
    "NOOFINSTALLMENTS", "noOfInstallments",
    "FIRSTINSTALLMENTAMOUNT", "firstInstallmentAmount",
  ]);

  for (const [key, val] of Object.entries(item)) {
    if (excluded.has(key)) continue;
    const u = key.toUpperCase();
    if (u.includes("RECID") || u.endsWith("ID")) {
      if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val))) {
        return val as string | number;
      }
    }
  }

  // 3. Fallback to reference if available
  return item.SETTLEMENTREFERENCE || item.settlementReference || item.TLLCRECID || item.tllcRecId || "";
};

export const SettlementTab: React.FC<SettlementTabProps> = ({
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
  const [settlements, setSettlements] = useState<LegalCaseSettlementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state (10 per page default)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LegalCaseSettlementRecord | null>(null);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    item: LegalCaseSettlementRecord | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    item: null,
    isLoading: false,
  });

  // Description full preview modal state
  const [previewDescription, setPreviewDescription] = useState<{
    refNo: string;
    description: string;
    type?: string;
    proposed?: string;
    approved?: string;
    isApproved?: boolean;
  } | null>(null);

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettlementFormData>({
    defaultValues: EMPTY_SETTLEMENT_FORM,
  });

  const isApprovedWatch = watch("isApproved");

  // Fetch settlements from API
  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLegalCaseSettlement({
        TllcRecId: boundCaseId,
        CifId: targetCifId,
        LoanId: targetLoanId,
        Language: language,
      });
      if (Array.isArray(data)) {
        console.log("Fetched Settlements from API:", data);
        setSettlements(data);
      } else {
        setSettlements([]);
      }
    } catch (err) {
      console.error("Failed to load legal settlements:", err);
      toast.error(isAr ? "فشل تحميل بيانات التسويات" : "Failed to load settlement records");
    } finally {
      setLoading(false);
    }
  }, [boundCaseId, targetCifId, targetLoanId, language, isAr]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({
      ...EMPTY_SETTLEMENT_FORM,
      settlementDate: new Date().toISOString().slice(0, 10),
      claimAmount: legalCase?.CLAIMAMOUNT || legalCase?.claimAmount || "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: LegalCaseSettlementRecord) => {
    setEditingItem(item);
    const resolvedId = getSettlementRecordId(item);
    console.log("Opening edit for settlement item:", item, "Resolved ID:", resolvedId);

    const sDate = (item.SETTLEMENTDATE || item.settlementDate || "").slice(0, 10);
    const dpDate = (item.DOWNPAYMENTDATE || item.downPaymentDate || "").slice(0, 10);
    const fiDate = (item.FIRSTINSTALLMENTDATE || item.firstInstallmentDate || "").slice(0, 10);

    reset({
      settlementReference: item.SETTLEMENTREFERENCE || item.settlementReference || "",
      vbLegalSettlementType: item.VB_LEGALSETTLEMENTTYPE ?? item.vbLegalSettlementType ?? "",
      settlementDate: sDate || new Date().toISOString().slice(0, 10),
      settlementDetails: item.SETTLEMENTDETAILS || item.settlementDetails || "",
      claimAmount: item.CLAIMAMOUNT ?? item.claimAmount ?? "",
      proposedAmount: item.PROPOSEDAMOUNT ?? item.proposedAmount ?? "",
      approvedAmount: item.APPROVEDAMOUNT ?? item.approvedAmount ?? "",
      downPaymentAmount: item.DOWNPAYMENTAMOUNT ?? item.downPaymentAmount ?? "",
      downPaymentDate: dpDate,
      noOfInstallments: item.NOOFINSTALLMENTS ?? item.noOfInstallments ?? "",
      firstInstallmentAmount: item.FIRSTINSTALLMENTAMOUNT ?? item.firstInstallmentAmount ?? "",
      firstInstallmentDate: fiDate,
      isApproved: Boolean(item.ISAPPROVED ?? item.isApproved ?? false),
      approvalDetails: item.APPROVALDETAILS || item.approvalDetails || "",
    });
    setIsModalOpen(true);
  };

  // Submit Form Handler (Add or Update)
  const handleSubmitForm = async (formData: SettlementFormData) => {
    try {
      const nowIso = new Date().toISOString();
      const currentUser = getLoggedInUser();

      const payload: AddLegalCaseSettlementPayload = {
        tllcRecId: Number(boundCaseId),
        cifId: Number(targetCifId),
        loanId: Number(targetLoanId),
        vbLegalSettlementType: Number(formData.vbLegalSettlementType),
        settlementReference: formData.settlementReference.trim(),
        settlementDate: formData.settlementDate ? new Date(formData.settlementDate).toISOString() : nowIso,
        settlementDetails: formData.settlementDetails.trim(),
        claimAmount: Number(formData.claimAmount) || 0,
        proposedAmount: Number(formData.proposedAmount) || 0,
        approvedAmount: Number(formData.approvedAmount) || 0,
        downPaymentAmount: Number(formData.downPaymentAmount) || 0,
        downPaymentDate: formData.downPaymentDate ? new Date(formData.downPaymentDate).toISOString() : nowIso,
        noOfInstallments: Number(formData.noOfInstallments) || 0,
        firstInstallmentAmount: Number(formData.firstInstallmentAmount) || 0,
        firstInstallmentDate: formData.firstInstallmentDate
          ? new Date(formData.firstInstallmentDate).toISOString()
          : nowIso,
        isApproved: Boolean(formData.isApproved),
        approvalDetails: formData.approvalDetails ? formData.approvalDetails.trim() : "",
        updateDate: nowIso,
        updateBy: currentUser,
      };

      if (editingItem) {
        const id = getSettlementRecordId(editingItem);
        if (!id || id === "undefined") {
          console.error("Unable to resolve Settlement ID from item:", editingItem);
          toast.error(isAr ? "تعذر العثور على معرّف التسوية للتحديث" : "Settlement ID not found for update");
          return;
        }

        const updatePayload: AddLegalCaseSettlementPayload = {
          ...payload,
          ...(id && !isNaN(Number(id)) ? { tlcsRecId: Number(id), TLCSRECID: Number(id), id: Number(id) } : {}),
        };

        const res = await updateLegalCaseSettlement(id, updatePayload);
        if (res.success) {
          toast.success(isAr ? "تم تحديث اتفاقية التسوية بنجاح" : "Settlement record updated successfully");
          setIsModalOpen(false);
          fetchSettlements();
        } else {
          toast.error(res.message || (isAr ? "فشل تحديث التسوية" : "Failed to update settlement"));
        }
      } else {
        const res = await addLegalCaseSettlement(payload);
        if (res.success) {
          toast.success(isAr ? "تم تسجيل اتفاقية التسوية بنجاح" : "Settlement record added successfully");
          setIsModalOpen(false);
          fetchSettlements();
        } else {
          toast.error(res.message || (isAr ? "فشل إضافة التسوية" : "Failed to add settlement"));
        }
      }
    } catch (err: any) {
      console.error("Error submitting settlement form:", err);
      toast.error(err?.message || (isAr ? "حدث خطأ أثناء حفظ التسوية" : "An error occurred while saving settlement"));
    }
  };

  // Open Delete Confirm Modal
  const handleOpenDelete = (item: LegalCaseSettlementRecord) => {
    setDeleteModalState({
      isOpen: true,
      item,
      isLoading: false,
    });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteModalState.item) return;
    setDeleteModalState((prev) => ({ ...prev, isLoading: true }));

    try {
      const item = deleteModalState.item;
      const id = getSettlementRecordId(item);
      if (!id || id === "undefined") {
        console.error("Unable to resolve Settlement ID for delete:", item);
        toast.error(isAr ? "تعذر العثور على معرّف التسوية للحذف" : "Settlement ID not found for delete");
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const currentUser = getLoggedInUser();
      const res = await deleteLegalCaseSettlement(id, currentUser);

      if (res.success) {
        toast.success(isAr ? "تم حذف اتفاقية التسوية بنجاح" : "Settlement record deleted successfully");
        setDeleteModalState({ isOpen: false, item: null, isLoading: false });
        fetchSettlements();
      } else {
        toast.error(res.message || (isAr ? "فشل حذف التسوية" : "Failed to delete settlement"));
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      console.error("Error deleting settlement:", err);
      toast.error(err?.message || (isAr ? "حدث خطأ أثناء حذف التسوية" : "An error occurred while deleting"));
      setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Filtered list
  const filteredSettlements = useMemo(() => {
    return settlements.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const ref = (item.SETTLEMENTREFERENCE || item.settlementReference || "").toLowerCase();
      const details = (item.SETTLEMENTDETAILS || item.settlementDetails || "").toLowerCase();
      const appNotes = (item.APPROVALDETAILS || item.approvalDetails || "").toLowerCase();
      const matchesSearch = !q || ref.includes(q) || details.includes(q) || appNotes.includes(q);

      const typeCode = String(item.VB_LEGALSETTLEMENTTYPE ?? item.vbLegalSettlementType ?? "");
      const matchesType = typeFilter === "all" || typeCode === typeFilter;

      const isAppr = Boolean(item.ISAPPROVED ?? item.isApproved ?? false);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && isAppr) ||
        (statusFilter === "pending" && !isAppr);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [settlements, searchQuery, typeFilter, statusFilter]);

  // Paginated list (10 per page default)
  const paginatedSettlements = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredSettlements.slice(startIndex, startIndex + pageSize);
  }, [filteredSettlements, page, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  // KPI Calculations
  const totalProposed = useMemo(() => {
    return settlements.reduce((acc, s) => acc + (Number(s.PROPOSEDAMOUNT ?? s.proposedAmount) || 0), 0);
  }, [settlements]);

  const totalApproved = useMemo(() => {
    return settlements.reduce((acc, s) => acc + (Number(s.APPROVEDAMOUNT ?? s.approvedAmount) || 0), 0);
  }, [settlements]);

  const approvedCount = useMemo(() => {
    return settlements.filter((s) => Boolean(s.ISAPPROVED ?? s.isApproved)).length;
  }, [settlements]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Settlements */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "إجمالي اتفاقيات التسوية" : "Total Settlements"}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {settlements.length}
              </h4>
              <p className="text-[10px] text-teal-500 font-medium mt-0.5">
                {isAr ? "ملفات ومقترحات التسوية" : "Negotiation Proposals"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20">
              <Handshake className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Proposed Amount */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "إجمالي المبالغ المقترحة" : "Total Proposed Amount"}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
                SAR {totalProposed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                {isAr ? "عروض العملاء المقدمة" : "Offered Settlement Value"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Approved Amount */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "المبالغ المعتمدة" : "Total Approved Value"}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
                SAR {totalApproved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
                {isAr ? "المعتمدة من لجان التسوية" : "Sanctioned by Committee"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "حالة الاعتماد" : "Approval Status"}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {approvedCount} / {settlements.length}
              </h4>
              <p className="text-[10px] text-cyan-500 font-medium mt-0.5">
                {isAr ? `${approvedCount} تسوية معتمدة رسمياً` : `${approvedCount} Officially Approved`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <BadgeCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Settlement Table Container */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500" />

        {/* Header & Controls Bar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isAr ? "التسويات والمصالحات القضائية" : "Legal Case Settlements"}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/20 whitespace-nowrap">
                  {isAr ? `قضية رقم #${boundCaseId}` : `Legal Case #${boundCaseId}`}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAr
                  ? "تقديم ومراجعة ومتابعة عروض التسوية وإعادة هيكلة الديون وخطط السداد القضائية"
                  : "Manage debt settlement agreements, restructuring terms, payment installments, and committee approvals"}
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
                placeholder={isAr ? "البحث في التسويات..." : "Search settlement..."}
                className="h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-36 sm:w-44"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">{isAr ? "جميع الأنواع" : "All Types"}</option>
              {Object.entries(isAr ? SETTLEMENT_TYPES_AR : SETTLEMENT_TYPES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">{isAr ? "جميع الحالات" : "All Statuses"}</option>
              <option value="approved">{isAr ? "معتمدة" : "Approved"}</option>
              <option value="pending">{isAr ? "قيد الدراسة" : "Pending"}</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchSettlements}
              title={isAr ? "تحديث التسويات" : "Refresh settlements"}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-teal-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Add Settlement Button - Right Aligned */}
            <Button
              onClick={handleOpenAdd}
              className="h-9 px-4 shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto"
            >
              <Plus className="w-4 h-4" />
              {isAr ? "إضافة تسوية" : "Add Settlement"}
            </Button>
          </div>
        </div>

        {/* Dynamic-Height Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-5">{isAr ? "رقم مرجع التسوية" : "Settlement Ref"}</th>
                <th className="py-3 px-4 min-w-[180px]">{isAr ? "نوع التسوية" : "Settlement Type"}</th>
                <th className="py-3 px-4">{isAr ? "تاريخ العرض" : "Offer Date"}</th>
                <th className="py-3 px-4">{isAr ? "مبلغ المطالبة" : "Claim Amount"}</th>
                <th className="py-3 px-4">{isAr ? "المبلغ المقترح" : "Proposed Amount"}</th>
                <th className="py-3 px-4">{isAr ? "المبلغ المعتمد" : "Approved Amount"}</th>
                <th className="py-3 px-4">{isAr ? "الدفعة المقدمة" : "Down Payment"}</th>
                <th className="py-3 px-4">{isAr ? "الأقساط المجدولة" : "Installments"}</th>
                <th className="py-3 px-4 text-center">{isAr ? "حالة الاعتماد" : "Approval"}</th>
                <th className="py-3 px-4 min-w-[200px] max-w-[260px]">{isAr ? "شروط وتفاصيل التسوية" : "Settlement Terms"}</th>
                <th className="py-3 px-5 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                        <Handshake className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {isAr ? "لا توجد اتفاقيات تسوية مسجلة" : "No Settlements Found"}
                      </span>
                      <p className="text-xs max-w-sm text-gray-500">
                        {isAr
                          ? "لم يتم تسجيل أي عروض أو اتفاقيات تسوية مالية لهذه القضية حتى الآن."
                          : "There are currently no settlement proposals or restructuring agreements recorded for this case."}
                      </p>
                      <Button
                        onClick={handleOpenAdd}
                        className="mt-2 h-8 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {isAr ? "إضافة تسوية" : "Add Settlement"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSettlements.map((item, idx) => {
                  const id = getSettlementRecordId(item) || idx + 1;

                  const refNo = item.SETTLEMENTREFERENCE || item.settlementReference || `STL-${id}`;
                  const typeCode = item.VB_LEGALSETTLEMENTTYPE ?? item.vbLegalSettlementType ?? 1;
                  const typeText = formatUnilingualText(
                    (item.LEGALSETTLEMENTTYPE && item.LEGALSETTLEMENTTYPE.trim()) ||
                      (item.legalSettlementType && item.legalSettlementType.trim()) ||
                      getSettlementTypeText(typeCode, language),
                    language
                  );

                  const sDate = item.SETTLEMENTDATE || item.settlementDate;
                  const claimAmt = Number(item.CLAIMAMOUNT ?? item.claimAmount) || 0;
                  const propAmt = Number(item.PROPOSEDAMOUNT ?? item.proposedAmount) || 0;
                  const apprAmt = Number(item.APPROVEDAMOUNT ?? item.approvedAmount) || 0;
                  const downAmt = Number(item.DOWNPAYMENTAMOUNT ?? item.downPaymentAmount) || 0;
                  const downDate = item.DOWNPAYMENTDATE || item.downPaymentDate;
                  const installments = Number(item.NOOFINSTALLMENTS ?? item.noOfInstallments) || 0;
                  const firstInstallmentAmt = Number(item.FIRSTINSTALLMENTAMOUNT ?? item.firstInstallmentAmount) || 0;
                  const isAppr = Boolean(item.ISAPPROVED ?? item.isApproved);
                  const details = item.SETTLEMENTDETAILS || item.settlementDetails || "";

                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Settlement Reference */}
                      <td className="py-3 px-5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                          <Handshake className="w-3.5 h-3.5" />
                          {refNo}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20">
                          {typeText}
                        </span>
                      </td>

                      {/* Offer Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {sDate ? formatDateKSA(sDate) : "—"}
                      </td>

                      {/* Claim Amount */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {claimAmt > 0 ? `SAR ${claimAmt.toLocaleString()}` : "—"}
                      </td>

                      {/* Proposed Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                        SAR {propAmt.toLocaleString()}
                      </td>

                      {/* Approved Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {apprAmt > 0 ? `SAR ${apprAmt.toLocaleString()}` : "—"}
                      </td>

                      {/* Down Payment */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {downAmt > 0 ? (
                          <div className="flex flex-col text-[11px]">
                            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                              SAR {downAmt.toLocaleString()}
                            </span>
                            {downDate && (
                              <span className="font-mono text-gray-400 text-[10px]">
                                {formatDateKSA(downDate)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Installments */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {installments > 0 ? (
                          <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {installments} {isAr ? "أقساط" : "installments"}
                            </span>
                            {firstInstallmentAmt > 0 && (
                              <span className="font-mono text-indigo-500 text-[10px]">
                                SAR {firstInstallmentAmt.toLocaleString()} / {isAr ? "قسط" : "inst"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Approval Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isAppr
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isAppr ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isAppr ? (isAr ? "معتمدة" : "Approved") : (isAr ? "قيد الدراسة" : "Pending")}
                        </span>
                      </td>

                      {/* Terms with Hover Popover & Full Modal Preview */}
                      <td className="py-3 px-4">
                        <HoverDescriptionCell
                          text={details}
                          title="Settlement Agreement Details"
                          arabicTitle="تفاصيل شروط اتفاقية التسوية"
                          maxWidth="max-w-[210px]"
                          themeColor="emerald"
                          language={language}
                          onViewClick={() =>
                            setPreviewDescription({
                              refNo,
                              description: details,
                              type: typeText,
                              proposed: `SAR ${propAmt.toLocaleString()}`,
                              approved: apprAmt > 0 ? `SAR ${apprAmt.toLocaleString()}` : undefined,
                              isApproved: isAppr,
                            })
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title={isAr ? "تعديل التسوية" : "Edit Settlement"}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            title={isAr ? "حذف التسوية" : "Delete Settlement"}
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
        {filteredSettlements.length > 0 && (
          <TablePagination
            currentPage={page}
            totalItems={filteredSettlements.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName={isAr ? "تسويات" : "settlements"}
            themeColor="emerald"
          />
        )}
      </div>

      {/* ====================================================================
       * MODAL: ADD / EDIT LEGAL CASE SETTLEMENT
       * ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-2xl flex flex-col max-h-[92vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500" />

            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingItem
                      ? (isAr ? "تعديل اتفاقية التسوية" : "Edit Case Settlement")
                      : (isAr ? "إضافة اتفاقية تسوية جديدة" : "Add Case Settlement")}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Settlement Reference */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "رقم مرجع التسوية *" : "Settlement Reference *"}
                  </label>
                  <input
                    type="text"
                    {...register("settlementReference", {
                      required: isAr ? "رقم المرجع مطلوب" : "Settlement Reference is required",
                      minLength: { value: 3, message: isAr ? "يجب ألا يقل عن 3 أحرف" : "Reference must be at least 3 characters" },
                    })}
                    placeholder={isAr ? "مثال: STL-2026-001" : "e.g. STL-2026-001"}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 ${
                      errors.settlementReference
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                    }`}
                  />
                  {errors.settlementReference && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.settlementReference.message}</span>
                    </p>
                  )}
                </div>

                {/* Settlement Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "نوع التسوية *" : "Settlement Type *"}
                  </label>
                  <select
                    {...register("vbLegalSettlementType", {
                      required: isAr ? "يرجى اختيار نوع التسوية" : "Please select Settlement Type",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.vbLegalSettlementType
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                    }`}
                  >
                    <option value="">{isAr ? "اختر نوع التسوية" : "Select Settlement Type"}</option>
                    {Object.entries(isAr ? SETTLEMENT_TYPES_AR : SETTLEMENT_TYPES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalSettlementType && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.vbLegalSettlementType.message}</span>
                    </p>
                  )}
                </div>

                {/* Settlement Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "تاريخ اتفاقية التسوية *" : "Settlement Date *"}
                  </label>
                  <input
                    type="date"
                    {...register("settlementDate", {
                      required: isAr ? "تاريخ التسوية مطلوب" : "Settlement date is required",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.settlementDate
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                    }`}
                  />
                  {errors.settlementDate && (
                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.settlementDate.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Financial Terms Section */}
              <div className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 space-y-3">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-teal-500" />
                  {isAr ? "الشروط المالية والمبالغ (ر.س)" : "Financial Terms & Amounts (SAR)"}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Claim Amount */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {isAr ? "مبلغ المطالبة الأصلي (ر.س)" : "Claim Amount (SAR)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("claimAmount")}
                      placeholder="e.g. 80000"
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>

                  {/* Proposed Amount */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {isAr ? "المبلغ المقترح للتسوية (ر.س) *" : "Proposed Settlement Amount (SAR) *"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("proposedAmount", {
                        required: isAr ? "المبلغ المقترح مطلوب" : "Proposed amount is required",
                        min: { value: 0, message: isAr ? "يجب ألا يقل عن 0" : "Cannot be negative" },
                      })}
                      placeholder="e.g. 70000"
                      className={`w-full h-9 px-3 rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 ${
                        errors.proposedAmount
                          ? "border-rose-500 focus:ring-rose-500/30"
                          : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                      }`}
                    />
                    {errors.proposedAmount && (
                      <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.proposedAmount.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Approved Amount */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {isAr ? "المبلغ المعتمد (ر.س)" : "Approved Amount (SAR)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("approvedAmount")}
                      placeholder="e.g. 70000"
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-gray-200/60 dark:border-gray-800">
                  {/* Down Payment Amount */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {isAr ? "الدفعة المقدمة (ر.س)" : "Down Payment (SAR)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("downPaymentAmount")}
                      placeholder="e.g. 15000"
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>

                  {/* Down Payment Date */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {isAr ? "تاريخ الدفعة المقدمة" : "Down Payment Date"}
                    </label>
                    <input
                      type="date"
                      {...register("downPaymentDate")}
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>

                  {/* No Of Installments */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {isAr ? "عدد الأقساط" : "No. of Installments"}
                    </label>
                    <input
                      type="number"
                      {...register("noOfInstallments")}
                      placeholder="e.g. 6"
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>

                  {/* First Installment Amount */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {isAr ? "قيمة القسط الشهري (ر.س)" : "Installment Amount (SAR)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("firstInstallmentAmount")}
                      placeholder="e.g. 10000"
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                </div>

                {/* First Installment Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {isAr ? "تاريخ أول قسط" : "First Installment Date"}
                    </label>
                    <input
                      type="date"
                      {...register("firstInstallmentDate")}
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>

                  {/* Approval Toggle */}
                  <div className="flex items-center gap-3 pt-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("isApproved")}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </label>
                    <div>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                        {isAr ? "اعتماد اتفاقية التسوية" : "Mark Settlement as Approved"}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        {isAr ? "تفعيل الخيار في حال مصادقة اللجنة أو الإدارة القانونية" : "Sanctioned by Credit & Legal Recovery Committee"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval Details / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isAr ? "ملاحظات وتفاصيل الاعتماد" : "Approval Notes & Signoff Details"}
                </label>
                <input
                  type="text"
                  {...register("approvalDetails")}
                  placeholder={
                    isAr
                      ? "مثال: اعتمد بموجب محضر اجتماع اللجنة رقم 45 بتاريخ..."
                      : "e.g. Approved as per Committee minutes #45 dated..."
                  }
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              {/* Settlement Terms & Conditions Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isAr ? "بنود وشروط اتفاقية التسوية بالتفصيل *" : "Settlement Terms & Conditions Details *"}
                </label>
                <textarea
                  rows={3}
                  {...register("settlementDetails", {
                    required: isAr ? "تفاصيل وبنود التسوية مطلوبة" : "Settlement terms & details are required",
                    minLength: { value: 5, message: isAr ? "يجب ألا يقل النص عن 5 أحرف" : "Details must be at least 5 characters" },
                  })}
                  placeholder={
                    isAr
                      ? "أدخل تفاصيل التنازل، خطة السداد المقترحة، الالتزامات القضائية..."
                      : "Enter settlement waiver details, structured repayment conditions, release clauses..."
                  }
                  className={`w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 resize-none ${
                    errors.settlementDetails
                      ? "border-rose-500 focus:ring-rose-500/30"
                      : "border-gray-200 dark:border-gray-700 focus:ring-teal-500/30"
                  }`}
                />
                {errors.settlementDetails && (
                  <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.settlementDetails.message}</span>
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
                      ? (isAr ? "حفظ التعديلات" : "Update Settlement")
                      : (isAr ? "تسجيل التسوية" : "Save Settlement")}
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
        title={isAr ? "حذف اتفاقية التسوية" : "Delete Case Settlement"}
        description={
          isAr
            ? "هل أنت متأكد من رغبتك في حذف اتفاقية التسوية هذه؟ سيؤدي ذلك إلى إلغاء خطة السداد وإزالتها نهائياً من القضية."
            : "Are you sure you want to delete this settlement record? This will permanently cancel and remove the proposed repayment agreement from the legal case."
        }
        itemName={
          isAr
            ? `تسوية #${deleteModalState.item?.SETTLEMENTREFERENCE || deleteModalState.item?.settlementReference || ""}`
            : `Settlement #${deleteModalState.item?.SETTLEMENTREFERENCE || deleteModalState.item?.settlementReference || ""}`
        }
        confirmText={isAr ? "حذف التسوية" : "Delete Settlement"}
        isLoading={deleteModalState.isLoading}
      />

      {/* ====================================================================
       * FULL DESCRIPTION PREVIEW MODAL
       * ==================================================================== */}
      {previewDescription && (
        <DescriptionPreviewModal
          isOpen={true}
          onClose={() => setPreviewDescription(null)}
          title="Settlement Agreement Terms Preview"
          arabicTitle="معاينة بنود وشروط اتفاقية التسوية"
          referenceNo={previewDescription.refNo}
          description={previewDescription.description}
          language={language}
          metadata={[
            ...(previewDescription.type ? [{ label: isAr ? "نوع التسوية" : "Type", value: previewDescription.type }] : []),
            ...(previewDescription.proposed ? [{ label: isAr ? "المبلغ المقترح" : "Proposed Amount", value: previewDescription.proposed }] : []),
            ...(previewDescription.approved ? [{ label: isAr ? "المبلغ المعتمد" : "Approved Amount", value: previewDescription.approved }] : []),
            {
              label: isAr ? "الاعتماد" : "Status",
              value: previewDescription.isApproved
                ? (isAr ? "معتمدة" : "Approved")
                : (isAr ? "قيد الدراسة" : "Pending Approval"),
            },
          ]}
          themeColor="emerald"
        />
      )}
    </div>
  );
};
