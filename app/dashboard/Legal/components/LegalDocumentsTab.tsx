"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import axios from "@/utils/axios";
import {
  FileText,
  Plus,
  Eye,
  Download,
  UploadCloud,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FileQuestion,
  Loader2,
  ShieldAlert,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDateKSA } from "@/utils/helpers";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { TablePagination } from "@/components/ui/TablePagination";
import { useAuth } from "@/hooks/useAuth";
import {
  LegalCaseRecord,
  LegalRequiredDocumentRecord,
  AddLegalRequiredDocumentPayload,
  getLegalRequiredDocument,
  addLegalRequiredDocument,
  deleteLegalRequiredDocument,
  getWfMasterDocuments,
  getDocumentRecordId,
} from "../HandlingAPIs";

export interface LegalDocumentsTabProps {
  legalCase?: LegalCaseRecord | null;
  cifId?: number | string;
  loanId?: number | string;
  appId?: number | string;
  language?: number;
}

interface AddDocFormValues {
  documentId: string;
  vbRequiredValidation: string;
}

// Download file helper (decodes base64 and triggers object URL)
function getFileTypeFromExtension(fileName: string): string {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    txt: "text/plain",
    csv: "text/csv",
    zip: "application/zip",
    html: "text/html",
    json: "application/json",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

function downloadFile(base64String: string, fileName: string): string {
  const fileType = getFileTypeFromExtension(fileName);
  const base64Data = base64String.replace(/^data:.+;base64,/, "");
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: fileType });
  return URL.createObjectURL(blob);
}

export const LegalDocumentsTab: React.FC<LegalDocumentsTabProps> = ({
  legalCase,
  cifId: propCifId,
  loanId: propLoanId,
  appId: propAppId,
  language = 1,
}) => {
  const isAr = language === 2;
  const { user } = useAuth();
  const activeUserId = String(
    user?.id || user?.userId || user?.Userid || user?.username || "1"
  );

  // Resolved IDs
  const resolvedCaseId =
    legalCase?.TLLCRECID ||
    legalCase?.tllcRecId ||
    legalCase?.ID ||
    legalCase?.id ||
    1;
  const resolvedCifId =
    propCifId ||
    legalCase?.CIFID ||
    legalCase?.cifId ||
    1;
  const resolvedLoanId =
    propLoanId ||
    legalCase?.LOANID ||
    legalCase?.loanId ||
    10284;
  const resolvedAppId =
    propAppId ||
    legalCase?.APPID ||
    legalCase?.appid ||
    resolvedLoanId ||
    "90550";

  // Data States
  const [documents, setDocuments] = useState<LegalRequiredDocumentRecord[]>([]);
  const [masterDocs, setMasterDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadingDocId, setUploadingDocId] = useState<number | string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterValidation, setFilterValidation] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<LegalRequiredDocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // React Hook Form for Add Document
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddDocFormValues>({
    defaultValues: {
      documentId: "",
      vbRequiredValidation: "1",
    },
  });

  // Fetch Master Documents
  const fetchMasterDocs = useCallback(async () => {
    try {
      const data = await getWfMasterDocuments();
      setMasterDocs(data);
    } catch (e) {
      console.error("Error loading master documents:", e);
    }
  }, []);

  // Fetch Required Documents List
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        tllcRecId: resolvedCaseId,
        TLLCRECID: resolvedCaseId,
        cifId: resolvedCifId,
        CIFID: resolvedCifId,
        loanId: resolvedLoanId,
        LOANID: resolvedLoanId,
        language,
      };
      const res = await getLegalRequiredDocument(params);
      setDocuments(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("Error loading legal documents:", e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [resolvedCaseId, resolvedCifId, resolvedLoanId, language]);

  useEffect(() => {
    fetchMasterDocs();
    fetchDocuments();
  }, [fetchMasterDocs, fetchDocuments]);

  // Master document label picker
  const pickDocLabel = (d: any) => {
    const candidates = [
      d?.Documentname1,
      d?.Documentname,
      d?.DocumentName,
      d?.Documentdesc,
      d?.DocumentDesc,
      d?.Documenttitle,
      d?.DocumentTitle,
      d?.DocName,
      d?.DocDesc,
      d?.Othdesc1,
    ];
    const name = candidates.find(
      (x) => typeof x === "string" && x.trim().length > 0
    );
    return name ? name.trim() : `Document #${d?.Documentid ?? ""}`;
  };

  // Add Document Submission
  const onAddSubmit = async (data: AddDocFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: AddLegalRequiredDocumentPayload = {
        tllcRecId: Number(resolvedCaseId) || 0,
        cifId: Number(resolvedCifId) || 0,
        loanId: Number(resolvedLoanId) || 0,
        documentId: Number(data.documentId),
        vbRequiredValidation: Number(data.vbRequiredValidation),
        dmsDocId: null,
        fileName: null,
        documentFormat: null,
        uploadDate: null,
        uploadBy: null,
        stageName: null,
        othDesc1: null,
        othDesc2: null,
        othDesc3: null,
        othDesc4: null,
        maker: activeUserId || null,
        makeDate: new Date().toISOString(),
        updateBy: null,
        updateDate: null,
        recStatus: true,
      };

      const res = await addLegalRequiredDocument(payload);
      if (res.success) {
        toast.success(
          isAr
            ? "تمت إضافة المستند المطلوب بنجاح"
            : res.message || "Required document added successfully"
        );
        reset({ documentId: "", vbRequiredValidation: "1" });
        await fetchDocuments();
      } else {
        toast.error(
          res.message ||
            (isAr ? "فشل إضافة المستند المطلوب" : "Failed to add required document")
        );
      }
    } catch (err: any) {
      console.error("Add document error:", err);
      toast.error(
        err?.message ||
          (isAr ? "حدث خطأ أثناء إضافة المستند" : "An error occurred while adding document")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Document Confirmation
  const confirmDelete = async () => {
    if (!docToDelete) return;
    const docId = getDocumentRecordId(docToDelete);
    if (!docId) {
      toast.error(isAr ? "معرف المستند غير صالح" : "Invalid document ID");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteLegalRequiredDocument(docId, activeUserId);
      if (res.success) {
        toast.success(
          isAr
            ? "تم حذف المستند بنجاح"
            : res.message || "Required document deleted successfully"
        );
        setDeleteModalOpen(false);
        setDocToDelete(null);
        await fetchDocuments();
      } else {
        toast.error(
          res.message ||
            (isAr ? "فشل حذف المستند" : "Failed to delete required document")
        );
      }
    } catch (err: any) {
      console.error("Delete document error:", err);
      toast.error(isAr ? "حدث خطأ أثناء حذف المستند" : "An error occurred while deleting document");
    } finally {
      setIsDeleting(false);
    }
  };

  // DMS Upload (PutFile)
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    docItem: LegalRequiredDocumentRecord
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const docId = getDocumentRecordId(docItem);
    setUploadingDocId(docId);

    const toBase64 = (fileToConvert: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileToConvert);
        reader.onload = () =>
          resolve(String(reader.result).replace(/^data:(.*,)?/, ""));
        reader.onerror = reject;
      });

    try {
      const fileBase64 = await toBase64(file);
      const dmsUrl = (process.env.DMS_API_KEY || "http://38.247.164.60:8088").replace(/\/+$/, "");

      const docTitle =
        docItem.DOCUMENTNAME ||
        docItem.DOCUMENTTITLE ||
        docItem.DOCUMENTDESC ||
        "LegalRequiredDocument";

      const options = {
        financierID: 3,
        cifID: Number(resolvedCifId) || null,
        idNumber:  Number(resolvedCifId) || null,
        transactionID: String(resolvedCaseId || resolvedLoanId || resolvedAppId),
        moduleID: 1,
        documentType: docTitle,
        documentID: Number(docId) || Number(docItem.documentId) || 1,
        fileData: fileBase64,
        fileName: file.name,
      };

      const response = await axios.post(`${dmsUrl}/api/DocManage/PutFile`, options);

      if (response.data) {
        toast.success(
          isAr
            ? "تم رفع المستند بنجاح إلى نظام إدارة المستندات (DMS)"
            : "Document uploaded successfully to DMS"
        );
        await fetchDocuments();
      } else {
        toast.error(isAr ? "فشل رفع الملف" : "Failed to upload file");
      }
    } catch (error: any) {
      console.error("DMS PutFile error:", error);
      toast.error(
        error?.message || (isAr ? "حدث خطأ أثناء رفع الملف" : "Failed to upload file to DMS")
      );
    } finally {
      setUploadingDocId(null);
    }
  };

  // DMS Download / View (GetFile)
  const handleDocDownload = async (
    docDetails: LegalRequiredDocumentRecord,
    action: "download" | "view"
  ) => {
    setIsDownloading(true);
    try {
      const dmsUrl = (process.env.DMS_API_KEY || "http://38.247.164.60:8088").replace(/\/+$/, "");
      const docRecId = getDocumentRecordId(docDetails);
      const docTitle =
        docDetails.DOCUMENTNAME ||
        docDetails.DOCUMENTTITLE ||
        docDetails.DOCUMENTDESC ||
        "LegalRequiredDocument";

      const response = await axios.get(`${dmsUrl}/api/DocManage/GetFile`, {
        params: {
          FinancierID: 3,
          CifID: Number(resolvedCifId) || undefined,
          IdNumber: docDetails?.IDNUMBER,
          TransactionID: String(resolvedCaseId || resolvedLoanId || resolvedAppId),
          ModuleID: 1,
          DocumentType: docTitle,
          DocumentID: Number(docRecId) || Number(docDetails.documentId) || 1,
        },
      });

      const doc = response?.data?.data?.documents?.[0];
      if (!doc?.fileData || !doc?.fileName) {
        toast.error(
          isAr
            ? "الملف غير متوفر في نظام إدارة المستندات (DMS)"
            : "File not available in DMS repository"
        );
        return;
      }

      const fileUrl = downloadFile(doc.fileData, doc.fileName);
      const anchor = document.createElement("a");
      anchor.href = fileUrl;

      if (action === "download") {
        anchor.setAttribute("download", doc.fileName);
        anchor.click();
      } else {
        anchor.target = "_blank";
        anchor.click();
      }
    } catch (error: any) {
      console.error("DMS GetFile error:", error);
      toast.error(
        isAr ? "تعذر تنزيل المستند من DMS" : "Failed to retrieve file from DMS"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Document Helpers
  const getDocTitle = (doc: LegalRequiredDocumentRecord): string => {
    if (doc.DOCUMENTNAME) return doc.DOCUMENTNAME;
    if (doc.documentName) return doc.documentName;
    if (doc.DOCUMENTTITLE) return doc.DOCUMENTTITLE;
    if (doc.DOCUMENTDESC) return doc.DOCUMENTDESC;
    const matchMaster = masterDocs.find(
      (m) => String(m.Documentid) === String(doc.documentId || doc.DOCUMENTID)
    );
    if (matchMaster) return pickDocLabel(matchMaster);
    return `Required Document #${doc.documentId || doc.DOCUMENTID || getDocumentRecordId(doc)}`;
  };

  const isDocRequired = (doc: LegalRequiredDocumentRecord): boolean => {
    const val =
      doc.vbRequiredValidation ??
      doc.VBREQUIREDVALIDATION ??
      doc.VB_REQUIREDVALIDATION;
    return Number(val) === 1;
  };

  const getDocFileName = (doc: LegalRequiredDocumentRecord): string => {
    return (
      doc.fileName ||
      doc.FILENAME ||
      doc.FileName ||
      ""
    );
  };

  // Filtered & Paginated documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const title = getDocTitle(doc).toLowerCase();
      const code = String(doc.documentId || doc.DOCUMENTID || "").toLowerCase();
      const fileName = getDocFileName(doc).toLowerCase();
      const q = searchQuery.trim().toLowerCase();

      if (q && !title.includes(q) && !code.includes(q) && !fileName.includes(q)) {
        return false;
      }

      const isReq = isDocRequired(doc);
      if (filterValidation === "REQUIRED" && !isReq) return false;
      if (filterValidation === "OPTIONAL" && isReq) return false;

      const hasFile = fileName.length > 0;
      if (filterStatus === "UPLOADED" && !hasFile) return false;
      if (filterStatus === "MISSING" && hasFile) return false;

      return true;
    });
  }, [documents, searchQuery, filterValidation, filterStatus, masterDocs]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const total = documents.length;
    const mandatory = documents.filter((d) => isDocRequired(d)).length;
    const uploaded = documents.filter((d) => getDocFileName(d).trim().length > 0).length;
    const missing = total - uploaded;
    return { total, mandatory, uploaded, missing };
  }, [documents]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300" dir={isAr ? "rtl" : "ltr"}>
      {/* 1. Header & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {isAr ? "إجمالي المستندات المطلوبة" : "Total Required Documents"}
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.total}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Mandatory Requirements */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {isAr ? "المستندات الإلزامية" : "Mandatory Requirements"}
            </span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats.mandatory}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Uploaded & Verified */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {isAr ? "المستندات المرفوعة" : "Uploaded to DMS"}
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.uploaded}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Pending / Missing */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {isAr ? "المستندات المعلقة / المفقودة" : "Pending / Missing Files"}
            </span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {stats.missing}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <FileQuestion className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Add Required Document Form Card */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {isAr ? "إضافة مستند مطلوب للقضية" : "Add Required Legal Document"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAr
                  ? "حدد نوع المستند ومتطلبات التحقق لإدراجه ضمن قائمة المستندات المطلوبة"
                  : "Specify the document type and validation rule to bind to this legal case."}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onAddSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Document ID / Name Select */}
          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>{isAr ? "نوع المستند المطلوب" : "Document Type / Title"}</span>
              <span className="text-red-500 text-[11px]">*</span>
            </label>
            <select
              {...register("documentId", {
                required: isAr ? "يرجى اختيار المستند" : "Please select document",
              })}
              className="h-10 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {isAr ? "— اختر نوع المستند —" : "— Select Document —"}
              </option>
              {masterDocs.map((doc) => (
                <option key={doc.Documentid} value={doc.Documentid}>
                  {pickDocLabel(doc)}
                </option>
              ))}
            </select>
            {errors.documentId && (
              <span className="text-[11px] text-red-500 font-medium">
                {errors.documentId.message}
              </span>
            )}
          </div>

          {/* Required Validation Select */}
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>{isAr ? "متطلب التحقق (إلزامي / اختياري)" : "Required Validation"}</span>
              <span className="text-red-500 text-[11px]">*</span>
            </label>
            <select
              {...register("vbRequiredValidation", {
                required: isAr
                  ? "يرجى تحديد متطلب التحقق"
                  : "Please select validation requirement",
              })}
              className="h-10 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">{isAr ? "مطلوب (إلزامي)" : "Required"}</option>
              <option value="0">{isAr ? "غير مطلوب (اختياري)" : "Not Required"}</option>
            </select>
            {errors.vbRequiredValidation && (
              <span className="text-[11px] text-red-500 font-medium">
                {errors.vbRequiredValidation.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري الإضافة..." : "Adding..."}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? "إضافة المستند" : "Add Document"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Document Repository List & Table */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {isAr ? "قائمة المستندات المطلوبة والمرفوعة" : "Required Documents Repository"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAr
                  ? "عرض وحفظ وتنزيل وثائق القضية والملفات المرتبطة بها"
                  : "View, upload, and download case evidence and legal documentation."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={isAr ? "بحث في المستندات..." : "Search documents..."}
                className="h-9 pl-9 pr-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
              />
            </div>

            {/* Validation Filter */}
            <select
              value={filterValidation}
              onChange={(e) => {
                setFilterValidation(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{isAr ? "كافة المتطلبات" : "All Requirements"}</option>
              <option value="REQUIRED">{isAr ? "إلزامي فقط" : "Required Only"}</option>
              <option value="OPTIONAL">{isAr ? "اختياري فقط" : "Optional Only"}</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{isAr ? "كافة الحالات" : "All Statuses"}</option>
              <option value="UPLOADED">{isAr ? "تم الرفع" : "Uploaded"}</option>
              <option value="MISSING">{isAr ? "مفقود" : "Missing"}</option>
            </select>

            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchDocuments()}
              disabled={loading}
              className="h-9 w-9 p-0 rounded-xl border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              title={isAr ? "تحديث" : "Refresh"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Dynamic Table / Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isAr ? "جاري تحميل المستندات..." : "Loading required documents..."}
            </span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-8 h-8 text-gray-400 mb-1" />
            <p className="text-sm font-semibold">
              {isAr ? "لا توجد مستندات مسجلة" : "No required documents found"}
            </p>
            <p className="text-xs text-gray-400">
              {isAr
                ? "استخدم النموذج أعلاه لإضافة المستندات المطلوبة لهذه القضية."
                : "Use the form above to add required document types to this case."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4">{isAr ? "اسم المستند" : "Document Title"}</th>
                  <th className="py-3 px-4">{isAr ? "رمز المستند" : "Document Code"}</th>
                  <th className="py-3 px-4">{isAr ? "درجة الإلزام" : "Requirement"}</th>
                  <th className="py-3 px-4">{isAr ? "حالة الملف" : "File Status"}</th>
                  <th className="py-3 px-4">{isAr ? "اسم الملف" : "File Name"}</th>
                  <th className="py-3 px-4 text-center">{isAr ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedDocuments.map((doc, idx) => {
                  const docRecId = getDocumentRecordId(doc);
                  const title = getDocTitle(doc);
                  const fileName = getDocFileName(doc);
                  const hasFile = fileName.trim().length > 0;
                  const isRequired = isDocRequired(doc);
                  const isUploading = uploadingDocId === docRecId;

                  return (
                    <tr
                      key={String(docRecId || idx)}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {title}
                          </span>
                        </div>
                      </td>

                      {/* Document ID */}
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px]">
                          <Hash className="w-3 h-3 text-gray-400" />
                          {doc.documentId || doc.DOCUMENTID || docRecId}
                        </span>
                      </td>

                      {/* Required / Optional */}
                      <td className="py-3.5 px-4">
                        {isRequired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" />
                            {isAr ? "مطلوب (إلزامي)" : "Required"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {isAr ? "اختياري" : "Optional"}
                          </span>
                        )}
                      </td>

                      {/* File Status */}
                      <td className="py-3.5 px-4">
                        {hasFile ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? "تم الرفع" : "Uploaded"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" />
                            {isAr ? "مفقود" : "Missing"}
                          </span>
                        )}
                      </td>

                      {/* File Name */}
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                        {hasFile ? fileName : "—"}
                      </td>

                      {/* Actions: View, Download, Upload, Delete (NO Edit) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasFile ? (
                            <>
                              {/* View Button */}
                              <button
                                type="button"
                                disabled={isDownloading}
                                onClick={() => handleDocDownload(doc, "view")}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                title={isAr ? "معاينة الملف" : "View File"}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Download Button */}
                              <button
                                type="button"
                                disabled={isDownloading}
                                onClick={() => handleDocDownload(doc, "download")}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                title={isAr ? "تنزيل الملف" : "Download File"}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            /* Upload Button */
                            <label
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] font-semibold transition-colors cursor-pointer ${
                                isUploading ? "pointer-events-none opacity-50" : ""
                              }`}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>{isAr ? "جاري الرفع..." : "Uploading..."}</span>
                                </>
                              ) : (
                                <>
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  <span>{isAr ? "رفع الملف" : "Upload File"}</span>
                                </>
                              )}
                              <input
                                hidden
                                type="file"
                                accept=".pdf,image/*,.doc,.docx,.xlsx,.txt"
                                onChange={(e) => handleFileUpload(e, doc)}
                              />
                            </label>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setDocToDelete(doc);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title={isAr ? "حذف المستند" : "Delete Document"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Dynamic Pagination */}
        {filteredDocuments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredDocuments.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemName={isAr ? "مستندات" : "documents"}
              themeColor="blue"
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setDocToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
        title={isAr ? "تأكيد حذف المستند؟" : "Delete Required Document?"}
        description={
          isAr
            ? "هل أنت متأكد من رغبتك في حذف هذا المستند المطلوب من ملف القضية؟ لا يمكن التراجع عن هذا الإجراء."
            : "Are you sure you want to delete this required document from the legal case file? This action cannot be undone."
        }
        itemName={docToDelete ? getDocTitle(docToDelete) : undefined}
        confirmText={isAr ? "حذف المستند" : "Delete"}
        cancelText={isAr ? "إلغاء" : "Cancel"}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default LegalDocumentsTab;
