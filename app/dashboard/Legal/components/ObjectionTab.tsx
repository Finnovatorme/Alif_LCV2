"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  FileQuestion,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Scale,
  FileText,
  AlertTriangle,
  Check,
  Building,
  CheckCheck,
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
  LegalCustObjectionRecord,
  AddLegalCustObjectionPayload,
  getLegalCustObjection,
  addLegalCustObjection,
  updateLegalCustObjection,
  deleteLegalCustObjection,
  OBJECTION_TYPES,
  OBJECTION_TYPES_AR,
  OBJECTION_STATUSES,
  OBJECTION_STATUSES_AR,
  getObjectionTypeText,
  getObjectionStatusText,
  formatUnilingualText,
} from "../HandlingAPIs";

interface ObjectionTabProps {
  legalCase?: LegalCaseRecord | null;
  cifId?: number | string;
  loanId?: number | string;
  language?: number;
}

const EMPTY_OBJECTION_FORM = {
  tlcoRecId: 0 as number,
  objectionReference: "",
  vbLegalObjectionType: "" as string | number,
  objectionDate: "",
  objectionDetails: "",
  vbLegalObjectionStatus: "" as string | number,
  statusDate: "",
  statusDetails: "",
  isResolved: false,
};

export const ObjectionTab: React.FC<ObjectionTabProps> = ({
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
  const [objections, setObjections] = useState<LegalCustObjectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state (10 per page default)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<LegalCustObjectionRecord | null>(null);

  // React Hook Form with live validation
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: EMPTY_OBJECTION_FORM,
    mode: "onChange",
  });

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    item: LegalCustObjectionRecord | null;
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
    status?: string;
    statusDate?: string;
    isResolved?: string;
  } | null>(null);

  // Fetch objections from live API
  const fetchObjections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLegalCustObjection({
        TllcRecId: boundCaseId,
        CifId: targetCifId,
        LoanId: targetLoanId,
        Language: language,
      });

      if (Array.isArray(data)) {
        setObjections(data);
      } else {
        setObjections([]);
      }
    } catch (err: any) {
      console.error("Error loading customer objections:", err);
      toast.error("Failed to load customer objections");
    } finally {
      setLoading(false);
    }
  }, [boundCaseId, targetCifId, targetLoanId, language]);

  useEffect(() => {
    fetchObjections();
  }, [fetchObjections]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({ ...EMPTY_OBJECTION_FORM });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: LegalCustObjectionRecord) => {
    setEditingItem(item);
    const objDate = item.OBJECTIONDATE || item.objectionDate || "";
    const stDate = item.STATUSDATE || item.statusDate || "";

    reset({
      tlcoRecId: Number(item.TLCORECID ?? item.tlcoRecId ?? item.id ?? 0),
      objectionReference: item.OBJECTIONREFERENCE || item.objectionReference || "",
      vbLegalObjectionType: item.VB_LEGALOBJECTIONTYPE ?? item.vbLegalObjectionType ?? "",
      objectionDate: objDate ? objDate.split("T")[0] : "",
      objectionDetails: item.OBJECTIONDETAILS || item.objectionDetails || "",
      vbLegalObjectionStatus: item.VB_LEGALOBJECTIONSTATUS ?? item.vbLegalObjectionStatus ?? "",
      statusDate: stDate ? stDate.split("T")[0] : "",
      statusDetails: item.STATUSDETAILS || item.statusDetails || "",
      isResolved: Boolean(item.ISRESOLVED ?? item.isResolved ?? false),
    });
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (formData: typeof EMPTY_OBJECTION_FORM) => {
    const currentUser = getLoggedInUser();
    const nowIso = new Date().toISOString();

    const payload: AddLegalCustObjectionPayload = {
      tllcRecId: Number(boundCaseId) || 1,
      cifId: Number(targetCifId) || 0,
      loanId: Number(targetLoanId) || 0,
      vbLegalObjectionType: Number(formData.vbLegalObjectionType) || 1,
      objectionReference: formData.objectionReference.trim(),
      objectionDate: formData.objectionDate ? `${formData.objectionDate}T00:00:00.000Z` : nowIso,
      objectionDetails: formData.objectionDetails.trim(),
      vbLegalObjectionStatus: Number(formData.vbLegalObjectionStatus) || 1,
      statusDate: formData.statusDate ? `${formData.statusDate}T00:00:00.000Z` : nowIso,
      statusDetails: formData.statusDetails.trim(),
      isResolved: Boolean(formData.isResolved),
      updateDate: nowIso,
      updateBy: currentUser,
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const id = editingItem.TLCORECID ?? editingItem.tlcoRecId ?? editingItem.id;
        if (!id) {
          toast.error("Objection ID not found for update");
          setIsSubmitting(false);
          return;
        }

        const res = await updateLegalCustObjection(id, payload);
        if (res.success) {
          toast.success(res.message || "Customer Objection updated successfully");
          // Instant direct table update
          setObjections((prev) =>
            prev.map((o) =>
              (o.TLCORECID ?? o.tlcoRecId ?? o.id) === id
                ? { ...o, ...payload, TLCORECID: id, tlcoRecId: id }
                : o
            )
          );
          setIsModalOpen(false);
          fetchObjections();
        } else {
          toast.error(res.message || "Failed to update Customer Objection");
        }
      } else {
        const res = await addLegalCustObjection(payload);
        if (res.success) {
          toast.success(res.message || "Customer Objection added successfully");
          const createdId =
            res.data?.TLCORECID ??
            res.data?.tlcoRecId ??
            res.data?.id ??
            Math.max(0, ...objections.map((o) => Number(o.TLCORECID ?? o.tlcoRecId ?? o.id ?? 0))) + 1;

          const newItem: LegalCustObjectionRecord = {
            ...payload,
            TLCORECID: createdId,
            tlcoRecId: createdId,
            id: createdId,
          };
          // Instant direct table update
          setObjections((prev) => [newItem, ...prev]);
          setIsModalOpen(false);
          fetchObjections();
        } else {
          toast.error(res.message || "Failed to add Customer Objection");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred while saving objection");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (item: LegalCustObjectionRecord) => {
    setDeleteModalState({
      isOpen: true,
      item,
      isLoading: false,
    });
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalState.item) return;
    const id = deleteModalState.item.TLCORECID ?? deleteModalState.item.tlcoRecId ?? deleteModalState.item.id;
    if (!id) {
      toast.error("Objection ID not found");
      return;
    }

    const currentUser = getLoggedInUser();
    try {
      setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
      const res = await deleteLegalCustObjection(id, currentUser);
      if (res.success) {
        toast.success(res.message || "Customer Objection deleted successfully");
        // Instant direct table update
        setObjections((prev) =>
          prev.filter((o) => (o.TLCORECID ?? o.tlcoRecId ?? o.id) !== id)
        );
        setDeleteModalState({ isOpen: false, item: null, isLoading: false });
        fetchObjections();
      } else {
        toast.error(res.message || "Failed to delete Customer Objection");
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      toast.error(err?.message || "Error deleting objection");
      setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Filtered objections
  const filteredObjections = useMemo(() => {
    return objections.filter((o) => {
      const ref = o.OBJECTIONREFERENCE || o.objectionReference || "";
      const details = o.OBJECTIONDETAILS || o.objectionDetails || "";
      const sDetails = o.STATUSDETAILS || o.statusDetails || "";
      const typeCode = String(o.VB_LEGALOBJECTIONTYPE ?? o.vbLegalObjectionType ?? "");
      const statusCode = String(o.VB_LEGALOBJECTIONSTATUS ?? o.vbLegalObjectionStatus ?? "");

      const matchesSearch =
        ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sDetails.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || typeCode === typeFilter;
      const matchesStatus = statusFilter === "all" || statusCode === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [objections, searchQuery, typeFilter, statusFilter]);

  // Paginated objections (max 10 per page default)
  const paginatedObjections = useMemo(() => {
    return filteredObjections.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredObjections, page, pageSize]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const total = objections.length;
    const underReview = objections.filter((o) => {
      const st = Number(o.VB_LEGALOBJECTIONSTATUS ?? o.vbLegalObjectionStatus ?? 1);
      return st === 1 || st === 2;
    }).length;
    const suspension = objections.filter((o) => {
      const st = Number(o.VB_LEGALOBJECTIONSTATUS ?? o.vbLegalObjectionStatus ?? 0);
      return st === 3;
    }).length;
    const resolved = objections.filter((o) => {
      return Boolean(o.ISRESOLVED ?? o.isResolved) || Number(o.VB_LEGALOBJECTIONSTATUS ?? o.vbLegalObjectionStatus ?? 0) === 5;
    }).length;

    return { total, underReview, suspension, resolved };
  }, [objections]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Objections */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "إجمالي الاعتراضات" : "Total Objections"}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {kpiStats.total}
              </h4>
              <p className="text-[10px] text-amber-500 font-medium mt-0.5">
                {isAr ? "اعتراضات ومنازعات مقيدة" : "Debtor Appeals Filed"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Under Review */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "قيد الدراسة والمراجعة" : "Under Review"}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {kpiStats.underReview}
              </h4>
              <p className="text-[10px] text-sky-500 font-medium mt-0.5">
                {isAr ? "في انتظار التدقيق القضائي" : "Pending Examination"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Article 46 Stays */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "وقف تدابير م46" : "Suspension Granted"}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {kpiStats.suspension}
              </h4>
              <p className="text-[10px] text-rose-500 font-medium mt-0.5">
                {isAr ? "قرارات وقف تنفيذ مؤقتة" : "Article 46 Suspensions"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Resolved / Closed */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {isAr ? "منتهية ومحسومة" : "Resolved Cases"}
              </p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {kpiStats.resolved}
              </h4>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                {isAr ? "مسواة أو مؤيد صحة السند" : "Settled or Dismissed"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Objection Table Container */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        {/* Header & Controls Bar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isAr ? "الاعتراضات والالتماسات القانونية" : "Customer Legal Objections & Appeals"}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20 whitespace-nowrap">
                  {isAr ? `قضية رقم #${boundCaseId}` : `Legal Case #${boundCaseId}`}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAr
                  ? "مراجعة اعتراضات المنفذ ضده، المنازعات الإجرائية، وطلبات وقف تدابير المادة 46"
                  : "Review debtor pleas, procedural disputes, Article 46 stay requests, and judicial examination status"}
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
                placeholder={isAr ? "البحث في الاعتراضات..." : "Search objections..."}
                className="h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-36 sm:w-44"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">{isAr ? "جميع الأنواع" : "All Types"}</option>
              {Object.entries(isAr ? OBJECTION_TYPES_AR : OBJECTION_TYPES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">{isAr ? "جميع الحالات" : "All Statuses"}</option>
              {Object.entries(isAr ? OBJECTION_STATUSES_AR : OBJECTION_STATUSES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchObjections}
              title={isAr ? "تحديث الاعتراضات" : "Refresh objections"}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Add Objection Button - Right Aligned */}
            <Button
              onClick={handleOpenAdd}
              className="h-9 px-4 shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto"
            >
              <Plus className="w-4 h-4" />
              {isAr ? "إضافة اعتراض" : "Add Objection"}
            </Button>
          </div>
        </div>

        {/* Dynamic-Height Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-5">{isAr ? "رقم الاعتراض" : "Objection Ref"}</th>
                <th className="py-3 px-4 min-w-[170px]">{isAr ? "نوع الاعتراض" : "Objection Type"}</th>
                <th className="py-3 px-4">{isAr ? "تاريخ التقديم" : "Filing Date"}</th>
                <th className="py-3 px-4 min-w-[200px] max-w-[260px]">{isAr ? "تفاصيل الاعتراض" : "Objection Details"}</th>
                <th className="py-3 px-4 min-w-[150px]">{isAr ? "حالة الاعتراض" : "Current Status"}</th>
                <th className="py-3 px-4">{isAr ? "تاريخ الحالة" : "Status Date"}</th>
                <th className="py-3 px-4 min-w-[180px] max-w-[220px]">{isAr ? "ملاحظات الحالة" : "Status Notes"}</th>
                <th className="py-3 px-4 text-center">{isAr ? "النتيجة" : "Resolution"}</th>
                <th className="py-3 px-5 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredObjections.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                        <FileQuestion className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {isAr ? "لا توجد اعتراضات مسجلة" : "No Customer Objections Found"}
                      </span>
                      <p className="text-xs max-w-sm text-gray-500">
                        {isAr
                          ? "لا توجد أي اعتراضات أو منازعات تنفيذية مقيدة على هذه القضية حالياً."
                          : "There are currently no legal objections or appeals recorded for this case."}
                      </p>
                      <Button
                        onClick={handleOpenAdd}
                        className="mt-2 h-8 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {isAr ? "إضافة أول اعتراض" : "Add First Objection"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedObjections.map((item) => {
                  const id = item.TLCORECID ?? item.tlcoRecId ?? item.id;
                  const refNo = item.OBJECTIONREFERENCE || item.objectionReference || `OBJ-${id}`;
                  const typeCode = item.VB_LEGALOBJECTIONTYPE ?? item.vbLegalObjectionType ?? 1;
                  const typeText = getObjectionTypeText(typeCode, language);
                  const statusCode = item.VB_LEGALOBJECTIONSTATUS ?? item.vbLegalObjectionStatus ?? 1;
                  const statusText = getObjectionStatusText(statusCode, language);
                  const oDate = item.OBJECTIONDATE || item.objectionDate;
                  const sDate = item.STATUSDATE || item.statusDate;
                  const oDetails = item.OBJECTIONDETAILS || item.objectionDetails || "";
                  const sDetails = item.STATUSDETAILS || item.statusDetails || "";
                  const isResolved = Boolean(item.ISRESOLVED ?? item.isResolved ?? false);

                  return (
                    <tr
                      key={id || Math.random()}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Objection Reference */}
                      <td className="py-3 px-5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          <FileQuestion className="w-3.5 h-3.5" />
                          <span>{refNo}</span>
                        </div>
                      </td>

                      {/* Objection Type */}
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">
                        <span className="inline-block max-w-[200px] truncate" title={typeText}>
                          {typeText}
                        </span>
                      </td>

                      {/* Filing Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDateKSA(oDate)}
                      </td>

                      {/* Objection Details with Hover Popover & Preview Modal */}
                      <td className="py-3 px-4">
                        <HoverDescriptionCell
                          text={oDetails}
                          maxWidth="max-w-[240px]"
                          title="Objection Grounds & Details"
                          arabicTitle="تفاصيل وأسباب الاعتراض"
                          themeColor="amber"
                          language={language}
                          onViewClick={() =>
                            setPreviewDescription({
                              refNo,
                              description: oDetails,
                              type: typeText,
                              status: statusText,
                              statusDate: formatDateKSA(sDate),
                              isResolved: isResolved
                                ? (isAr ? "منتهي" : "Resolved")
                                : (isAr ? "قيد النظر" : "Active Dispute"),
                            })
                          }
                        />
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            Number(statusCode) === 1 || Number(statusCode) === 2
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                              : Number(statusCode) === 3
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : Number(statusCode) === 4
                              ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {Number(statusCode) === 5 ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : Number(statusCode) === 3 ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {statusText}
                        </span>
                      </td>

                      {/* Status Date */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDateKSA(sDate)}
                      </td>

                      {/* Status Details */}
                      <td className="py-3 px-4">
                        <HoverDescriptionCell
                          text={sDetails}
                          maxWidth="max-w-[200px]"
                          title="Status Remarks"
                          arabicTitle="ملاحظات الحالة"
                          themeColor="amber"
                          language={language}
                        />
                      </td>

                      {/* Resolution Switch Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            {isAr ? "منتهي" : "Resolved"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            {isAr ? "قيد النظر" : "Active Dispute"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title={isAr ? "تعديل الاعتراض" : "Edit Objection"}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            title={isAr ? "حذف الاعتراض" : "Delete Objection"}
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
        {filteredObjections.length > 0 && (
          <TablePagination
            currentPage={page}
            totalItems={filteredObjections.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="objections"
            themeColor="amber"
          />
        )}
      </div>

      {/* ====================================================================
       * MODAL: ADD / EDIT LEGAL CUSTOMER OBJECTION
       * ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FileQuestion className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingItem
                      ? (isAr ? "تعديل طلب الاعتراض" : "Edit Customer Objection")
                      : (isAr ? "تسجيل اعتراض جديد" : "Add Customer Objection")}
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

            {/* Form Body with react-hook-form */}
            <form onSubmit={handleSubmit(handleSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Objection Reference */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "رقم طلب الاعتراض *" : "Objection Reference *"}
                  </label>
                  <input
                    type="text"
                    {...register("objectionReference", {
                      required: isAr ? "رقم طلب الاعتراض مطلوب" : "Objection Reference is required",
                      minLength: { value: 3, message: isAr ? "يجب ألا يقل عن 3 أحرف" : "Reference must be at least 3 characters" },
                    })}
                    placeholder="e.g. OBJ-2026-009"
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 ${
                      errors.objectionReference
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-amber-500/30"
                    }`}
                  />
                  {errors.objectionReference && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.objectionReference.message as string}
                    </p>
                  )}
                </div>

                {/* Objection Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "نوع الاعتراض / المنازعة *" : "Objection Type *"}
                  </label>
                  <select
                    {...register("vbLegalObjectionType", {
                      required: isAr ? "يرجى اختيار نوع الاعتراض" : "Please select an objection type",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.vbLegalObjectionType
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-amber-500/30"
                    }`}
                  >
                    <option value="">{isAr ? "اختر نوع الاعتراض" : "Select Objection Type"}</option>
                    {Object.entries(isAr ? OBJECTION_TYPES_AR : OBJECTION_TYPES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalObjectionType && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.vbLegalObjectionType.message as string}
                    </p>
                  )}
                </div>

                {/* Objection Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "تاريخ تقديم الاعتراض *" : "Objection Filing Date *"}
                  </label>
                  <input
                    type="date"
                    {...register("objectionDate", {
                      required: isAr ? "تاريخ تقديم الاعتراض مطلوب" : "Objection date is required",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.objectionDate
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-amber-500/30"
                    }`}
                  />
                  {errors.objectionDate && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.objectionDate.message as string}
                    </p>
                  )}
                </div>

                {/* Objection Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "حالة دراسة الاعتراض *" : "Objection Status *"}
                  </label>
                  <select
                    {...register("vbLegalObjectionStatus", {
                      required: isAr ? "يرجى اختيار حالة الاعتراض" : "Please select an objection status",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.vbLegalObjectionStatus
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-amber-500/30"
                    }`}
                  >
                    <option value="">{isAr ? "اختر الحالة" : "Select Status"}</option>
                    {Object.entries(isAr ? OBJECTION_STATUSES_AR : OBJECTION_STATUSES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.vbLegalObjectionStatus && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.vbLegalObjectionStatus.message as string}
                    </p>
                  )}
                </div>

                {/* Status Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "تاريخ تحديث الحالة *" : "Status Date *"}
                  </label>
                  <input
                    type="date"
                    {...register("statusDate", {
                      required: isAr ? "تاريخ تحديث الحالة مطلوب" : "Status date is required",
                    })}
                    className={`w-full h-10 px-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 ${
                      errors.statusDate
                        ? "border-rose-500 focus:ring-rose-500/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-amber-500/30"
                    }`}
                  />
                  {errors.statusDate && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.statusDate.message as string}
                    </p>
                  )}
                </div>

                {/* Status Details / Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isAr ? "ملاحظات وتوجيهات الحالة" : "Status Remarks / Instructions"}
                  </label>
                  <input
                    type="text"
                    {...register("statusDetails")}
                    placeholder={isAr ? "مثال: بانتظار تقديم إثبات تعثر من العميل..." : "e.g. Awaiting proof of income disruption from customer"}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Is Resolved Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white block">
                    {isAr ? "تسوية وإنهاء الاعتراض" : "Mark as Resolved"}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {isAr
                      ? "تفعيل الخيار في حال حسم المنازعة أو صدور قرار نهائي أو تسوية النزاع"
                      : "Enable if the dispute has reached final adjudication, settlement, or complete closure"}
                  </span>
                </div>
                <Controller
                  control={control}
                  name="isResolved"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Objection Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isAr ? "أسباب وموضوع الاعتراض بالتفصيل *" : "Objection Grounds & Full Narrative *"}
                </label>
                <textarea
                  rows={3}
                  {...register("objectionDetails", {
                    required: isAr ? "أسباب وتفاصيل الاعتراض مطلوبة" : "Objection grounds and details are required",
                    minLength: { value: 5, message: isAr ? "يجب ألا يقل النص عن 5 أحرف" : "Details must be at least 5 characters" },
                  })}
                  placeholder={
                    isAr
                      ? "أدخل تفاصيل منازعة المدين، أسباب طلب وقف التنفيذ، أو طلبات التسوية..."
                      : "Enter details of debtor dispute, reasons for suspension plea, or settlement claim..."
                  }
                  className={`w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 resize-none ${
                    errors.objectionDetails
                      ? "border-rose-500 focus:ring-rose-500/30"
                      : "border-gray-200 dark:border-gray-700 focus:ring-amber-500/30"
                  }`}
                />
                {errors.objectionDetails && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.objectionDetails.message as string}
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
                  className="h-10 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSubmitting
                      ? (isAr ? "جاري الحفظ..." : "Saving...")
                      : editingItem
                      ? (isAr ? "حفظ التعديلات" : "Update Objection")
                      : (isAr ? "تسجيل الاعتراض" : "Save Objection")}
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
        title={isAr ? "حذف طلب الاعتراض" : "Delete Customer Objection"}
        description={
          isAr
            ? "هل أنت متأكد من رغبتك في حذف هذا الاعتراض؟ سيؤدي ذلك إلى حذف طلب المدين وسجلات المراجعة نهائياً."
            : "Are you sure you want to delete this customer objection record? This will permanently remove the debtor's plea and judicial review logs from the legal case."
        }
        itemName={`Objection #${deleteModalState.item?.OBJECTIONREFERENCE || deleteModalState.item?.objectionReference || deleteModalState.item?.TLCORECID || deleteModalState.item?.tlcoRecId || ""}`}
        confirmText={isAr ? "حذف الاعتراض" : "Delete Objection"}
        isLoading={deleteModalState.isLoading}
      />

      {/* ====================================================================
       * FULL DESCRIPTION PREVIEW MODAL
       * ==================================================================== */}
      {previewDescription && (
        <DescriptionPreviewModal
          isOpen={true}
          onClose={() => setPreviewDescription(null)}
          title="Customer Legal Objection Details"
          arabicTitle="أسباب وتفاصيل الاعتراض القضائي"
          language={language}
          referenceNo={previewDescription.refNo}
          description={previewDescription.description}
          metadata={[
            ...(previewDescription.type ? [{ label: isAr ? "نوع الاعتراض" : "Objection Type", value: previewDescription.type }] : []),
            ...(previewDescription.status ? [{ label: isAr ? "حالة الاعتراض" : "Current Status", value: previewDescription.status }] : []),
            ...(previewDescription.statusDate ? [{ label: isAr ? "تاريخ التحديث" : "Status Date", value: previewDescription.statusDate }] : []),
            ...(previewDescription.isResolved ? [{ label: isAr ? "النتيجة" : "Resolution", value: previewDescription.isResolved }] : []),
          ]}
          themeColor="amber"
        />
      )}
    </div>
  );
};
