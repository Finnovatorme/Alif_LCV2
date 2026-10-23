"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";
import Image from "next/image";
import { formatDateKSA, isDateString } from "@/utils/helpers";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any> | null;
  title?: string;
  keyMappings?: Record<string, string>;
}

export const ViewModal: React.FC<ViewModalProps> = ({
  isOpen,
  onClose,
  data,
  title = "View Details",
  keyMappings = {},
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !data || !mounted) return null;

  const formatBoolean = (value: boolean) => (value ? "Yes" : "No");

  const formatAmount = (value: any) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isImageField = (key: string) =>
    key.toLowerCase().includes("image") ||
    key.toLowerCase().includes("logo") ||
    key.toLowerCase().includes("icon") ||
    key.toLowerCase().includes("pic");

  const renderValue = (key: string) => {
    const value = data[key];

    if (value === null || value === undefined || value === "") return "-";

    if (typeof value === "boolean") return formatBoolean(value);

    if (
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("os") ||
      key.toLowerCase().includes("paid") ||
      key.toLowerCase().includes("charges")
    ) {
      return formatAmount(value);
    }

    if (isImageField(key)) {
      return (
        <Image
          src={
            value.startsWith("data:image")
              ? value
              : `data:image/jpeg;base64,${value}`
          }
          alt="Image"
          width={100}
          height={100}
          className="max-h-28 object-contain"
        />
      );
    }

    if (isDateString(value)) {
      return formatDateKSA(value);
    }

    return String(value);
  };

  const entries = Object.keys(keyMappings).length > 0
    ? Object.entries(keyMappings)
    : Object.keys(data).map((k) => [k, k.replace(/([A-Z])/g, " $1").toUpperCase()]);

  const rows = [];
  for (let i = 0; i < entries.length; i += 2) {
    rows.push(entries.slice(i, i + 2));
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl mx-auto h-[85vh] max-h-[720px] flex flex-col relative overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 z-50" />
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Comprehensive Field Breakdown</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-9 w-9 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-6 scrollbar-thin">
          <table className="w-full border-collapse">
            <tbody>
              {rows.map((pair, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b border-slate-100 dark:border-slate-800/60 ${
                    rowIndex % 2 === 0 ? "bg-slate-50/60 dark:bg-slate-800/30" : "bg-white dark:bg-slate-900"
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/4">
                    {pair[0]?.[1]}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white w-1/4 break-words">
                    {pair[0] ? renderValue(pair[0][0]) : "-"}
                  </td>

                  <td className="px-4 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/4">
                    {pair[1]?.[1] ?? ""}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white w-1/4 break-words">
                    {pair[1] ? renderValue(pair[1][0]) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0">
          <Button
            onClick={onClose}
            className="px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
