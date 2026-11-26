"use client";

import React, { useState } from "react";
import { X, Copy, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface DescriptionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  arabicTitle?: string;
  referenceNo?: string;
  description: string;
  metadata?: { label: string; value: string | number }[];
  themeColor?: "emerald" | "blue" | "indigo" | "purple" | "cyan" | "amber";
  language?: number;
}

export const DescriptionPreviewModal: React.FC<DescriptionPreviewModalProps> = ({
  isOpen,
  onClose,
  title = "Full Description Preview",
  arabicTitle = "معاينة التفاصيل الكاملة",
  referenceNo,
  description,
  metadata = [],
  themeColor = "indigo",
  language = 1,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isAr = language === 2;
  const displayTitle = isAr ? (arabicTitle || title) : title;

  const colorStyles = {
    emerald: {
      accent: "from-emerald-500 via-teal-500 to-cyan-500",
      iconBg: "bg-emerald-500/10 text-emerald-400",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    blue: {
      accent: "from-blue-500 via-indigo-500 to-cyan-500",
      iconBg: "bg-blue-500/10 text-blue-400",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    indigo: {
      accent: "from-indigo-500 via-sky-500 to-emerald-500",
      iconBg: "bg-indigo-500/10 text-indigo-400",
      badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      button: "bg-indigo-600 hover:bg-indigo-700 text-white",
    },
    cyan: {
      accent: "from-cyan-500 via-teal-500 to-blue-500",
      iconBg: "bg-cyan-500/10 text-cyan-400",
      badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      button: "bg-cyan-600 hover:bg-cyan-700 text-white",
    },
    purple: {
      accent: "from-purple-500 via-pink-500 to-indigo-500",
      iconBg: "bg-purple-500/10 text-purple-400",
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      button: "bg-purple-600 hover:bg-purple-700 text-white",
    },
    amber: {
      accent: "from-amber-500 via-orange-500 to-rose-500",
      iconBg: "bg-amber-500/10 text-amber-400",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
    },
  }[themeColor];

  const handleCopy = () => {
    navigator.clipboard.writeText(description);
    setCopied(true);
    toast.success("Description copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#0c1427] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top colored strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${colorStyles.accent}`} />

        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${colorStyles.iconBg}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {displayTitle}
                </h3>
                {referenceNo && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border ${colorStyles.badge}`}>
                    {referenceNo}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Chips if present */}
        {metadata.length > 0 && (
          <div className="px-5 py-3 bg-gray-50/60 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800/80 flex flex-wrap gap-3">
            {metadata.map((m, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400">{m.label}:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 [scrollbar-width:thin] [scrollbar-color:#6366f1_transparent]">
          <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800/60">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap select-text font-normal">
              {description}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-[#0c1427] flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-9 px-3.5 rounded-xl border-gray-200 dark:border-gray-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied" : "Copy Description"}</span>
          </Button>

          <Button
            type="button"
            onClick={onClose}
            className={`h-9 px-5 rounded-xl text-xs font-semibold cursor-pointer ${colorStyles.button}`}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
