"use client";

import React from "react";
import {
  X,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateKSA } from "@/utils/helpers";

interface EscalatedInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: number;
  cifId?: number | string | null;
  customerName?: string;
  escalatedTo?: string | null;
  escalationDate?: string | null;
  expireDate?: string | null;
  reason?: string | null;
}

const formatDateTime = (val: string | null | undefined): string => {
  if (!val || val === "null" || val === "undefined" || val === "—" || val === "-") {
    return "—";
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const datePart = formatDateKSA(d);
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${datePart} ${hours}:${minutes}`;
    }
  } catch {
    // fallback
  }
  return formatDateKSA(val) || String(val);
};

export const EscalatedInfoModal: React.FC<EscalatedInfoModalProps> = ({
  isOpen,
  onClose,
  language = 1,
  cifId,
  customerName,
  escalatedTo,
  escalationDate,
  expireDate,
  reason,
}) => {
  if (!isOpen) return null;

  const isAr = language === 2;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-white font-sans flex flex-col"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-4 flex items-center justify-between font-bold text-base shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {isAr ? "تفاصيل تصعيد الحالة" : "Case Escalation Details"}
              </h3>
              <p className="text-[11px] font-normal text-amber-100 opacity-90">
                {isAr
                  ? "تم تصعيد هذه الحالة مسبقاً للمراجعة الإشرافية"
                  : "This case has already been escalated for supervisory review"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Status Alert Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold">
                {isAr ? "الحالة مصعدة بالفعل" : "Case Already Escalated"}
              </span>
              <span className="text-[11px] leading-relaxed opacity-90">
                {isAr
                  ? "تم تصعيد هذه القضية مسبقاً، ولا يمكن إعادة تصعيدها مرة أخرى."
                  : "This case has already been escalated. Re-escalation is not permitted."}
              </span>
            </div>
          </div>

          {/* Customer Context (if available) */}
          {(customerName || cifId) && (
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {isAr ? "العميل" : "Customer"}
                </span>
                <span className="font-bold text-gray-900 dark:text-white uppercase">
                  {customerName || "—"}
                </span>
              </div>
              {cifId && (
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    {isAr ? "رقم العميل" : "CIF ID"}
                  </span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                    {cifId}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Escalated To */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-3.5 shadow-2xs flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">
                  {isAr ? "تم التصعيد إلى" : "Escalated To"}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white break-words">
                {escalatedTo || (isAr ? "فريق المراجعة" : "faoperator")}
              </span>
            </div>

            {/* Status */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-3.5 shadow-2xs flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium">{isAr ? "حالة التصعيد" : "Status"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{isAr ? "تم التصعيد" : "Escalated"}</span>
              </div>
            </div>

            {/* Escalation Date */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-3.5 shadow-2xs flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium">
                  {isAr ? "تاريخ التصعيد" : "Escalation Date"}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white font-mono">
                {formatDateTime(escalationDate)}
              </span>
            </div>

            {/* Expiry Date */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-3.5 shadow-2xs flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-medium">
                  {isAr ? "تاريخ الانتهاء" : "Expiry Date"}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white font-mono">
                {formatDateTime(expireDate)}
              </span>
            </div>
          </div>

          {/* Reason if available */}
          {reason && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-3.5 shadow-2xs flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-medium">
                  {isAr ? "سبب التصعيد" : "Escalation Reason"}
                </span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {reason}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-3.5 border-t border-gray-200 dark:border-gray-800 flex justify-end shrink-0">
          <Button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95"
          >
            {isAr ? "إغلاق" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
};
