"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { createPortal } from "react-dom";
import {
  Landmark,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  X,
  Gavel,
  ArrowLeft,
  ChevronRight,
  Calendar,
  Building,
  User,
  Scale,
  ExternalLink,
  FileText,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDateKSA } from "@/utils/helpers";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { TablePagination } from "@/components/ui/TablePagination";
import { useAuth } from "@/hooks/useAuth";
import {
  LegalCaseRecord,
  DEFAULT_LEGAL_CASE,
  LegalNajizCaseRecord,
  AddLegalNajizCasePayload,
  LegalNajizCourtOrderRecord,
  AddLegalNajizCourtOrderPayload,
  getLegalNajizCase,
  addLegalNajizCase,
  updateLegalNajizCase,
  deleteLegalNajizCase,
  getLegalNajizCourtOrder,
  addLegalNajizCourtOrder,
  updateLegalNajizCourtOrder,
  deleteLegalNajizCourtOrder,
  NAJIZ_APPLICATION_TYPES,
  NAJIZ_INSTRUMENT_TYPES,
  LEGAL_DEBTOR_TYPES,
  NAJIZ_SUBMISSION_STATUSES,
  COURT_ORDER_TYPES,
  DEBTOR_NOTICE_STATUSES,
  COURT_ORDER_STATUSES,
} from "../HandlingAPIs";

interface NajizTabProps {
  legalCase?: LegalCaseRecord | null;
  cifId?: number | string;
  loanId?: number | string;
  language?: number;
}

// Hover Tooltip Helper for Table Cells using Portal (zero table scrollbars, dynamic table height)
const CellWithTooltip: React.FC<{
  shortText: string;
  fullText?: string;
  className?: string;
  maxWidth?: string;
}> = ({ shortText, fullText, className = "", maxWidth = "max-w-[200px]" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const tooltipText = fullText || shortText;
  if (!tooltipText || tooltipText === "—") return <span>—</span>;

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - 320));
      setCoords({
        top: rect.bottom + 4,
        left,
      });
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-block ${maxWidth}`}
    >
      <span className={`truncate block cursor-help ${className}`}>
        {shortText}
      </span>
      {mounted &&
        isOpen &&
        coords &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
            }}
            className="pointer-events-none flex flex-col animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="w-2 h-2 bg-slate-900 dark:bg-[#0c1427] border-l border-t border-gray-700 rotate-45 -mb-1 ml-4 z-10" />
            <div className="bg-slate-900/98 dark:bg-[#0c1427] text-white text-[11px] rounded-xl py-2 px-3 shadow-2xl border border-gray-700/80 whitespace-normal min-w-[140px] max-w-[320px] leading-relaxed">
              {tooltipText}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// Hover Tooltip Helper for Long Description (Workflow Style - Smart Upward/Downward, Portal rendered, scrollable & interactive)
const DescriptionCell: React.FC<{
  text?: string;
  maxWidth?: string;
  onViewClick?: () => void;
  language?: number;
}> = ({ text, maxWidth = "max-w-[210px]", onViewClick, language = 1 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    arrowLeft: number;
    isUpward: boolean;
    maxHeight: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsOpen(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!text || text.trim() === "" || text === "—") {
    return <span className="text-gray-400 italic text-[11px]">—</span>;
  }

  const isAr = language === 2;

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 400;
      const left = Math.max(16, Math.min(rect.left, window.innerWidth - (popoverWidth + 24)));
      const arrowLeft = Math.max(16, Math.min(rect.left - left + 16, popoverWidth - 30));

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const isUpward = spaceBelow < 280 || (spaceBelow < 350 && spaceAbove > spaceBelow);
      const availableSpace = isUpward ? spaceAbove - 24 : spaceBelow - 24;
      const computedMaxHeight = Math.max(90, Math.min(240, availableSpace - 50));

      setCoords({
        top: isUpward ? undefined : rect.bottom + 6,
        bottom: isUpward ? window.innerHeight - rect.top + 6 : undefined,
        left,
        arrowLeft,
        isUpward,
        maxHeight: computedMaxHeight,
      });
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block ${maxWidth}`}
    >
      {/* Clickable trigger row */}
      <div
        onClick={onViewClick}
        className="flex items-center gap-1.5 cursor-pointer group/text"
        title={isAr ? "انقر لمعاينة التفاصيل الكاملة" : "Click to view full description"}
      >
        <span className="truncate block text-gray-700 dark:text-gray-300 font-normal group-hover/text:text-emerald-500 transition-colors">
          {text}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewClick?.();
          }}
          title={isAr ? "معاينة التفاصيل" : "Open description preview"}
          className="shrink-0 p-0.5 rounded text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover on hover with smart boundary detection */}
      {mounted &&
        isOpen &&
        coords &&
        createPortal(
          <div
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
            style={{
              position: "fixed",
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              zIndex: 99999,
            }}
            className="flex flex-col animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          >
            {/* Arrow pointing UP when opening downwards */}
            {!coords.isUpward && (
              <div
                style={{ marginLeft: `${coords.arrowLeft}px` }}
                className="w-2.5 h-2.5 bg-slate-900 dark:bg-[#0c1427] border-l border-t border-gray-700 rotate-45 -mb-1 z-10 self-start"
              />
            )}

            {/* Popover Card */}
            <div
              style={{ maxHeight: `${coords.maxHeight}px` }}
              className="bg-slate-900/98 dark:bg-[#0c1427] text-white text-xs rounded-2xl p-3.5 shadow-2xl border border-gray-700/80 whitespace-normal min-w-[280px] max-w-[420px] overflow-y-auto leading-relaxed [scrollbar-width:thin] [scrollbar-color:#10b981_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-emerald-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-400 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between pb-1 border-b border-gray-800">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>{isAr ? "تفاصيل المطالبة" : "Filing Description"}</span>
                </span>
              </div>
              <p className="text-gray-200 text-xs select-text whitespace-pre-wrap break-words leading-relaxed font-normal pt-1">
                {text}
              </p>
              <div className="mt-2 pt-1.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
                <span>{isAr ? "انقر على النص للمعاينة الكاملة" : "Click text to open full view"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onViewClick?.();
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                >
                  {isAr ? "عرض كامل" : "View Full"}
                </button>
              </div>
            </div>

            {/* Arrow pointing DOWN when opening upwards */}
            {coords.isUpward && (
              <div
                style={{ marginLeft: `${coords.arrowLeft}px` }}
                className="w-2.5 h-2.5 bg-slate-900 dark:bg-[#0c1427] border-r border-b border-gray-700 rotate-45 -mt-1 z-10 self-start"
              />
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

const EMPTY_CASE_FORM = {
  najizReference: "",
  vbNajizApplicationType: "" as string | number,
  executionCourt: "",
  fillingDate: "",
  fillingAmount: "" as string | number,
  fillingDescription: "",
  vbNajizInstrumentType: "" as string | number,
  instrumentNumber: "",
  vbLegalDebtorType: 1 as number,
  debtorIdNumber: "",
  vbNajizSubmissionStatus: "" as string | number,
  submissionRemarks: "",
};

const EMPTY_ORDER_FORM = {
  courtOrderReference: "",
  vbLegalCourtOrderType: "" as string | number,
  orderDate: "",
  notificationDate: "",
  vbLegalDebtorNoticeStatus: "" as string | number,
  vbCourtOrderStatus: "" as string | number,
};

export const NajizTab: React.FC<NajizTabProps> = ({
  legalCase,
  cifId,
  loanId,
  language = 1,
}) => {
  const { user: authUser } = useAuth();
  const activeCase = legalCase || DEFAULT_LEGAL_CASE;
  const boundCaseId = activeCase.TLLCRECID || 1;
  const boundCifId = activeCase.CIFID || Number(cifId) || 246;
  const boundLoanId = activeCase.LOANID || Number(loanId) || 10284;

  // View state: "cases" (Main List) or "orders" (Dedicated Orders Page for Selected Case)
  const [viewMode, setViewMode] = useState<"cases" | "orders">("cases");

  // Cases & Orders state - Starts empty (no mock data)
  const [najizCases, setNajizCases] = useState<LegalNajizCaseRecord[]>([]);
  const [courtOrders, setCourtOrders] = useState<LegalNajizCourtOrderRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<LegalNajizCaseRecord | null>(null);

  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // Modals for Najiz Case
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isSubmittingCase, setIsSubmittingCase] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalNajizCaseRecord | null>(null);

  // React Hook Form for Case Modal
  const {
    register: registerCase,
    handleSubmit: handleSubmitCase,
    reset: resetCase,
    formState: { errors: caseErrors },
  } = useForm({
    defaultValues: EMPTY_CASE_FORM,
    mode: "onChange",
  });

  // Modals for Court Order
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<LegalNajizCourtOrderRecord | null>(null);

  // React Hook Form for Court Order Modal
  const {
    register: registerOrder,
    handleSubmit: handleSubmitOrder,
    reset: resetOrder,
    formState: { errors: orderErrors },
  } = useForm({
    defaultValues: EMPTY_ORDER_FORM,
    mode: "onChange",
  });

  // Reusable Delete Modal State (Matching Image 2 design)
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: "case" | "order";
    caseItem: LegalNajizCaseRecord | null;
    orderItem: LegalNajizCourtOrderRecord | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: "case",
    caseItem: null,
    orderItem: null,
    isLoading: false,
  });

  // Description Preview Modal state
  const [viewingDescription, setViewingDescription] = useState<{
    refNo: string;
    description: string;
    appType?: string;
    court?: string;
  } | null>(null);

  // Pagination State for Najiz Cases
  const [casesPage, setCasesPage] = useState(1);
  const [casesPageSize, setCasesPageSize] = useState(10);

  // Pagination State for Court Orders
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(10);

  // Resolve current active logged in user
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
            "aadna"
          );
        }
      } catch {
        // ignore
      }
    }
    return activeCase.APPROVEDBY || "aadna";
  };

  // Fetch Najiz Cases from API
  const fetchNajizCases = useCallback(async () => {
    setLoadingCases(true);
    try {
      const data = await getLegalNajizCase({
        TllcRecId: boundCaseId,
        CifId: boundCifId,
        LoanId: boundLoanId,
        Language: language,
      });
      if (Array.isArray(data)) {
        setNajizCases(data);
        if (selectedCase) {
          const updatedSelected = data.find(
            (c) => (c.TLNCRECID ?? c.tlncRecId) === (selectedCase.TLNCRECID ?? selectedCase.tlncRecId)
          );
          if (updatedSelected) setSelectedCase(updatedSelected);
        }
      } else {
        setNajizCases([]);
      }
    } catch (err) {
      console.error("Error fetching Najiz cases:", err);
      setNajizCases([]);
    } finally {
      setLoadingCases(false);
    }
  }, [boundCaseId, boundCifId, boundLoanId, language, selectedCase]);

  // Fetch Court Orders for a specific case
  const fetchCourtOrders = useCallback(async (caseId?: number | null) => {
    setLoadingOrders(true);
    try {
      const targetCaseId = caseId ?? (selectedCase?.TLNCRECID ?? selectedCase?.tlncRecId);
      const data = await getLegalNajizCourtOrder({
        TlncRecId: targetCaseId || undefined,
        TllcRecId: boundCaseId,
        CifId: boundCifId,
        LoanId: boundLoanId,
        Language: language,
      });
      if (Array.isArray(data)) {
        setCourtOrders(data);
      } else {
        setCourtOrders([]);
      }
    } catch (err) {
      console.error("Error fetching Court Orders:", err);
      setCourtOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [boundCaseId, boundCifId, boundLoanId, language, selectedCase]);

  useEffect(() => {
    fetchNajizCases();
  }, [fetchNajizCases]);

  // Navigate to dedicated Orders page for a case
  const handleViewOrdersForCase = (c: LegalNajizCaseRecord) => {
    setSelectedCase(c);
    const caseId = c.TLNCRECID ?? c.tlncRecId ?? 1;
    fetchCourtOrders(caseId);
    setViewMode("orders");
  };

  // Back to Cases List
  const handleBackToCases = () => {
    setViewMode("cases");
  };

  /* ====================================================================
   * NAJIZ CASE CRUD ACTIONS
   * ==================================================================== */
  const handleOpenAddCase = () => {
    setEditingCase(null);
    resetCase({ ...EMPTY_CASE_FORM });
    setIsCaseModalOpen(true);
  };

  const handleOpenEditCase = (item: LegalNajizCaseRecord) => {
    setEditingCase(item);
    resetCase({
      najizReference: item.NAJIZREFERENCE || item.najizReference || "",
      vbNajizApplicationType: item.VB_NAJIZAPPLICATIONTYPE ?? item.vbNajizApplicationType ?? "",
      executionCourt: item.EXECUTIONCOURT || item.executionCourt || "",
      fillingDate: item.FILLINGDATE ? item.FILLINGDATE.slice(0, 10) : item.fillingDate ? item.fillingDate.slice(0, 10) : "",
      fillingAmount: item.FILLINGAMOUNT !== undefined && item.FILLINGAMOUNT !== null ? String(item.FILLINGAMOUNT) : item.fillingAmount !== undefined ? String(item.fillingAmount) : "",
      fillingDescription: item.FILLINGDESCRIPTION || item.fillingDescription || "",
      vbNajizInstrumentType: item.VB_NAJIZINSTRUMENTTYPE ?? item.vbNajizInstrumentType ?? "",
      instrumentNumber: item.INSTRUMENTNUMBER || item.instrumentNumber || "",
      vbLegalDebtorType: Number(item.VB_LEGALDEBTORTYPE ?? item.vbLegalDebtorType ?? 1),
      debtorIdNumber: item.DEBTORIDNUMBER || item.debtorIdNumber || "",
      vbNajizSubmissionStatus: Number(item.VB_NAJIZSUBMISSIONSTATUS ?? item.vbNajizSubmissionStatus ?? 2),
      submissionRemarks: item.SUBMISSIONREMARKS || item.submissionRemarks || "",
    });
    setIsCaseModalOpen(true);
  };

  const handleSaveCase = async (caseFormData: typeof EMPTY_CASE_FORM) => {
    setIsSubmittingCase(true);
    const currentUser = getLoggedInUser();

    const payload: AddLegalNajizCasePayload = {
      tllcRecId: boundCaseId,
      cifId: boundCifId,
      loanId: boundLoanId,
      najizReference: caseFormData.najizReference.trim(),
      vbNajizApplicationType: Number(caseFormData.vbNajizApplicationType),
      executionCourt: caseFormData.executionCourt.trim() || "Enforcement Court of Riyadh",
      fillingDate: caseFormData.fillingDate
        ? new Date(caseFormData.fillingDate).toISOString()
        : new Date().toISOString(),
      fillingAmount: Number(caseFormData.fillingAmount) || 0,
      fillingDescription: caseFormData.fillingDescription.trim(),
      vbNajizInstrumentType: Number(caseFormData.vbNajizInstrumentType) || 1,
      instrumentNumber: caseFormData.instrumentNumber.trim(),
      vbLegalDebtorType: Number(caseFormData.vbLegalDebtorType) || 1,
      debtorIdNumber: caseFormData.debtorIdNumber.trim(),
      vbNajizSubmissionStatus: Number(caseFormData.vbNajizSubmissionStatus) || 2,
      submissionRemarks: caseFormData.submissionRemarks.trim(),
      submitBy: currentUser,
      updateBy: currentUser,
      updateDate: new Date().toISOString(),
    };

    try {
      if (editingCase) {
        const id = editingCase.TLNCRECID ?? editingCase.tlncRecId;
        if (!id) {
          toast.error("Case ID not found for update");
          setIsSubmittingCase(false);
          return;
        }

        const res = await updateLegalNajizCase(id, payload);
        if (res.success) {
          toast.success(res.message || "Najiz Case updated successfully");
          // Instant direct table update
          setNajizCases((prev) =>
            prev.map((c) =>
              (c.TLNCRECID ?? c.tlncRecId) === id
                ? { ...c, ...payload, TLNCRECID: id, tlncRecId: id }
                : c
            )
          );
          setIsCaseModalOpen(false);
          fetchNajizCases();
        } else {
          toast.error(res.message || "Failed to update Najiz case");
        }
      } else {
        const res = await addLegalNajizCase(payload);
        if (res.success) {
          toast.success(res.message || "Najiz Case created successfully");
          const createdId =
            res.data?.TLNCRECID ??
            res.data?.tlncRecId ??
            Math.max(0, ...najizCases.map((c) => Number(c.TLNCRECID ?? c.tlncRecId ?? 0))) + 1;

          const newCase: LegalNajizCaseRecord = {
            ...payload,
            TLNCRECID: createdId,
            tlncRecId: createdId,
            TLLCRECID: boundCaseId,
            tllcRecId: boundCaseId,
            CIFID: boundCifId,
            cifId: boundCifId,
            LOANID: boundLoanId,
            loanId: boundLoanId,
          };
          // Instant direct table update
          setNajizCases((prev) => [newCase, ...prev]);
          setIsCaseModalOpen(false);
          fetchNajizCases();
        } else {
          toast.error(res.message || "Failed to create Najiz case");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmittingCase(false);
    }
  };

  const handleOpenDeleteCase = (item: LegalNajizCaseRecord) => {
    setDeleteModalState({
      isOpen: true,
      type: "case",
      caseItem: item,
      orderItem: null,
      isLoading: false,
    });
  };

  /* ====================================================================
   * COURT ORDER CRUD ACTIONS
   * ==================================================================== */
  const handleOpenAddOrder = () => {
    setEditingOrder(null);
    resetOrder({ ...EMPTY_ORDER_FORM });
    setIsOrderModalOpen(true);
  };

  const handleOpenEditOrder = (item: LegalNajizCourtOrderRecord) => {
    setEditingOrder(item);
    resetOrder({
      courtOrderReference: item.COURTORDERREFERENCE || item.courtOrderReference || "",
      vbLegalCourtOrderType: item.VB_LEGALCOURTORDERTYPE ?? item.vbLegalCourtOrderType ?? "",
      orderDate: item.ORDERDATE ? item.ORDERDATE.slice(0, 10) : item.orderDate ? item.orderDate.slice(0, 10) : "",
      notificationDate: item.NOTIFICATIONDATE ? item.NOTIFICATIONDATE.slice(0, 10) : item.notificationDate ? item.notificationDate.slice(0, 10) : "",
      vbLegalDebtorNoticeStatus: Number(item.VB_LEGALDEBTORNOTICESTATUS ?? item.vbLegalDebtorNoticeStatus ?? 2),
      vbCourtOrderStatus: Number(item.VB_COURTORDERSTATUS ?? item.vbCourtOrderStatus ?? 1),
    });
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = async (orderFormData: typeof EMPTY_ORDER_FORM) => {
    const parentCaseId = selectedCase?.TLNCRECID ?? selectedCase?.tlncRecId ?? 1;
    const parentNajizRef = selectedCase?.NAJIZREFERENCE || selectedCase?.najizReference || "";

    setIsSubmittingOrder(true);
    const currentUser = getLoggedInUser();

    const payload: AddLegalNajizCourtOrderPayload = {
      tlncRecId: parentCaseId,
      tllcRecId: boundCaseId,
      cifId: boundCifId,
      loanId: boundLoanId,
      najizReference: parentNajizRef,
      courtOrderReference: orderFormData.courtOrderReference.trim(),
      vbLegalCourtOrderType: Number(orderFormData.vbLegalCourtOrderType),
      orderDate: orderFormData.orderDate
        ? new Date(orderFormData.orderDate).toISOString()
        : new Date().toISOString(),
      notificationDate: orderFormData.notificationDate
        ? new Date(orderFormData.notificationDate).toISOString()
        : new Date().toISOString(),
      vbLegalDebtorNoticeStatus: Number(orderFormData.vbLegalDebtorNoticeStatus) || 2,
      vbCourtOrderStatus: Number(orderFormData.vbCourtOrderStatus) || 1,
      updateBy: currentUser,
      updateDate: new Date().toISOString(),
    };

    try {
      if (editingOrder) {
        const id = editingOrder.TLNCORECID ?? editingOrder.tlncoRecId ?? editingOrder.id;
        if (!id) {
          toast.error("Order ID not found for update");
          setIsSubmittingOrder(false);
          return;
        }

        const res = await updateLegalNajizCourtOrder(id, payload);
        if (res.success) {
          toast.success(res.message || "Court Order updated successfully");
          // Instant direct table update
          setCourtOrders((prev) =>
            prev.map((o) =>
              (o.TLNCORECID ?? o.tlncoRecId ?? o.id) === id
                ? { ...o, ...payload, TLNCORECID: id, tlncoRecId: id }
                : o
            )
          );
          setIsOrderModalOpen(false);
          fetchCourtOrders(parentCaseId);
        } else {
          toast.error(res.message || "Failed to update Court Order");
        }
      } else {
        const res = await addLegalNajizCourtOrder(payload);
        if (res.success) {
          toast.success(res.message || "Court Order added successfully");
          const createdId =
            res.data?.TLNCORECID ??
            res.data?.tlncoRecId ??
            res.data?.id ??
            Math.max(0, ...courtOrders.map((o) => Number(o.TLNCORECID ?? o.tlncoRecId ?? o.id ?? 0))) + 1;

          const newOrder: LegalNajizCourtOrderRecord = {
            ...payload,
            TLNCORECID: createdId,
            tlncoRecId: createdId,
            id: createdId,
            TLNCRECID: parentCaseId,
            tlncRecId: parentCaseId,
          };
          // Instant direct table update
          setCourtOrders((prev) => [newOrder, ...prev]);
          setIsOrderModalOpen(false);
          fetchCourtOrders(parentCaseId);
        } else {
          toast.error(res.message || "Failed to add Court Order");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleOpenDeleteOrder = (item: LegalNajizCourtOrderRecord) => {
    setDeleteModalState({
      isOpen: true,
      type: "order",
      caseItem: null,
      orderItem: item,
      isLoading: false,
    });
  };

  // Confirm Delete Action for Case OR Order
  const handleConfirmDelete = async () => {
    const currentUser = getLoggedInUser();
    setDeleteModalState((prev) => ({ ...prev, isLoading: true }));

    try {
      if (deleteModalState.type === "case" && deleteModalState.caseItem) {
        const caseId = deleteModalState.caseItem.TLNCRECID ?? deleteModalState.caseItem.tlncRecId;
        if (!caseId) return;

        const res = await deleteLegalNajizCase(caseId, currentUser);
        if (res.success) {
          toast.success(res.message || "Najiz Case deleted successfully");
          // Instant direct state update
          setNajizCases((prev) =>
            prev.filter((c) => (c.TLNCRECID ?? c.tlncRecId) !== caseId)
          );
          setDeleteModalState({ isOpen: false, type: "case", caseItem: null, orderItem: null, isLoading: false });
          fetchNajizCases();
        } else {
          toast.error(res.message || "Failed to delete Najiz Case");
          setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
        }
      } else if (deleteModalState.type === "order" && deleteModalState.orderItem) {
        const orderId = deleteModalState.orderItem.TLNCORECID ?? deleteModalState.orderItem.tlncoRecId ?? deleteModalState.orderItem.id;
        if (!orderId) return;

        const res = await deleteLegalNajizCourtOrder(orderId, currentUser);
        if (res.success) {
          toast.success(res.message || "Court Order deleted successfully");
          // Instant direct state update
          setCourtOrders((prev) =>
            prev.filter((o) => (o.TLNCORECID ?? o.tlncoRecId ?? o.id) !== orderId)
          );
          setDeleteModalState({ isOpen: false, type: "order", caseItem: null, orderItem: null, isLoading: false });
          const parentId = deleteModalState.orderItem.TLNCRECID ?? deleteModalState.orderItem.tlncRecId;
          fetchCourtOrders(parentId);
        } else {
          toast.error(res.message || "Failed to delete Court Order");
          setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Error deleting item");
      setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Filter Cases
  const filteredCases = najizCases.filter((c) => {
    const ref = c.NAJIZREFERENCE || c.najizReference || "";
    const court = c.EXECUTIONCOURT || c.executionCourt || "";
    const inst = c.INSTRUMENTNUMBER || c.instrumentNumber || "";
    const desc = c.FILLINGDESCRIPTION || c.fillingDescription || "";
    return (
      ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      court.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Paginated Cases (10 per page default)
  const paginatedCases = filteredCases.slice(
    (casesPage - 1) * casesPageSize,
    casesPage * casesPageSize
  );

  // Filter Court Orders for the dedicated Orders Page
  const filteredOrders = courtOrders.filter((order) => {
    const ref = order.COURTORDERREFERENCE || order.courtOrderReference || "";
    const typeText = COURT_ORDER_TYPES[order.VB_LEGALCOURTORDERTYPE ?? order.vbLegalCourtOrderType ?? 1] || "";
    return (
      ref.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      typeText.toLowerCase().includes(orderSearchQuery.toLowerCase())
    );
  });

  // Paginated Court Orders (10 per page default)
  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * ordersPageSize,
    ordersPage * ordersPageSize
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {viewMode === "cases" && (
        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {language === 2 ? "قضايا منصة ناجز" : "Najiz Portal Cases"}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                      {language === 2 ? `قضية رقم #${boundCaseId}` : `Legal Case #${boundCaseId}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {language === 2
                      ? "مطالبات وطلبات التنفيذ الإلكترونية عبر منصة وزارة العدل ناجز"
                      : "Official Ministry of Justice electronic execution claims and applications"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5 shrink-0 ml-auto lg:ml-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Najiz reference, court..."
                    className="h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-48 sm:w-56"
                  />
                </div>

                <button
                  onClick={fetchNajizCases}
                  title="Refresh Najiz cases"
                  className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCases ? "animate-spin" : ""}`} />
                </button>

                <Button
                  onClick={handleOpenAddCase}
                  className="h-9 px-4 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Najiz Case
                </Button>
              </div>
            </div>

            {/* Cases Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold text-[11px] tracking-wider">
                    <th className="py-3 px-5">Najiz Ref</th>
                    <th className="py-3 px-4">Application Type</th>
                    <th className="py-3 px-4 min-w-[200px] max-w-[260px]">Description</th>
                    <th className="py-3 px-4">Execution Court</th>
                    <th className="py-3 px-4">Filing Date</th>
                    <th className="py-3 px-4">Claim Amount</th>
                    <th className="py-3 px-4">Instrument No</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Court Orders</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-14 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                            <Landmark className="w-6 h-6" />
                          </div>
                          <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                            No Najiz Cases Found
                          </span>
                          <p className="text-xs max-w-sm text-gray-500">
                            There are currently no electronic Najiz execution claims registered for this legal case.
                          </p>
                          <Button
                            onClick={handleOpenAddCase}
                            className="mt-2 h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Najiz Case
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCases.map((c, idx) => {
                      const id = c.TLNCRECID ?? c.tlncRecId ?? 1;
                      const refNo = c.NAJIZREFERENCE || c.najizReference || `NAJ-${id}`;
                      const appTypeCode = c.VB_NAJIZAPPLICATIONTYPE ?? c.vbNajizApplicationType ?? 1;
                      const appTypeText =
                        (c.NAJIZAPPLICATIONTYPE && c.NAJIZAPPLICATIONTYPE.trim()) ||
                        (c.najizApplicationType && c.najizApplicationType.trim()) ||
                        NAJIZ_APPLICATION_TYPES[appTypeCode] ||
                        `Type #${appTypeCode}`;
                      const court = c.EXECUTIONCOURT || c.executionCourt || "—";
                      const fDate = c.FILLINGDATE || c.fillingDate;
                      const fAmount = c.FILLINGAMOUNT ?? c.fillingAmount ?? 0;
                      const desc = c.FILLINGDESCRIPTION || c.fillingDescription || "";
                      const instTypeCode = c.VB_NAJIZINSTRUMENTTYPE ?? c.vbNajizInstrumentType ?? 1;
                      const instTypeText =
                        (c.NAJIZINSTRUMENTTYPE && c.NAJIZINSTRUMENTTYPE.trim()) ||
                        (c.najizInstrumentType && c.najizInstrumentType.trim()) ||
                        NAJIZ_INSTRUMENT_TYPES[instTypeCode] ||
                        `Instrument #${instTypeCode}`;
                      const instNo = c.INSTRUMENTNUMBER || c.instrumentNumber || "—";
                      const statusCode = c.VB_NAJIZSUBMISSIONSTATUS ?? c.vbNajizSubmissionStatus ?? 2;
                      const statusText =
                        (c.NAJIZSUBMISSIONSTATUS && c.NAJIZSUBMISSIONSTATUS.trim()) ||
                        (c.najizSubmissionStatus && c.najizSubmissionStatus.trim()) ||
                        NAJIZ_SUBMISSION_STATUSES[statusCode] ||
                        `Status #${statusCode}`;

                      return (
                        <tr
                          key={id}
                          className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors group/row hover:relative hover:z-30"
                        >
                          {/* Najiz Ref */}
                          <td className="py-3 px-5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <Landmark className="w-3.5 h-3.5" />
                              {refNo}
                            </span>
                          </td>

                          {/* Application Type with Hover Tooltip */}
                          <td className="py-3 px-4">
                            <CellWithTooltip
                              shortText={appTypeText.split("(")[0].trim()}
                              fullText={appTypeText}
                              maxWidth="max-w-[190px]"
                            />
                          </td>

                          {/* Description with Hover Tooltip & Click-to-View Modal */}
                          <td className="py-3 px-4">
                            <DescriptionCell
                              text={desc}
                              maxWidth="max-w-[220px]"
                              language={language}
                              onViewClick={() =>
                                setViewingDescription({
                                  refNo,
                                  description: desc,
                                  appType: appTypeText,
                                  court,
                                })
                              }
                            />
                          </td>

                          {/* Execution Court with Hover Tooltip */}
                          <td className="py-3 px-4">
                            <CellWithTooltip
                              shortText={court}
                              fullText={court}
                              maxWidth="max-w-[160px]"
                            />
                          </td>

                          {/* Filing Date */}
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
                            {fDate ? formatDateKSA(fDate) : "—"}
                          </td>

                          {/* Claim Amount */}
                          <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                            SAR {Number(fAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>

                          {/* Instrument Number with Hover Tooltip */}
                          <td className="py-3 px-4 font-mono">
                            <CellWithTooltip
                              shortText={instNo}
                              fullText={`${instTypeText} — No: ${instNo}`}
                              maxWidth="max-w-[130px]"
                            />
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                statusCode === 3 || statusCode === 6
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : statusCode === 4 || statusCode === 5
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {statusText}
                            </span>
                          </td>

                          {/* Navigate to Dedicated Orders Page */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleViewOrdersForCase(c)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white border border-blue-500/20 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              <Gavel className="w-3.5 h-3.5" />
                              <span>View Orders</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditCase(c)}
                                title="Edit Najiz Case"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteCase(c)}
                                title="Delete Najiz Case"
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

            {/* Pagination Controls for Najiz Cases */}
            {filteredCases.length > 0 && (
              <TablePagination
                currentPage={casesPage}
                totalItems={filteredCases.length}
                pageSize={casesPageSize}
                onPageChange={setCasesPage}
                onPageSizeChange={setCasesPageSize}
                itemName="cases"
                themeColor="emerald"
              />
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
       * VIEW 2: DEDICATED SEPARATE COURT ORDERS PAGE FOR SELECTED CASE
       * ==================================================================== */}
      {viewMode === "orders" && selectedCase && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-200">
          {/* Top Breadcrumb & Back Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0c1427] border border-gray-200/80 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleBackToCases}
                className="h-9 px-3 rounded-xl border-gray-300 dark:border-gray-700 text-xs font-semibold flex items-center gap-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Najiz Cases</span>
              </Button>

              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block" />

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Najiz Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Case #{selectedCase.NAJIZREFERENCE || selectedCase.najizReference}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Court Orders
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                {selectedCase.EXECUTIONCOURT || selectedCase.executionCourt || "Enforcement Court of Riyadh"}
              </span>
            </div>
          </div>

          {/* Case Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 via-slate-900/30 to-emerald-950/20 border border-gray-200/80 dark:border-gray-800 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block text-[11px]">Najiz Reference:</span>
                <strong className="text-gray-900 dark:text-white font-mono text-sm">
                  #{selectedCase.NAJIZREFERENCE || selectedCase.najizReference}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Filing Claim Amount:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  SAR {Number(selectedCase.FILLINGAMOUNT ?? selectedCase.fillingAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Instrument / Sanad #:</span>
                <strong className="text-gray-900 dark:text-white font-mono text-sm">
                  {selectedCase.INSTRUMENTNUMBER || selectedCase.instrumentNumber || "—"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Debtor ID:</span>
                <strong className="text-gray-900 dark:text-white font-mono text-sm">
                  {selectedCase.DEBTORIDNUMBER || selectedCase.debtorIdNumber || "—"}
                </strong>
              </div>
            </div>

            {(selectedCase.FILLINGDESCRIPTION || selectedCase.fillingDescription) && (
              <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-800 text-xs">
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold block mb-0.5">
                  {language === 2 ? "تفاصيل المطالبة:" : "Filing Description:"}
                </span>
                <p className="text-gray-800 dark:text-gray-200 text-xs leading-relaxed select-text whitespace-pre-wrap break-words">
                  {selectedCase.FILLINGDESCRIPTION || selectedCase.fillingDescription}
                </p>
              </div>
            )}
          </div>

          {/* Dedicated Court Orders Table Card */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

            {/* Header Controls */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Judicial Court Orders & Execution Decisions
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Article 34 5-day grace notices, Article 46 asset freezes and judicial warrants
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5 shrink-0 ml-auto sm:ml-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search order reference..."
                    className="h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-44 sm:w-52"
                  />
                </div>

                <button
                  onClick={() => fetchCourtOrders(selectedCase.TLNCRECID ?? selectedCase.tlncRecId)}
                  title="Refresh Court Orders"
                  className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
                </button>

                <Button
                  onClick={handleOpenAddOrder}
                  className="h-9 px-4 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap ml-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Court Order
                </Button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold text-[11px] tracking-wider">
                    <th className="py-3 px-5">Order Reference</th>
                    <th className="py-3 px-4 min-w-[220px]">Order Type</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4">Notification Date</th>
                    <th className="py-3 px-4">Debtor Notice Status</th>
                    <th className="py-3 px-4">Order Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                            <Gavel className="w-6 h-6" />
                          </div>
                          <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                            No Court Orders Registered
                          </span>
                          <p className="text-xs max-w-sm text-gray-500">
                            There are currently no judicial orders recorded under Najiz Case #{selectedCase.NAJIZREFERENCE || selectedCase.najizReference}.
                          </p>
                          <Button
                            onClick={handleOpenAddOrder}
                            className="mt-2 h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Court Order
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => {
                      const id = order.TLNCORECID ?? order.tlncoRecId ?? order.id ?? 1;
                      const orderRef = order.COURTORDERREFERENCE || order.courtOrderReference || `ORD-${id}`;
                      const orderTypeCode = order.VB_LEGALCOURTORDERTYPE ?? order.vbLegalCourtOrderType ?? 1;
                      const orderTypeText =
                        COURT_ORDER_TYPES[orderTypeCode] || `Order Type #${orderTypeCode}`;
                      const oDate = order.ORDERDATE || order.orderDate;
                      const nDate = order.NOTIFICATIONDATE || order.notificationDate;

                      const noticeStatusCode =
                        order.VB_LEGALDEBTORNOTICESTATUS ?? order.vbLegalDebtorNoticeStatus ?? 1;
                      const noticeStatusText =
                        DEBTOR_NOTICE_STATUSES[noticeStatusCode] || `Notice #${noticeStatusCode}`;

                      const orderStatusCode =
                        order.VB_COURTORDERSTATUS ?? order.vbCourtOrderStatus ?? 1;
                      const orderStatusText =
                        COURT_ORDER_STATUSES[orderStatusCode] || `Status #${orderStatusCode}`;

                      return (
                        <tr
                          key={id}
                          className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="py-3 px-5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
                              {orderRef}
                            </span>
                          </td>

                          {/* Order Type with Hover Tooltip */}
                          <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                            <CellWithTooltip
                              shortText={orderTypeText.split("(")[0].trim()}
                              fullText={orderTypeText}
                              maxWidth="max-w-[260px]"
                            />
                          </td>

                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
                            {oDate ? formatDateKSA(oDate) : "—"}
                          </td>

                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
                            {nDate ? formatDateKSA(nDate) : "—"}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                noticeStatusCode === 2
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : noticeStatusCode === 3
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {noticeStatusText}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                orderStatusCode === 2
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                  : orderStatusCode === 1
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                  : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                              }`}
                            >
                              {orderStatusText}
                            </span>
                          </td>

                          <td className="py-3 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditOrder(order)}
                                title="Edit Court Order"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteOrder(order)}
                                title="Delete Court Order"
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

            {/* Pagination Controls for Court Orders */}
            {filteredOrders.length > 0 && (
              <TablePagination
                currentPage={ordersPage}
                totalItems={filteredOrders.length}
                pageSize={ordersPageSize}
                onPageChange={setOrdersPage}
                onPageSizeChange={setOrdersPageSize}
                itemName="court orders"
                themeColor="blue"
              />
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
       * MODAL 1: ADD / EDIT NAJIZ CASE
       * ==================================================================== */}
      {isCaseModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingCase) setIsCaseModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#0c1427]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingCase ? "Update Najiz Portal Case" : "Add New Najiz Portal Case"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Submit judicial commercial claim or Sanad Li Amr execution request
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCaseModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCase(handleSaveCase)} className="p-6 space-y-4 overflow-y-auto">
              {/* Row 1: Reference & Application Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Najiz Reference Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerCase("najizReference", {
                      required: "Najiz reference number is required",
                      minLength: { value: 3, message: "Reference must be at least 3 characters" },
                    })}
                    placeholder="e.g. 4510098234"
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                      caseErrors.najizReference
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                    }`}
                  />
                  {caseErrors.najizReference && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {caseErrors.najizReference.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Application Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...registerCase("vbNajizApplicationType", {
                      required: "Please select an application type",
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                      caseErrors.vbNajizApplicationType
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                    }`}
                  >
                    <option value="" disabled>-- Select Application Type --</option>
                    {Object.entries(NAJIZ_APPLICATION_TYPES).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  {caseErrors.vbNajizApplicationType && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {caseErrors.vbNajizApplicationType.message as string}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Court & Filing Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Execution Court <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerCase("executionCourt", {
                      required: "Execution court name is required",
                    })}
                    placeholder="e.g. Enforcement Court of Riyadh"
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                      caseErrors.executionCourt
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                    }`}
                  />
                  {caseErrors.executionCourt && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {caseErrors.executionCourt.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Filing Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerCase("fillingDate", {
                      required: "Filing date is required",
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                      caseErrors.fillingDate
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                    }`}
                  />
                  {caseErrors.fillingDate && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {caseErrors.fillingDate.message as string}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Claim Amount & Instrument Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Filing Claim Amount (SAR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...registerCase("fillingAmount", {
                      required: "Claim amount is required",
                      min: { value: 0.01, message: "Claim amount must be greater than 0" },
                    })}
                    placeholder="e.g. 80000"
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                      caseErrors.fillingAmount
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                    }`}
                  />
                  {caseErrors.fillingAmount && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {caseErrors.fillingAmount.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Instrument Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...registerCase("vbNajizInstrumentType", {
                      required: "Please select an instrument type",
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                      caseErrors.vbNajizInstrumentType
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                    }`}
                  >
                    <option value="" disabled>-- Select Instrument Type --</option>
                    {Object.entries(NAJIZ_INSTRUMENT_TYPES).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  {caseErrors.vbNajizInstrumentType && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {caseErrors.vbNajizInstrumentType.message as string}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: Instrument No & Debtor ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Instrument Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerCase("instrumentNumber", {
                      required: "Instrument number is required",
                    })}
                    placeholder="e.g. NAF-889023"
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                      caseErrors.instrumentNumber
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                    }`}
                  />
                  {caseErrors.instrumentNumber && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {caseErrors.instrumentNumber.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Debtor ID / Iqama Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerCase("debtorIdNumber", {
                      required: "Debtor ID or Iqama number is required",
                    })}
                    placeholder="e.g. 1083921098"
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                      caseErrors.debtorIdNumber
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                    }`}
                  />
                  {caseErrors.debtorIdNumber && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {caseErrors.debtorIdNumber.message as string}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 5: Submission Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Submission Status <span className="text-rose-500">*</span>
                </label>
                <select
                  {...registerCase("vbNajizSubmissionStatus", {
                    required: "Please select submission status",
                  })}
                  className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                    caseErrors.vbNajizSubmissionStatus
                      ? "border-rose-500 focus:ring-rose-500/40"
                      : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                  }`}
                >
                  <option value="" disabled>-- Select Submission Status --</option>
                  {Object.entries(NAJIZ_SUBMISSION_STATUSES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                {caseErrors.vbNajizSubmissionStatus && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {caseErrors.vbNajizSubmissionStatus.message as string}
                  </p>
                )}
              </div>

              {/* Row 6: Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Filing Description / Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  {...registerCase("fillingDescription", {
                    required: "Filing description is required",
                    minLength: { value: 5, message: "Description must be at least 5 characters" },
                  })}
                  placeholder="Enter details about this executive application..."
                  className={`w-full p-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs resize-none ${
                    caseErrors.fillingDescription
                      ? "border-rose-500 focus:ring-rose-500/40"
                      : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40"
                  }`}
                />
                {caseErrors.fillingDescription && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {caseErrors.fillingDescription.message as string}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCaseModalOpen(false)}
                  disabled={isSubmittingCase}
                  className="h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingCase}
                  className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isSubmittingCase ? "Saving..." : editingCase ? "Update Case" : "Save Najiz Case"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
       * MODAL 2: ADD / EDIT NAJIZ COURT ORDER
       * ==================================================================== */}
      {isOrderModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingOrder) setIsOrderModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#0c1427]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingOrder ? "Update Court Order" : "Add Judicial Court Order"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Record Article 34 notification or Article 46 enforcement decision
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder(handleSaveOrder)} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Court Order Reference Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...registerOrder("courtOrderReference", {
                    required: "Court Order reference is required",
                    minLength: { value: 3, message: "Reference must be at least 3 characters" },
                  })}
                  placeholder="e.g. ORD-34-2026-001"
                  className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                    orderErrors.courtOrderReference
                      ? "border-rose-500 focus:ring-rose-500/40"
                      : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                  }`}
                />
                {orderErrors.courtOrderReference && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {orderErrors.courtOrderReference.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Court Order Type <span className="text-rose-500">*</span>
                </label>
                <select
                  {...registerOrder("vbLegalCourtOrderType", {
                    required: "Please select a court order type",
                  })}
                  className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                    orderErrors.vbLegalCourtOrderType
                      ? "border-rose-500 focus:ring-rose-500/40"
                      : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                  }`}
                >
                  <option value="" disabled>-- Select Court Order Type --</option>
                  {Object.entries(COURT_ORDER_TYPES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                {orderErrors.vbLegalCourtOrderType && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {orderErrors.vbLegalCourtOrderType.message as string}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Order Issue Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerOrder("orderDate", {
                      required: "Order issue date is required",
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                      orderErrors.orderDate
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                    }`}
                  />
                  {orderErrors.orderDate && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {orderErrors.orderDate.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Notification Date (Absher) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerOrder("notificationDate", {
                      required: "Notification date is required",
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 shadow-xs ${
                      orderErrors.notificationDate
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                    }`}
                  />
                  {orderErrors.notificationDate && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {orderErrors.notificationDate.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Debtor Notice Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...registerOrder("vbLegalDebtorNoticeStatus", {
                      required: "Please select debtor notice status",
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                      orderErrors.vbLegalDebtorNoticeStatus
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                    }`}
                  >
                    <option value="" disabled>-- Select Notice Status --</option>
                    {Object.entries(DEBTOR_NOTICE_STATUSES).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  {orderErrors.vbLegalDebtorNoticeStatus && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {orderErrors.vbLegalDebtorNoticeStatus.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Order Execution Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...registerOrder("vbCourtOrderStatus", {
                      required: "Please select order status",
                    })}
                    className={`w-full h-10 px-3 text-xs rounded-xl border bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                      orderErrors.vbCourtOrderStatus
                        ? "border-rose-500 focus:ring-rose-500/40"
                        : "border-gray-200 dark:border-gray-700 focus:ring-blue-500/40"
                    }`}
                  >
                    <option value="" disabled>-- Select Order Status --</option>
                    {Object.entries(COURT_ORDER_STATUSES).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  {orderErrors.vbCourtOrderStatus && (
                    <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {orderErrors.vbCourtOrderStatus.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOrderModalOpen(false)}
                  disabled={isSubmittingOrder}
                  className="h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isSubmittingOrder ? "Saving..." : editingOrder ? "Update Order" : "Save Court Order"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
       * MODAL 3: CASE DESCRIPTION FULL PREVIEW MODAL
       * ==================================================================== */}
      {viewingDescription && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingDescription(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#09101f]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{language === 2 ? "تفاصيل المطالبة" : "Filing Description"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-semibold border border-emerald-500/20">
                      #{viewingDescription.refNo}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {language === 2
                      ? "تفاصيل المطالبة وملاحظات التنفيذ القضائي"
                      : "Full claim description and execution notes"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDescription(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3.5 [scrollbar-width:thin] [scrollbar-color:#10b981_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-emerald-500/40 [&::-webkit-scrollbar-thumb]:rounded-full">
              {viewingDescription.appType && (
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pb-2.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Application Type:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{viewingDescription.appType}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800">
                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap select-text font-normal">
                  {viewingDescription.description}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-gray-50/50 dark:bg-[#09101f]">
              <Button
                type="button"
                onClick={() => setViewingDescription(null)}
                className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * REUSABLE DELETE CONFIRMATION MODAL (EXACT IMAGE 2 DESIGN)
       * ==================================================================== */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState({
            isOpen: false,
            type: "case",
            caseItem: null,
            orderItem: null,
            isLoading: false,
          })
        }
        onConfirm={handleConfirmDelete}
        title={
          deleteModalState.type === "case"
            ? "Delete Najiz Case?"
            : "Delete Court Order?"
        }
        description={
          deleteModalState.type === "case"
            ? "Your Najiz case will be permanently deleted and cannot be recovered."
            : "Your court order will be permanently deleted and cannot be recovered."
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteModalState.isLoading}
      />
    </div>
  );
};
