"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { X, PlusCircle, History, MessageSquareText } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import FormComponent, { FormFieldConfig } from "@/components/FormComponent/FormComponent";
import { ColumnDef } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { followupDetailsGet } from "../page";
import { vbValue, Option } from "@/utils/dropDownApis";

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  cifId: number | string;
  followupData?: Record<string, any>;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  cifId,
  followupData = {},
}) => {
  const selectedLanguage = useSelector(languageParams);
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [vbOptions, setVbOptions] = useState<{
    COLLFOLLOWUPCONTACTTYPE: Option[];
    COLLFOLLOWUPANSWEREDBY: Option[];
    COLLFOLLOWUPRESULT: Option[];
    COLLFOLLOWUPSUBRESULT: Option[];
    COLLFOLLOWUPDELAYREASON: Option[];
    COLLFOLLOWUPNEXTACTION: Option[];
  }>({
    COLLFOLLOWUPCONTACTTYPE: [],
    COLLFOLLOWUPANSWEREDBY: [],
    COLLFOLLOWUPRESULT: [],
    COLLFOLLOWUPSUBRESULT: [],
    COLLFOLLOWUPDELAYREASON: [],
    COLLFOLLOWUPNEXTACTION: [],
  });

  const language = selectedLanguage === "ar" ? 2 : 1;
  const currentUserId = String(authUser?.id || authUser?.Userid || authUser?.username || "1");

  const fetchHistory = async () => {
    if (!cifId) return;
    setLoading(true);
    try {
      const data = await followupDetailsGet({ CIFID: cifId, language });
      if (Array.isArray(data)) {
        setHistoryList(data);
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      console.error("Error fetching follow up history:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVbOptions = async () => {
    const langStr = String(language);
    try {
      const [
        contactTypeRes,
        answeredByRes,
        resultRes,
        subResultRes,
        delayReasonRes,
        nextActionRes,
      ] = await Promise.all([
        vbValue("COLLFOLLOWUPCONTACTTYPE", langStr),
        vbValue("COLLFOLLOWUPANSWEREDBY", langStr),
        vbValue("COLLFOLLOWUPRESULT", langStr),
        vbValue("COLLFOLLOWUPSUBRESULT", langStr),
        vbValue("COLLFOLLOWUPDELAYREASON", langStr),
        vbValue("COLLFOLLOWUPNEXTACTION", langStr),
      ]);

      setVbOptions({
        COLLFOLLOWUPCONTACTTYPE: Array.isArray(contactTypeRes) ? contactTypeRes : [],
        COLLFOLLOWUPANSWEREDBY: Array.isArray(answeredByRes) ? answeredByRes : [],
        COLLFOLLOWUPRESULT: Array.isArray(resultRes) ? resultRes : [],
        COLLFOLLOWUPSUBRESULT: Array.isArray(subResultRes) ? subResultRes : [],
        COLLFOLLOWUPDELAYREASON: Array.isArray(delayReasonRes) ? delayReasonRes : [],
        COLLFOLLOWUPNEXTACTION: Array.isArray(nextActionRes) ? nextActionRes : [],
      });
    } catch (err) {
      console.error("Error fetching VB options:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      fetchVbOptions();
    }
  }, [isOpen, cifId, language]);

  const followUpFormFields: FormFieldConfig[] = [
    {
      name: "vb_CollFollowUpContactType",
      label: "Contact Type",
      type: "select",
      placeholder: "Select Contact Type",
      options: vbOptions.COLLFOLLOWUPCONTACTTYPE,
    },
    {
      name: "vb_CollFollowUpAnsweredBy",
      label: "Answered By",
      type: "select",
      placeholder: "Select Answered By",
      options: vbOptions.COLLFOLLOWUPANSWEREDBY,
    },
    {
      name: "vb_CollFollowUpResult",
      label: "Follow Up Result",
      type: "select",
      placeholder: "Select Follow Up Result",
      options: vbOptions.COLLFOLLOWUPRESULT,
    },
    {
      name: "vb_CollFollowUpSubResult",
      label: "Follow Up Sub Result",
      type: "select",
      placeholder: "Select Sub Result",
      options: vbOptions.COLLFOLLOWUPSUBRESULT,
    },
    {
      name: "vb_CollFollowUpDelayReason",
      label: "Delay Reason",
      type: "select",
      placeholder: "Select Delay Reason",
      options: vbOptions.COLLFOLLOWUPDELAYREASON,
    },
    {
      name: "vb_CollFollowUpNextAction",
      label: "Next Action",
      type: "select",
      placeholder: "Select Next Action",
      options: vbOptions.COLLFOLLOWUPNEXTACTION,
    },
    {
      name: "nextActionDate",
      label: "Next Action Date",
      type: "date",
    },
    {
      name: "resultFulfillmentDate",
      label: "Result Fulfillment Date",
      type: "date",
    },
    {
      name: "fulfillmentAmount",
      label: "Fulfillment Amount",
      type: "number",
      placeholder: "0",
    },
    {
      name: "contactDetails",
      label: "Contact Details",
      type: "textarea",
      rows: 5,
      placeholder: "Enter contact details",
      className: "col-span-1 md:col-span-2 lg:col-span-2 lg:col-start-1",
      inputClassName: "min-h-[140px] resize-y",
    },
    {
      name: "followUpDetails",
      label: "Follow Up Details",
      type: "textarea",
      rows: 5,
      placeholder: "Enter follow up details",
      className: "col-span-1 md:col-span-2 lg:col-span-2",
      inputClassName: "min-h-[140px] resize-y",
    },
  ];

  const handlePostFollowUp = async (dataToPost: Record<string, any>) => {
    setSubmitting(true);
    try {
      const hostUrl = process.env.HOST_API_KEY;
      const nowIso = new Date().toISOString();

      const nextActDateIso = dataToPost.nextActionDate
        ? new Date(dataToPost.nextActionDate).toISOString()
        : nowIso;

      const fulfillmentDateIso = dataToPost.resultFulfillmentDate
        ? new Date(dataToPost.resultFulfillmentDate).toISOString()
        : nowIso;

      const payload = {
        tmcaRecId: Number(followupData?.TMCARECID || followupData?.data?.TMCARECID || 0),
        tctRecId: Number(followupData?.TCTRECID || followupData?.data?.TCTRECID || 0),
        cifId: Number(followupData?.CIFID || followupData?.data?.CIFID || cifId || 0),
        userId: currentUserId,
        followUpDate: nowIso,
        vb_CollFollowUpContactType: Number(
          dataToPost.vb_CollFollowUpContactType ||
          dataToPost.VB_COLLFOLLOWUPCONTACTTYPE ||
          0
        ),
        contactDetails:
          dataToPost.contactDetails || dataToPost.CONTACTDETAILS || "",
        followUpAnswered: true,
        vb_CollFollowUpAnsweredBy: Number(
          dataToPost.vb_CollFollowUpAnsweredBy ||
          dataToPost.VB_COLLFOLLOWUPANSWEREDBY ||
          0
        ),
        vb_CollFollowUpResult: Number(
          dataToPost.vb_CollFollowUpResult ||
          dataToPost.VB_COLLFOLLOWUPRESULT ||
          0
        ),
        vb_CollFollowUpSubResult: Number(
          dataToPost.vb_CollFollowUpSubResult ||
          dataToPost.VB_COLLFOLLOWUPSUBRESULT ||
          0
        ),
        vb_CollFollowUpDelayReason: Number(
          dataToPost.vb_CollFollowUpDelayReason ||
          dataToPost.VB_COLLFOLLOWUPDELAYREASON ||
          0
        ),
        vb_CollFollowUpNextAction: Number(
          dataToPost.vb_CollFollowUpNextAction ||
          dataToPost.VB_COLLFOLLOWUPNEXTACTION ||
          0
        ),
        nextActionDate: nextActDateIso,
        resultFulfillmentDate: fulfillmentDateIso,
        fulfillmentAmount: Number(
          dataToPost.fulfillmentAmount || dataToPost.FULFILLMENTAMOUNT || 0
        ),
        fulfillmentStatus: true,
        resultFulfillmentDateActual: fulfillmentDateIso,
        resultFulfillmentDateExtended: fulfillmentDateIso,
        assignmentId: 0,
        allocationId: 0,
        followUpDetails:
          dataToPost.followUpDetails || dataToPost.FOLLOWUPDETAILS || "",
        makeDate: nowIso,
        maker: currentUserId,
        updateDate: nowIso,
        updateBy: currentUserId,
        recStatus: true,
      };

      const parameters = {
        params: { CIFID: followupData?.CIFID || followupData?.data?.CIFID || cifId, language },
      };

      await axios.post(
        `${hostUrl}/api/TranFollowUpDetails/add-TranFollowUpDetails`,
        payload,
        parameters
      );

      toast.success("Follow Up record added successfully!");
      fetchHistory();
    } catch (err) {
      console.error("Error adding follow up:", err);
      toast.error("Failed to add follow up details");
    } finally {
      setSubmitting(false);
    }
  };

  const getRowValue = (row: any, keys: string[]) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
      const upper = k.toUpperCase();
      if (row[upper] !== undefined && row[upper] !== null && row[upper] !== "") return row[upper];
    }
    return "-";
  };

  const formatDateWithoutTime = (val: any) => {
    if (!val || val === "-") return "-";
    const str = String(val).trim();
    if (str.includes("T")) return str.split("T")[0];
    if (str.includes(" ")) return str.split(" ")[0];
    return str;
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
      cell: ({ row }) => formatDateWithoutTime(getRowValue(row.original, ["FOLLOWUPDATE", "followUpDate", "MAKEDATE"])),
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
        const val = getRowValue(row.original, ["COLLFOLLOWUPRESULT_DESC", "COLLFOLLOWUPRESULT", "VB_COLLFOLLOWUPRESULT", "vb_CollFollowUpResult", "FOLLOWUPRESULT"]);
        const found = vbOptions.COLLFOLLOWUPRESULT.find((o) => String(o.value) === String(val));
        return found ? found.label : val;
      },
    },
    {
      accessorKey: "COLLFOLLOWUPSUBRESULT",
      header: "Followup Sub Result",
      cell: ({ row }) => {
        const val = getRowValue(row.original, ["COLLFOLLOWUPSUBRESULT_DESC", "COLLFOLLOWUPSUBRESULT", "VB_COLLFOLLOWUPSUBRESULT", "vb_CollFollowUpSubResult", "FOLLOWUPSUBRESULT"]);
        const found = vbOptions.COLLFOLLOWUPSUBRESULT.find((o) => String(o.value) === String(val));
        return found ? found.label : val;
      },
    },
    {
      accessorKey: "COLLFOLLOWUPNEXTACTION",
      header: "Followup Next Action",
      cell: ({ row }) => {
        const val = getRowValue(row.original, ["COLLFOLLOWUPNEXTACTION_DESC", "COLLFOLLOWUPNEXTACTION", "VB_COLLFOLLOWUPNEXTACTION", "vb_CollFollowUpNextAction", "FOLLOWUPNEXTACTION"]);
        const found = vbOptions.COLLFOLLOWUPNEXTACTION.find((o) => String(o.value) === String(val));
        return found ? found.label : val;
      },
    },
    {
      accessorKey: "RESULTFULFILLMENTDATE",
      header: "Result Fulfillment Date",
      cell: ({ row }) => formatDateWithoutTime(getRowValue(row.original, ["RESULTFULFILLMENTDATE", "resultFulfillmentDate"])),
    },
    {
      accessorKey: "NEXTACTIONDATE",
      header: "Next Action Date",
      cell: ({ row }) => formatDateWithoutTime(getRowValue(row.original, ["NEXTACTIONDATE", "nextActionDate"])),
    },
    {
      accessorKey: "FULFILLMENTDATE",
      header: "Fulfillment Date",
      cell: ({ row }) => formatDateWithoutTime(getRowValue(row.original, ["RESULTFULFILLMENTDATEACTUAL", "resultFulfillmentDateActual", "FULFILLMENTDATE"])),
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[95vw] xl:max-w-[70vw] rounded-2xl bg-[#f1f5f9] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-white font-sans flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-blue-600 text-white px-6 py-3.5 flex items-center justify-between font-bold text-base shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            <span>Add Follow Up Record</span>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded-lg transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Form Card */}
          <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] p-6 border border-white/40 dark:border-gray-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <FormComponent
                formName="Add New Follow Up"
                numOfColumns={4}
                formFields={followUpFormFields}
                hideAddNewButton={true}
                submitButtonText={submitting ? "Saving..." : "Save Follow Up"}
                responseBody={handlePostFollowUp}
              />
            </div>
          </div>

          {/* History Records Card */}
          <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] p-6 border border-white/40 dark:border-gray-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] flex flex-col gap-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Follow Up History Records
              </h3>

              <ReusableDataTable
                initialData={historyList}
                columns={tableColumns}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
