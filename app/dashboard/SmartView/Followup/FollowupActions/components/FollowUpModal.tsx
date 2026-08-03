"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { X, PlusCircle, History } from "lucide-react";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import FormComponent, { FormFieldConfig } from "@/components/FormComponent/FormComponent";
import { ColumnDef } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { followupDetailsGet } from "../page";

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

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, cifId, language]);

  const followUpFormFields: FormFieldConfig[] = [
    {
      name: "contactDetails",
      label: "Contact Details",
      type: "text",
      placeholder: "Enter contact details",
    },
    {
      name: "followUpDetails",
      label: "Follow Up Details",
      type: "text",
      placeholder: "Enter follow up details",
    },
    {
      name: "vb_CollFollowUpContactType",
      label: "Contact Type",
      type: "number",
      placeholder: "0",
    },
    {
      name: "vb_CollFollowUpAnsweredBy",
      label: "Answered By",
      type: "number",
      placeholder: "0",
    },
    {
      name: "vb_CollFollowUpResult",
      label: "Follow Up Result",
      type: "number",
      placeholder: "0",
    },
    {
      name: "vb_CollFollowUpSubResult",
      label: "Follow Up Sub Result",
      type: "number",
      placeholder: "0",
    },
    {
      name: "vb_CollFollowUpDelayReason",
      label: "Delay Reason",
      type: "number",
      placeholder: "0",
    },
    {
      name: "vb_CollFollowUpNextAction",
      label: "Next Action",
      type: "number",
      placeholder: "0",
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
      name: "bucket",
      label: "Bucket",
      type: "text",
      placeholder: "Bucket",
    },
  ];

  const handlePostFollowUp = async (dataToPost: Record<string, any>) => {
    setSubmitting(true);
    try {
      const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
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
        bucket: dataToPost.bucket || dataToPost.BUCKET || "",
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

  const tableColumns: ColumnDef<any>[] = [
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
      cell: ({ row }) => getRowValue(row.original, ["COLLFOLLOWUPRESULT", "COLLFOLLOWUPRESULT_DESC", "VB_COLLFOLLOWUPRESULT", "vb_CollFollowUpResult", "FOLLOWUPRESULT"]),
    },
    {
      accessorKey: "COLLFOLLOWUPSUBRESULT",
      header: "Followup Sub Result",
      cell: ({ row }) => getRowValue(row.original, ["COLLFOLLOWUPSUBRESULT", "COLLFOLLOWUPSUBRESULT_DESC", "VB_COLLFOLLOWUPSUBRESULT", "vb_CollFollowUpSubResult", "FOLLOWUPSUBRESULT"]),
    },
    {
      accessorKey: "COLLFOLLOWUPNEXTACTION",
      header: "Followup Next Action",
      cell: ({ row }) => getRowValue(row.original, ["COLLFOLLOWUPNEXTACTION", "COLLFOLLOWUPNEXTACTION_DESC", "VB_COLLFOLLOWUPNEXTACTION", "vb_CollFollowUpNextAction", "FOLLOWUPNEXTACTION"]),
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
