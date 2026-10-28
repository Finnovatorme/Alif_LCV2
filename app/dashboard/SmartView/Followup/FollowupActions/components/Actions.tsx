"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  Phone,
  MessageSquare,
  MessageCircle,
  Mail,
  ArrowLeft,
  X,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  dashboardParams,
  hasDashabordParams,
  languageParams,
} from "@/lib/redux/slices/dashboardApplSlice";
import { setSelectedUserId } from "@/lib/redux/slices/userTabSlice";
import { useAuth } from "@/hooks/useAuth";
import { vbValue, Option } from "@/utils/dropDownApis";
import { toast } from "sonner";

import { FollowUpModal } from "./FollowUpModal";
import {
  getNotificationNames,
  getNotificationTemplate,
  insertFollowupNotification,
  getAllNotifications,
  getMessageHistory,
  getCustomerContractsList,
  NotificationNameItem,
  AllNotificationItem,
  MessageHistoryItem,
  GetNotificationTemplatePayload,
  InsertFollowupNotificationPayload,
} from "../HandlingAPIs";

interface ActionsProps {
  cifId?: number | string | null;
  customerDetails?: Record<string, any>;
  followupDetails?: Record<string, any>;
  loanContracts?: any[];
}

interface TemplateItem {
  id: number;
  title: string;
  content: string;
}

interface FormattedHistoryItem {
  id: string | number;
  title: string;
  date: string;
  time: string;
  status: string;
}

export const Actions: React.FC<ActionsProps> = ({
  cifId,
  customerDetails,
  followupDetails,
  loanContracts: initialLoanContracts,
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const smartView = useSelector(dashboardParams);
  const selectedLanguage = useSelector(languageParams);
  const { user: authUser } = useAuth();

  const language = selectedLanguage === "ar" ? 2 : 1;
  const activeUpdateBy = String(
    authUser?.id || authUser?.Userid || authUser?.username || "1"
  );

  const [loanContracts, setLoanContracts] = useState<any[]>(
    initialLoanContracts || []
  );

  useEffect(() => {
    if (initialLoanContracts && initialLoanContracts.length > 0) {
      setLoanContracts(initialLoanContracts);
    }
  }, [initialLoanContracts]);

  // Helper to resolve verified IDs checking loan data first, then customer/followup details
  const resolveIds = useCallback(
    (contractsList: any[] = loanContracts) => {
      const firstContract =
        Array.isArray(contractsList) && contractsList.length > 0
          ? contractsList[0]
          : null;

      // 1. CIF ID: Check props, smartView, customerDetails, followupDetails, then loan contract
      const rawCif =
        cifId ??
        customerDetails?.CIFID ??
        followupDetails?.CIFID ??
        smartView?.CIFID ??
        firstContract?.CIFID ??
        null;
      const resolvedCifId: number | null =
        rawCif !== null &&
          rawCif !== undefined &&
          !isNaN(Number(rawCif)) &&
          Number(rawCif) > 0
          ? Number(rawCif)
          : null;

      // 2. APP ID: In Followup/Collection there is no Application ID, so it is strictly null unless coming from an application workflow
      const rawAppId =
        customerDetails?.APPLICATIONID ??
        followupDetails?.APPLICATIONID ??
        smartView?.APPLICATIONID ??
        null;
      const resolvedAppId: number | null =
        rawAppId !== null &&
          rawAppId !== undefined &&
          !isNaN(Number(rawAppId)) &&
          Number(rawAppId) > 0
          ? Number(rawAppId)
          : null;

      // 3. APPCIF ID: Check customerDetails, smartView, or loan contract
      const rawAppCifId =
        customerDetails?.APPCIFID ??
        customerDetails?.Appcifid ??
        smartView?.APPCIFID ??
        firstContract?.APPCIFID ??
        null;
      const resolvedAppCifId: number | null =
        rawAppCifId !== null &&
          rawAppCifId !== undefined &&
          !isNaN(Number(rawAppCifId)) &&
          Number(rawAppCifId) > 0
          ? Number(rawAppCifId)
          : null;

      // 4. ID NUMBER: Check customerDetails, followupDetails, smartView, or loan contract
      const rawIdNumber =
        customerDetails?.IDNUMBER ??
        customerDetails?.Idnumber ??
        followupDetails?.IDNUMBER ??
        smartView?.IDNUMBER ??
        firstContract?.IDNUMBER ??
        null;
      const resolvedIdNumber: string | null =
        rawIdNumber &&
          String(rawIdNumber).trim() !== "" &&
          String(rawIdNumber).toLowerCase() !== "string" &&
          String(rawIdNumber) !== "—"
          ? String(rawIdNumber).trim()
          : null;

      return {
        cifId: resolvedCifId,
        appId: resolvedAppId,
        appCifId: resolvedAppCifId,
        idNumber: resolvedIdNumber,
      };
    },
    [cifId, customerDetails, followupDetails, smartView, loanContracts]
  );

  const currentResolved = resolveIds();
  const activeCifId = currentResolved.cifId;
  const activeAppId = currentResolved.appId;
  const activeAppCifId = currentResolved.appCifId;
  const activeIdNumber = currentResolved.idNumber;

  // Proactively fetch loan data contracts if not available yet and activeCifId exists
  useEffect(() => {
    if (!activeCifId || loanContracts.length > 0) return;

    const fetchLoanData = async () => {
      try {
        const contracts = await getCustomerContractsList({
          CIFID: activeCifId,
          language: language,
        });
        if (Array.isArray(contracts) && contracts.length > 0) {
          setLoanContracts(contracts);
        }
      } catch (err) {
        console.error("Error checking loan contracts for APPID:", err);
      }
    };

    fetchLoanData();
  }, [activeCifId, loanContracts.length, language]);

  const handleSmartViewClick = () => {
    const targetCif = activeCifId || 1;
    const payload = {
      ...smartView,
      ...customerDetails,
      ...followupDetails,
      CIFID: targetCif,
      language: language,
    };

    dispatch(hasDashabordParams(payload));
    dispatch(setSelectedUserId(Number(targetCif)));
    localStorage.setItem("searchContractParams", JSON.stringify(payload));

    router.push("/dashboard/SmartView/SearchContracts/ContractDetails");
  };

  const [openCallModal, setOpenCallModal] = useState(false);
  const [openCommunicationModal, setOpenCommunicationModal] = useState(false);
  const [openFollowUpModal, setOpenFollowUpModal] = useState(false);
  const [commType, setCommType] = useState<"sms" | "whatsapp" | "email">("sms");

  // Dynamic template & history states
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingTemplateContent, setLoadingTemplateContent] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTemplates, setActiveTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [messageContent, setMessageContent] = useState("");
  const [historyList, setHistoryList] = useState<FormattedHistoryItem[]>([]);
  const [notifTypeOptions, setNotifTypeOptions] = useState<Option[]>([]);
  const allNotificationsCache = useRef<AllNotificationItem[]>([]);

  // Customer contact info
  const customerFullName =
    customerDetails?.CUSTOMERNAME ||
    customerDetails?.FULLNAME ||
    customerDetails?.CUSTOMERFULLNAME ||
    smartView?.CUSTOMERNAME ||
    smartView?.CUSTOMERFULLNAME ||
    "ALZAHRANI FATIMAH AHMED";

  const customerContactNumber =
    customerDetails?.MOBILENUMBER ||
    customerDetails?.PRIMARYCONTACT ||
    customerDetails?.CONTACTNUMBER ||
    smartView?.MOBILENUMBER ||
    smartView?.PRIMARYCONTACT ||
    "0531646712";

  const customerEmail =
    customerDetails?.EMAIL ||
    customerDetails?.Email ||
    smartView?.EMAIL ||
    "customer@example.com";

  // Dummy Call History matching layout
  const dummyCallHistory = [
    { id: 1, duration: "03m 42s", date: "8/3/2026", time: "03:56 PM", status: "Completed" },
    { id: 2, duration: "03m 42s", date: "8/3/2026", time: "03:56 PM", status: "Completed" },
    { id: 3, duration: "03m 42s", date: "8/3/2026", time: "03:56 PM", status: "Completed" },
    { id: 4, duration: "03m 42s", date: "8/3/2026", time: "", status: "" },
  ];

  // Helper to interpolate placeholder tags in templates
  const interpolateTemplate = useCallback(
    (rawText: string) => {
      if (!rawText) return "";
      return rawText
        .replace(/\{CUSTOMERFULLNAME\}/gi, customerFullName)
        .replace(/\{CUSTOMERNAME\}/gi, customerFullName)
        .replace(/\{FULLNAME\}/gi, customerFullName)
        .replace(/\{CONTACTNUMBER\}/gi, customerContactNumber)
        .replace(/\{MOBILENUMBER\}/gi, customerContactNumber)
        .replace(/\{EMAIL\}/gi, customerEmail)
        .replace(/\{CIFID\}/gi, String(activeCifId))
        .replace(/\{APPID\}/gi, String(activeAppId));
    },
    [customerFullName, customerContactNumber, customerEmail, activeCifId, activeAppId]
  );

  // Helper to format date & time for history cards
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: "12/3/2024", time: "09:28 AM" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: "" };
      const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return { date, time };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  // Fallback template configurations for each channel
  const fallbackTemplatesConfig: Record<
    "sms" | "whatsapp" | "email",
    { title: string; templates: TemplateItem[] }
  > = {
    sms: {
      title: "Send SMS",
      templates: [
        {
          id: 101,
          title: "Regular Sms",
          content: `Dear Customer,\nYou have overdue balance as per our records, if you have not settled yet, please process it urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          id: 102,
          title: "Default Sms",
          content: `Dear Customer,\nThis is a notification regarding your default status account. Please process settlement urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          id: 103,
          title: "Legal Notice",
          content: `Dear Customer,\nThis is a legal notice regarding your overdue account. Immediate settlement is required to avoid further legal procedures.\n\nFor details, please contact 800 12341234`,
        },
      ],
    },
    whatsapp: {
      title: "Send WhatsApp",
      templates: [
        {
          id: 201,
          title: "Regular WhatsApp",
          content: `Dear Customer,\nYou have overdue balance as per our records, if you have not settled yet, please process it urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          id: 202,
          title: "Default WhatsApp",
          content: `Dear Customer,\nThis is a notification regarding your default status account. Please process settlement urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          id: 203,
          title: "Legal Notice",
          content: `Dear Customer,\nThis is a legal notice regarding your overdue account. Immediate settlement is required to avoid further legal procedures.\n\nFor details, please contact 800 12341234`,
        },
      ],
    },
    email: {
      title: "Send Email",
      templates: [
        {
          id: 301,
          title: "Regular Email",
          content: `Dear Customer,\nYou have overdue balance as per our records, if you have not settled yet, please process it urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          id: 302,
          title: "Default Email",
          content: `Dear Customer,\nThis is a notification regarding your default status account. Please process settlement urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          id: 303,
          title: "Legal Notice",
          content: `Dear Customer,\nThis is a legal notice regarding your overdue account. Immediate settlement is required to avoid further legal procedures.\n\nFor details, please contact 800 12341234`,
        },
      ],
    },
  };

  // Load NOTIFICATIONTYPE VB options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const opts = await vbValue("NOTIFICATIONTYPE", String(language));
        if (Array.isArray(opts) && opts.length > 0) {
          setNotifTypeOptions(opts);
        }
      } catch (err) {
        console.error("Error fetching NOTIFICATIONTYPE vb options:", err);
      }
    };
    fetchOptions();
  }, [language]);

  // Determine current notification type code (e.g. 21543 for SMS)
  const getNotificationTypeCode = useCallback(
    (type: "sms" | "whatsapp" | "email"): number => {
      if (notifTypeOptions.length > 0) {
        const matched = notifTypeOptions.find((opt) =>
          String(opt.label).toLowerCase().includes(type.toLowerCase())
        );
        if (matched && matched.value) {
          return Number(matched.value);
        }
      }
      if (type === "sms") return 21543;
      if (type === "whatsapp") return 21544;
      return 21542; // email
    },
    [notifTypeOptions]
  );

  /**
   * STEP 2: Fetch specific template content by calling POST /api/Notification/getnotificationtemplate
   */
  const fetchTemplateContent = useCallback(
    async (notifId: number, nameFallback?: string) => {
      setLoadingTemplateContent(true);
      try {
        let currentContracts = loanContracts;
        if ((!currentContracts || currentContracts.length === 0) && activeCifId) {
          try {
            const fetched = await getCustomerContractsList({
              CIFID: activeCifId,
              language: language,
            });
            if (Array.isArray(fetched) && fetched.length > 0) {
              currentContracts = fetched;
              setLoanContracts(fetched);
            }
          } catch (e) {
            console.error("Error fetching loan contracts in fetchTemplateContent:", e);
          }
        }

        const resolved = resolveIds(currentContracts);

        const payload: GetNotificationTemplatePayload = {
          notificationid: 3,
          cifid: 40403,
          appcifid: 0,
          appid: 60364,
          idnumber: "string",
          language: 1
          // notificationid: Number(notifId),
          // cifid: resolved.cifId,       // null if not available
          // appcifid: resolved.appCifId, // null if not available
          // appid: resolved.appId,       // null if not available
          // idnumber: resolved.idNumber, // null if not available
          // language: language,
        };

        // Hit POST /api/Notification/getnotificationtemplate
        const templateResult = await getNotificationTemplate(payload);

        if (templateResult && typeof templateResult === "string" && templateResult.trim()) {
          setMessageContent(interpolateTemplate(templateResult));
          return;
        }

        // Fallback 1: Match from cached get-All-Notification
        const matched = allNotificationsCache.current.find(
          (a) => Number(a.NOTIFICATIONID) === Number(notifId)
        );
        const matchedBody =
          matched?.TEMPLATE ||
          matched?.TEMPLATE1 ||
          matched?.TEMPLATE2 ||
          matched?.TEMPLATE3;

        if (matchedBody) {
          setMessageContent(interpolateTemplate(matchedBody));
          return;
        }

        // Fallback 2: Channel default template
        const defaultTemplates = fallbackTemplatesConfig[commType]?.templates || [];
        const fallbackTmpl =
          defaultTemplates.find((t) => t.id === notifId) || defaultTemplates[0];

        if (fallbackTmpl) {
          setMessageContent(interpolateTemplate(fallbackTmpl.content));
          return;
        }

        setMessageContent(
          interpolateTemplate(
            `Dear Customer,\nThis is a notification regarding ${nameFallback || "your account"}. Please contact 800 12341234 for details.`
          )
        );
      } catch (err) {
        console.error("Error in fetchTemplateContent:", err);
      } finally {
        setLoadingTemplateContent(false);
      }
    },
    [activeCifId, activeAppCifId, activeAppId, activeIdNumber, language, commType, interpolateTemplate]
  );

  /**
   * STEP 1: Fetch notification names by calling GET /api/Notification/getnotificationnames
   */
  const fetchCommunicationData = useCallback(
    async (type: "sms" | "whatsapp" | "email") => {
      setLoadingTemplates(true);
      setLoadingHistory(true);

      const typeCode = getNotificationTypeCode(type);

      try {
        // 1. GET /api/Notification/getnotificationnames
        // 2. GET /api/MstScheduleNotification/get-All-Notification (for cache/fallback)
        // 3. GET /api/TranMessageDetails/get-All-MessageDetails (for history)
        const [namesRes, allNotifsRes, historyRes] = await Promise.all([
          getNotificationNames({
            NOTIFICATIONTYPE: typeCode,
            LANGUAGE: language,
          }),
          getAllNotifications({
            Language: language,
          }),
          getMessageHistory({
            CifId: activeCifId,
            Language: language,
            UserId: activeUpdateBy,
          }),
        ]);

        if (Array.isArray(allNotifsRes)) {
          allNotificationsCache.current = allNotifsRes;
        }

        let templatesList: TemplateItem[] = [];

        if (Array.isArray(namesRes) && namesRes.length > 0) {
          templatesList = namesRes.map((nameItem: NotificationNameItem) => ({
            id: Number(nameItem.NOTIFICATIONID),
            title: nameItem.NOTIFICATIONNAME || `Template ${nameItem.NOTIFICATIONID}`,
            content: "",
          }));
        } else {
          // Fallback if no names returned from DB for this channel yet
          templatesList = fallbackTemplatesConfig[type]?.templates || [];
        }

        setActiveTemplates(templatesList);
        setSelectedTemplateIndex(0);

        // Immediately trigger STEP 2: POST /api/Notification/getnotificationtemplate for first template
        if (templatesList.length > 0) {
          await fetchTemplateContent(templatesList[0].id, templatesList[0].title);
        }

        // Process dynamic history
        if (Array.isArray(historyRes) && historyRes.length > 0) {
          const formattedHistory: FormattedHistoryItem[] = historyRes.map(
            (item: MessageHistoryItem, idx: number) => {
              const { date, time } = formatDateTime(
                item.CONTACTDATE || item.UPDATEDATE
              );
              return {
                id: item.TTMDRECID || idx + 1,
                title:
                  item.NOTIFICATIONTYPE ||
                  item.NOTIFICATIONNAME ||
                  (type === "sms"
                    ? "SMS"
                    : type === "whatsapp"
                      ? "WhatsApp"
                      : "Email"),
                date,
                time,
                status: item.MESSAGESTATUS || "Sent",
              };
            }
          );
          setHistoryList(formattedHistory);
        } else {
          const defaultHistory: FormattedHistoryItem[] = [
            { id: 1, title: type === "sms" ? "Regular Sms" : type === "whatsapp" ? "Regular WhatsApp" : "Regular Email", date: "12/3/2024", time: "09:28 AM", status: "Sent" },
            { id: 2, title: type === "sms" ? "Default Sms" : type === "whatsapp" ? "Default WhatsApp" : "Default Email", date: "12/3/2024", time: "09:27 AM", status: "Sent" },
            { id: 3, title: "Legal Notice", date: "12/3/2024", time: "09:26 AM", status: "Sent" },
            { id: 4, title: "Legal Notice", date: "11/25/2024", time: "06:07 AM", status: "Sent" },
          ];
          setHistoryList(defaultHistory);
        }
      } catch (err) {
        console.error("Error loading communication modal data:", err);
        const fallback = fallbackTemplatesConfig[type]?.templates || [];
        setActiveTemplates(fallback);
        setSelectedTemplateIndex(0);
        if (fallback.length > 0) {
          setMessageContent(interpolateTemplate(fallback[0].content));
        }
      } finally {
        setLoadingTemplates(false);
        setLoadingHistory(false);
      }
    },
    [language, activeCifId, activeUpdateBy, getNotificationTypeCode, fetchTemplateContent, interpolateTemplate]
  );

  const handleOpenComm = (type: "sms" | "whatsapp" | "email") => {
    setCommType(type);
    setSelectedTemplateIndex(0);
    setOpenCommunicationModal(true);
    fetchCommunicationData(type);
  };

  /**
   * When user selects a template name (from dropdown or bottom cards):
   * Hits POST /api/Notification/getnotificationtemplate
   */
  const handleSelectTemplate = (index: number) => {
    setSelectedTemplateIndex(index);
    const selected = activeTemplates[index];
    if (selected) {
      fetchTemplateContent(selected.id, selected.title);
    }
  };

  /**
   * STEP 3: When user clicks "Send" button:
   * Hits POST /api/Notification/insertfollowupnotification
   */
  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error("Please enter message content");
      return;
    }

    setIsSending(true);
    const selectedTemplate = activeTemplates[selectedTemplateIndex];
    const typeCode = getNotificationTypeCode(commType);

    try {
      let currentContracts = loanContracts;
      if ((!currentContracts || currentContracts.length === 0) && activeCifId) {
        try {
          const fetched = await getCustomerContractsList({
            CIFID: activeCifId,
            language: language,
          });
          if (Array.isArray(fetched) && fetched.length > 0) {
            currentContracts = fetched;
            setLoanContracts(fetched);
          }
        } catch (e) {
          console.error("Error fetching loan contracts in handleSendMessage:", e);
        }
      }

      const resolved = resolveIds(currentContracts);

      const payload: InsertFollowupNotificationPayload = {
        // notificationid: Number(selectedTemplate?.id || 0),
        vB_NOTIFICATIONTYPE: Number(typeCode),
        notificationtext: messageContent,
        // cifid: resolved.cifId,       // null if not available
        // appid: resolved.appId,       // null if not available
        // idnumber: resolved.idNumber, // null if not available
        updateby: activeUpdateBy,
        notificationid: 3,
          cifid: 40403,
          // appcifid: 0,
          appid: 60364,
          idnumber: "string",
          // language: 1
      };

      // Hit POST /api/Notification/insertfollowupnotification
      await insertFollowupNotification(payload);

      // Prepend newly sent message to History list
      const now = new Date();
      const newHistoryItem: FormattedHistoryItem = {
        id: Date.now(),
        title: selectedTemplate?.title || currentModalTitle,
        date: `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`,
        time: now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        status: "Sent",
      };

      setHistoryList((prev) => [newHistoryItem, ...prev]);

      toast.success(
        `${commType === "sms"
          ? "SMS"
          : commType === "whatsapp"
            ? "WhatsApp"
            : "Email"
        } sent successfully!`
      );
    } catch (err: any) {
      console.error("Error sending communication:", err);
      toast.error("Failed to send message, please try again");
    } finally {
      setIsSending(false);
    }
  };

  const currentModalTitle =
    commType === "sms"
      ? "Send SMS"
      : commType === "whatsapp"
        ? "Send WhatsApp"
        : "Send Email";

  return (
    <>
      {/* Top Action Bar Container */}
      <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(15,142,221,0.15)]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] p-5 border border-white/40 dark:border-gray-700/30 flex flex-wrap items-center justify-between gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          {/* Left Communication Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/SmartView/Followup")}
              className="h-10 px-3.5 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2 cursor-pointer text-xs mr-2 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={() => setOpenCallModal(true)}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Phone className="w-4 h-4 fill-current" />
              Call
            </Button>

            <Button
              onClick={() => handleOpenComm("sms")}
              className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </Button>

            <Button
              onClick={() => handleOpenComm("whatsapp")}
              className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              Whatsapp
            </Button>

            <Button
              onClick={() => handleOpenComm("email")}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>

          {/* Right Workflow Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSmartViewClick}
              className="h-10 px-4 rounded-xl border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95"
            >
              Smart View
            </Button>

            <Button
              variant="outline"
              onClick={() => setOpenFollowUpModal(true)}
              className="h-10 px-4 rounded-xl border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Follow up
            </Button>

            <Button className="h-10 px-6 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95">
              Escalate
            </Button>
          </div>
        </div>
      </div>

      {/* 1. MAKE CALL MODAL */}
      {openCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-2xl bg-[#f1f5f9] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-white font-sans">
            <div className="bg-blue-600 text-white px-6 py-3.5 flex items-center justify-between font-bold text-base shadow-xs">
              <span>Make Call</span>
              <button
                onClick={() => setOpenCallModal(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-7 flex flex-col gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border border-gray-200/80 dark:border-gray-700/80 flex flex-col gap-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Customer full name:{" "}
                    <strong className="text-gray-900 dark:text-white uppercase font-bold">
                      {customerFullName}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Customer contact number:{" "}
                    <strong className="text-gray-900 dark:text-white font-bold">
                      {customerContactNumber}
                    </strong>
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setOpenCallModal(false)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Make A Call
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col gap-3">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                  History
                </h3>

                <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {dummyCallHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-gray-800 dark:text-gray-200">
                        <span>Call Duration: {item.duration}</span>
                        <span className="text-gray-500 dark:text-gray-400 font-normal text-[11px]">
                          {item.date} {item.time}
                        </span>
                      </div>
                      {item.status && (
                        <div className="text-gray-600 dark:text-gray-400 text-[11px]">
                          Status: <span className="font-semibold">{item.status}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC COMMUNICATION MODAL (SMS / WhatsApp / Email) */}
      {openCommunicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl rounded-2xl bg-[#f1f5f9] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-white font-sans">
            <div className="bg-blue-600 text-white px-6 py-3.5 flex items-center justify-between font-bold text-base shadow-xs">
              <span>{currentModalTitle}</span>
              <button
                onClick={() => setOpenCommunicationModal(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column */}
              <div className="md:col-span-7 flex flex-col gap-4">
                {/* Main Message Box */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xs border border-gray-200/80 dark:border-gray-700/80 flex flex-col gap-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Customer full name::{" "}
                    <strong className="text-gray-900 dark:text-white uppercase font-bold">
                      {customerFullName}
                    </strong>
                  </p>

                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {commType === "email" ? "Email To: " : "To: "}
                    <strong className="text-gray-900 dark:text-white font-bold">
                      {commType === "email"
                        ? customerEmail
                        : customerContactNumber}
                    </strong>
                  </p>

                  {/* Template Text Content Box (Loaded dynamically from POST /api/Notification/getnotificationtemplate) */}
                  <div className="relative">
                    {loadingTemplateContent ? (
                      <div className="flex h-[120px] items-center justify-center p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                        <span className="text-xs text-gray-500">
                          Fetching template from API...
                        </span>
                      </div>
                    ) : (
                      <textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        rows={4}
                        placeholder="Enter message text..."
                        className="w-full p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed min-h-[110px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    )}
                  </div>
                </div>

                {/* Actions row: Select Template Dropdown & Send Button */}
                <div className="flex items-center justify-between gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-xl border border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                      >
                        Select Template
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-64 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-1"
                    >
                      {activeTemplates.map((tmpl, idx) => (
                        <DropdownMenuItem
                          key={tmpl.id || idx}
                          onClick={() => handleSelectTemplate(idx)}
                          className="flex items-center justify-between text-xs cursor-pointer py-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700"
                        >
                          <span className="font-medium truncate">
                            {tmpl.title}
                          </span>
                          {selectedTemplateIndex === idx && (
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Send Button: Hits POST /api/Notification/insertfollowupnotification */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageContent.trim()}
                    className="h-10 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>

                {/* Horizontal Selectable Template Cards (Clicking hits POST getnotificationtemplate) */}
                {loadingTemplates ? (
                  <div className="flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                    <span className="text-xs text-gray-500">
                      Loading notification templates...
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {activeTemplates.map((tmpl, idx) => (
                      <button
                        key={tmpl.id || idx}
                        type="button"
                        onClick={() => handleSelectTemplate(idx)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1 shadow-2xs cursor-pointer ${selectedTemplateIndex === idx
                          ? "border-blue-600 bg-white dark:bg-gray-800 ring-2 ring-blue-500/30"
                          : "border-gray-200/80 dark:border-gray-700/80 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
                          }`}
                      >
                        <strong className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {tmpl.title}
                        </strong>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                          {tmpl.content || (selectedTemplateIndex === idx ? messageContent : `Template: ${tmpl.title}`)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic History */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                  History
                </h3>

                <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                      <span className="text-xs text-gray-500">
                        Loading history...
                      </span>
                    </div>
                  ) : historyList.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/80 dark:border-gray-700/80 text-center text-xs text-gray-500">
                      No communication history found.
                    </div>
                  ) : (
                    historyList.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs flex items-center justify-between text-xs transition-all hover:border-gray-300"
                      >
                        <div
                          className="font-bold text-gray-800 dark:text-gray-200 text-xs w-28 truncate"
                          title={item.title}
                        >
                          {item.title}
                        </div>

                        <div className="flex flex-col text-[11px] text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-500 dark:text-gray-400 text-[10px]">
                            Date & Time
                          </span>
                          <span>{item.date}</span>
                          <span>{item.time}</span>
                        </div>

                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Status
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADD FOLLOW UP MODAL */}
      <FollowUpModal
        isOpen={openFollowUpModal}
        onClose={() => setOpenFollowUpModal(false)}
        cifId={activeCifId ?? ""}
        followupData={followupDetails}
      />
    </>
  );
};
