"use client";

import React, { useEffect, useState, useCallback } from "react";
import { History, MessageSquareText } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { followupDetailsGet } from "../HandlingAPIs";
import { vbValue, Option } from "@/utils/dropDownApis";
import { formatDateKSA } from "@/utils/helpers";

interface FollowUpHistoryTableProps {
  cifId: number | string | null;
  language: number;
  initialData?: any[];
}

export const FollowUpHistoryTable: React.FC<FollowUpHistoryTableProps> = ({
  cifId,
  language = 1,
  initialData,
}) => {
  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>(
    Array.isArray(initialData) ? initialData : []
  );
  const [vbOptions, setVbOptions] = useState<{
    COLLFOLLOWUPRESULT: Option[];
    COLLFOLLOWUPSUBRESULT: Option[];
    COLLFOLLOWUPNEXTACTION: Option[];
  }>({
    COLLFOLLOWUPRESULT: [],
    COLLFOLLOWUPSUBRESULT: [],
    COLLFOLLOWUPNEXTACTION: [],
  });

  const fetchHistory = useCallback(async () => {
    if (!cifId) return;
    setLoading(true);
    try {
      const data = await followupDetailsGet({ CIFID: cifId, language });
      if (Array.isArray(data)) {
        setHistoryList(data);
      } else if (data && typeof data === "object" && Array.isArray((data as any).data)) {
        setHistoryList((data as any).data);
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      console.error("Error fetching follow up history:", err);
    } finally {
      setLoading(false);
    }
  }, [cifId, language]);

  const fetchVbOptions = useCallback(async () => {
    const langStr = String(language);
    try {
      const [resultRes, subResultRes, nextActionRes] = await Promise.all([
        vbValue("COLLFOLLOWUPRESULT", langStr),
        vbValue("COLLFOLLOWUPSUBRESULT", langStr),
        vbValue("COLLFOLLOWUPNEXTACTION", langStr),
      ]);

      setVbOptions({
        COLLFOLLOWUPRESULT: Array.isArray(resultRes) ? resultRes : [],
        COLLFOLLOWUPSUBRESULT: Array.isArray(subResultRes) ? subResultRes : [],
        COLLFOLLOWUPNEXTACTION: Array.isArray(nextActionRes) ? nextActionRes : [],
      });
    } catch (err) {
      console.error("Error fetching VB options:", err);
    }
  }, [language]);

  useEffect(() => {
    fetchHistory();
    fetchVbOptions();

    const handleFollowUpAdded = () => {
      fetchHistory();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("followup-added", handleFollowUpAdded);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("followup-added", handleFollowUpAdded);
      }
    };
  }, [fetchHistory, fetchVbOptions]);

  const getRowValue = (row: any, keys: string[]) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
      const upper = k.toUpperCase();
      if (row[upper] !== undefined && row[upper] !== null && row[upper] !== "") return row[upper];
    }
    return "-";
  };

  const formatDateWithoutTime = (val: any) => {
    if (!val || val === "-" || val === "null" || val === "—") return "-";
    return formatDateKSA(val) || "-";
  };

  const HoverTextCell: React.FC<{
    value: any;
    title?: string;
    icon?: React.ReactNode;
  }> = ({ value, title, icon }) => {
    if (!value || value === "-" || String(value).trim() === "") {
      return <span className="text-gray-400 dark:text-gray-500 font-normal">-</span>;
    }

    const str = String(value).trim();
    const wordLimit = 5;
    const words = str.split(/\s+/);
    const isLong = str.length > 20 || words.length > wordLimit;

    const displaySnippet = isLong
      ? words.slice(0, wordLimit).join(" ") + "..."
      : str;

    return (
      <TooltipPrimitive.Provider delayDuration={100}>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <div className="inline-flex items-center gap-1.5 cursor-pointer max-w-[180px] group/hovercell py-0.5 rounded transition-colors">
              <span className="text-blue-500/80 group-hover/hovercell:text-blue-600 dark:text-blue-400 dark:group-hover/hovercell:text-blue-300 transition-all shrink-0 group-hover/hovercell:scale-110">
                {icon || <MessageSquareText className="w-3.5 h-3.5" />}
              </span>
              <span className="truncate text-xs font-normal text-gray-900 dark:text-gray-200 group-hover/hovercell:text-blue-600 dark:group-hover/hovercell:text-blue-400 underline decoration-dotted decoration-gray-300 dark:decoration-gray-600 underline-offset-4 group-hover/hovercell:decoration-blue-500 transition-colors">
                {displaySnippet}
              </span>
            </div>
          </TooltipPrimitive.Trigger>

          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              side="bottom"
              align="start"
              sideOffset={6}
              className="z-[9999] w-max min-w-[160px] max-w-[420px] sm:max-w-[480px] rounded-xl bg-white dark:bg-[#0f172a] backdrop-blur-xl border border-gray-200 dark:border-slate-800 shadow-[0_14px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.6)] px-3.5 py-2.5 text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap break-words leading-relaxed max-h-72 overflow-y-auto animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 outline-none select-text"
            >
              {title && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                  <span>{title}</span>
                </div>
              )}
              <div className="text-xs sm:text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap break-words leading-relaxed">
                {str}
              </div>
              <TooltipPrimitive.Arrow className="fill-white dark:fill-[#0f172a]" />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    );
  };

  const tableColumns: ColumnDef<any>[] = [
    {
      accessorKey: "CONTACTDETAILS",
      header: "Contact Details",
      cell: ({ row }) => {
        const val = getRowValue(row.original, ["CONTACTDETAILS", "contactDetails"]);
        return <HoverTextCell value={val} title="Contact Details" />;
      },
    },
    {
      accessorKey: "FOLLOWUPDETAILS",
      header: "Followup Details",
      cell: ({ row }) => {
        const val = getRowValue(row.original, ["FOLLOWUPDETAILS", "followUpDetails"]);
        return (
          <HoverTextCell
            value={val}
            title="Followup Details"
            icon={<MessageSquareText className="w-3.5 h-3.5" />}
          />
        );
      },
    },
    {
      accessorKey: "FOLLOWUPDATE",
      header: "Followup Date",
      cell: ({ row }) =>
        formatDateWithoutTime(
          getRowValue(row.original, ["FOLLOWUPDATE", "followUpDate", "MAKEDATE"])
        ),
    },
    {
      accessorKey: "USERID",
      header: "User ID",
      cell: ({ row }) => getRowValue(row.original, ["USERID", "userId", "MAKER"]),
    },
    {
      accessorKey: "COLLFOLLOWUPRESULT",
      header: "Followup Result",
      cell: ({ row }) => {
        const val = getRowValue(row.original, [
          "COLLFOLLOWUPRESULT_DESC",
          "COLLFOLLOWUPRESULT",
          "VB_COLLFOLLOWUPRESULT",
          "vb_CollFollowUpResult",
          "FOLLOWUPRESULT",
        ]);
        const found = vbOptions.COLLFOLLOWUPRESULT.find(
          (o) => String(o.value) === String(val)
        );
        return found ? found.label : val;
      },
    },
    {
      accessorKey: "COLLFOLLOWUPSUBRESULT",
      header: "Followup Sub Result",
      cell: ({ row }) => {
        const val = getRowValue(row.original, [
          "COLLFOLLOWUPSUBRESULT_DESC",
          "COLLFOLLOWUPSUBRESULT",
          "VB_COLLFOLLOWUPSUBRESULT",
          "vb_CollFollowUpSubResult",
          "FOLLOWUPSUBRESULT",
        ]);
        const found = vbOptions.COLLFOLLOWUPSUBRESULT.find(
          (o) => String(o.value) === String(val)
        );
        return found ? found.label : val;
      },
    },
    {
      accessorKey: "COLLFOLLOWUPNEXTACTION",
      header: "Followup Next Action",
      cell: ({ row }) => {
        const val = getRowValue(row.original, [
          "COLLFOLLOWUPNEXTACTION_DESC",
          "COLLFOLLOWUPNEXTACTION",
          "VB_COLLFOLLOWUPNEXTACTION",
          "vb_CollFollowUpNextAction",
          "FOLLOWUPNEXTACTION",
        ]);
        const found = vbOptions.COLLFOLLOWUPNEXTACTION.find(
          (o) => String(o.value) === String(val)
        );
        return found ? found.label : val;
      },
    },
    {
      accessorKey: "RESULTFULFILLMENTDATE",
      header: "Result Fulfillment Date",
      cell: ({ row }) =>
        formatDateWithoutTime(
          getRowValue(row.original, ["RESULTFULFILLMENTDATE", "resultFulfillmentDate"])
        ),
    },
    {
      accessorKey: "NEXTACTIONDATE",
      header: "Next Action Date",
      cell: ({ row }) =>
        formatDateWithoutTime(
          getRowValue(row.original, ["NEXTACTIONDATE", "nextActionDate"])
        ),
    },
    {
      accessorKey: "FULFILLMENTDATE",
      header: "Fulfillment Date",
      cell: ({ row }) =>
        formatDateWithoutTime(
          getRowValue(row.original, [
            "RESULTFULFILLMENTDATEACTUAL",
            "resultFulfillmentDateActual",
            "FULFILLMENTDATE",
          ])
        ),
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] flex flex-col w-full">
      {/* Top Gradient Accent Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between font-bold text-gray-900 dark:text-white text-sm">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="tracking-wide">Follow Up History Records</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            {historyList.length} Records
          </span>
        </div>
      </div>

      {/* Table Body */}
      <div className="p-5">
        <ReusableDataTable
          initialData={historyList}
          columns={tableColumns}
          loading={loading}
        />
      </div>
    </div>
  );
};

