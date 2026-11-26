"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";

// Exact components from Image 2
import Kpi from "@/components/section/UserTabs/Customer/KPI";

// Top Action Bar (from Screenshot 1)
import { Actions } from "../SmartView/Followup/FollowupActions/components/Actions";

// APIs
import {
  followupCustomerDetailsGet,
  followupDetailsGet,
  getCustomerContractsList,
  getCustomerContractDetails,
} from "../SmartView/Followup/FollowupActions/HandlingAPIs";

import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { formatAmount, formatDate } from "@/app/utils/formatters";
import { formatAmountKSA, formatDateKSA } from "@/utils/helpers";

// Tab Sub-Components
import { LegalOverviewTab } from "./components/LegalOverviewTab";
import { NoticeTab } from "./components/NoticeTab";
import { NajizTab } from "./components/NajizTab";
import { CourtTab } from "./components/CourtTab";
import { ObjectionTab } from "./components/ObjectionTab";
import { SettlementTab } from "./components/SettlementTab";
import { LegalDocumentsTab } from "./components/LegalDocumentsTab";
import { LegalActionsTab } from "./components/LegalActionsTab";

// Legal APIs & Types
import {
  LegalCaseRecord,
  DEFAULT_LEGAL_CASE,
  getLegalCase,
} from "./HandlingAPIs";

export default function LegalPage() {
  const router = useRouter();
  const reduxParams = useSelector(dashboardParams);
  const selectedLanguage = useSelector(languageParams);

  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState<Record<string, any>>({});
  const [followupDetails, setFollowupDetails] = useState<Record<string, any>>({});
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loanContracts, setLoanContracts] = useState<any[]>([]);
  const [contractDetails, setContractDetails] = useState<Record<string, any>>({});
  const [legalCase, setLegalCase] = useState<LegalCaseRecord>(DEFAULT_LEGAL_CASE);
  const [cifId, setCifId] = useState<number | string>(1);
  const [language, setLanguage] = useState<number>(1);
  const lastFetchedKeyRef = useRef<string>("");

  // Tab State: 1 Legal (default)
  const [activeTab, setActiveTab] = useState<
    "legal" | "notice" | "najiz" | "court" | "objection" | "settlement" | "document" | "actions"
  >("legal");

  // Sub-tab States (matching Image 1)
  const [courtSubTab, setCourtSubTab] = useState<"hearing" | "decision" | "enforcement">("hearing");
  const [actionsSubTab, setActionsSubTab] = useState<"audit" | "comments" | "notifications" | "checklist">("comments");

  useEffect(() => {
    let activeCifId: number | string = 1;
    let activeLang: number = selectedLanguage === "ar" ? 2 : 1;
    let initialCust: Record<string, any> = {};

    if (reduxParams && reduxParams.CIFID !== undefined && reduxParams.CIFID !== null && reduxParams.CIFID !== "") {
      activeCifId = reduxParams.CIFID;
      initialCust = { ...reduxParams };
      if (reduxParams.language) activeLang = reduxParams.language;
    } else if (reduxParams && (reduxParams.CifId || reduxParams.id)) {
      activeCifId = reduxParams.CifId || reduxParams.id;
      initialCust = { ...reduxParams };
      if (reduxParams.language) activeLang = reduxParams.language;
    } else {
      const saved =
        localStorage.getItem("followupParams") || localStorage.getItem("searchContractParams");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.CIFID !== undefined && parsed.CIFID !== null && parsed.CIFID !== "") {
            activeCifId = parsed.CIFID;
          } else if (parsed.CifId || parsed.id) {
            activeCifId = parsed.CifId || parsed.id;
          }
          if (parsed.language) activeLang = parsed.language;
          initialCust = parsed;
        } catch (e) {
          console.error("Error parsing saved params", e);
        }
      }
    }

    if (!activeCifId) {
      activeCifId = 1;
    }

    if (Object.keys(initialCust).length > 0) {
      setCustomerDetails((prev) => ({ ...initialCust, ...prev }));
    }

    setCifId(activeCifId);
    setLanguage(activeLang);

    const fetchKey = `${activeCifId}-${activeLang}`;
    if (lastFetchedKeyRef.current === fetchKey) return;
    lastFetchedKeyRef.current = fetchKey;

    const loadData = async () => {
      setLoading(true);
      try {
        const queryParams = { CIFID: activeCifId, language: activeLang };

        const [custRes, folRes, contractsRes] = await Promise.all([
          followupCustomerDetailsGet(queryParams),
          followupDetailsGet(queryParams),
          getCustomerContractsList(queryParams),
        ]);

        if (Array.isArray(custRes) && custRes.length > 0) {
          setCustomerDetails((prev) => ({ ...prev, ...custRes[0] }));
        } else if (custRes && typeof custRes === "object" && !(custRes as any).error) {
          setCustomerDetails((prev) => ({ ...prev, ...custRes }));
        }

        if (Array.isArray(folRes)) {
          setHistoryList(folRes);
          if (folRes.length > 0) {
            setFollowupDetails(folRes[0]);
          }
        } else if (folRes && typeof folRes === "object" && !(folRes as any).error) {
          setFollowupDetails(folRes);
          setHistoryList(Array.isArray((folRes as any).data) ? (folRes as any).data : [folRes]);
        }

        const contractsList = Array.isArray(contractsRes)
          ? contractsRes
          : contractsRes?.data && Array.isArray(contractsRes.data)
            ? contractsRes.data
            : [];
        setLoanContracts(contractsList);

        const primary = contractsList[0];
        const targetLoanId = primary?.LOANID ?? primary?.APPID ?? null;
        if (targetLoanId !== null && targetLoanId !== undefined && targetLoanId !== "") {
          const detailRes = await getCustomerContractDetails({
            LOANID: targetLoanId,
            CIFID: activeCifId,
            language: activeLang,
          });
          if (detailRes) {
            setContractDetails(detailRes);
          }
        }

        // Fetch Legal Case API
        const caseList = await getLegalCase({
          CIFID: activeCifId || undefined,
          LOANID: targetLoanId || undefined,
        });
        if (Array.isArray(caseList) && caseList.length > 0) {
          setLegalCase(caseList[0]);
        }
      } catch (err) {
        console.error("Error loading legal data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reduxParams, selectedLanguage]);

  // Combined Data lookup
  const combinedData: Record<string, any> = {
    ...customerDetails,
    ...customerDetails?.Summary?.[0],
    ...customerDetails?.Customer?.[0],
    ...followupDetails,
    ...(loanContracts[0] || {}),
    ...contractDetails,
  };

  const getValue = (keys: string[]): any => {
    for (const k of keys) {
      if (combinedData[k] !== undefined && combinedData[k] !== null && combinedData[k] !== "") {
        return combinedData[k];
      }
      const upper = k.toUpperCase();
      if (combinedData[upper] !== undefined && combinedData[upper] !== null && combinedData[upper] !== "") {
        return combinedData[upper];
      }
    }
    return null;
  };

  const formatAmountOrZero = (val: any) => {
    if (val === null || val === undefined || val === "" || val === "—") return "0.00";
    return formatAmountKSA(val);
  };

  const formatNumberOrZero = (val: any) => {
    if (val === null || val === undefined || val === "" || val === "—") return "0";
    return String(val);
  };

  // 4 Main Metric Cards (Requested Amount -> 1 Total Amount, Tenure -> 2 Installment, Approved Amount -> 3 PDP, Approved Tenure -> 4 Total Overdue)
  const totalAmount = formatAmountOrZero(
    getValue(["TOTALLOANAMOUNT", "TotalLoanAmount", "LOANAMOUNT", "LoanAmount"]) || "80000"
  );
  const installment = formatAmountOrZero(
    getValue(["INSTALLMENTAMOUNT", "InstallmentAmount"]) || "1333.33"
  );
  const dpd = formatNumberOrZero(getValue(["DPD", "dpd"]));
  const totalOverdue = formatAmountOrZero(
    getValue([
      "TOTALOVERDUEAMOUNT",
      "TotalOverdueAmount",
      "PRINCIPALOVERDUE",
      "PrincipalOverdue",
    ])
  );

  const isOverdue = Number(dpd) > 0 || Number(totalOverdue.replace(/,/g, "")) > 0;
  const status = isOverdue ? "In Progress (Overdue)" : "In Progress";

  // Customer & Header Attributes
  const actionsAppId =
    getValue(["APPID", "AppId"]) ||
    (typeof window !== "undefined"
      ? localStorage.getItem("APPID") ||
        localStorage.getItem("appid") ||
        localStorage.getItem("selectedAppId") ||
        localStorage.getItem("AppId")
      : null) ||
    "90550";
  const appId =
    getValue(["APPID", "AppId", "LOANID", "LoanId"]) ||
    getValue(["CIFID", "CifId"]) ||
    "90550";
  const customerName =
    getValue(["CUSTOMERNAME", "CustomerName", "CUSTOMERFULLNAME", "FULLNAME"]) ||
    "ALZAHRANI FATIMAH AHMED";
  const displayCifId = getValue(["CIFID", "CifId", "cifId"]) ?? cifId ?? "1";
  const customerType = getValue(["CUSTOMERTYPE", "CustomerType"]) || "Individual";
  const nationality =
    getValue(["NATIONALITY", "Nationality", "COUNTRY", "Country"]) || "Saudi Arabia";
  const age = getValue(["AGE", "Age", "AGEYEARS", "AgeYears"]) || "46";
  const maritalStatus =
    getValue(["MARITALSTATUS", "MaritalStatus", "SOCIALSTATUS", "SocialStatus"]) || "Married";
  const gender = getValue(["GENDER", "Gender", "GENDERDESC", "GenderDesc"]) || "Male";
  const mobile =
    getValue(["MOBILENUMBER", "MobileNumber", "MOBILE", "Mobile", "PHONENUMBER"]) ||
    "0531646712";

  // 6 Outstanding & Overdue items (Collapsible / Details strip under the 4 KPI cards in Image 2)
  const principalOverdue = formatAmountOrZero(getValue(["PRINCIPALOVERDUE", "PrincipalOverdue"]));
  const profitOverdue = formatAmountOrZero(getValue(["PROFITOVERDUE", "ProfitOverdue"]));
  const insuranceOverdue = formatAmountOrZero(getValue(["INSURANCEOVERDUE", "InsuranceOverdue"]));
  const amortizedChargeOverdue = formatAmountOrZero(
    getValue(["AMORTIZEDCHARGEOVERDUE", "AmortizedChargeOverdue"])
  );
  const upfrontChargeOverdue = formatAmountOrZero(
    getValue(["UPFRONTCHARGEOVERDUE", "UpfrontChargeOverdue"])
  );
  const otherChargeOverdue = formatAmountOrZero(
    getValue(["OTHERCHARGEOVERDUE", "OtherChargeOverdue"])
  );

  // Tabs List matching Image 1 & user requirements with Level 1 Sub-tabs
  interface SubTabItem {
    id: string;
    label: string;
  }

  interface TabItem {
    id: "legal" | "notice" | "najiz" | "court" | "objection" | "settlement" | "document" | "actions";
    label: string;
    subTabs?: SubTabItem[];
  }

  const tabs: TabItem[] = [
    { id: "legal", label: "Legal" },
    { id: "notice", label: "Notice" },
    { id: "najiz", label: "Najiz" },
    {
      id: "court",
      label: "Court",
      subTabs: [
        { id: "hearing", label: "Hearing" },
        { id: "decision", label: "Decision" },
        { id: "enforcement", label: "Enforcement" },
      ],
    },
    { id: "objection", label: "Objection" },
    { id: "settlement", label: "Settlement" },
    { id: "document", label: "Documents" },
    {
      id: "actions",
      label: "Actions",
      subTabs: [
        { id: "comments", label: "Comments" },
        { id: "notifications", label: "Notifications" },
        { id: "audit", label: "Audit Trail" },
        { id: "checklist", label: "Checklist" },
      ],
    },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab);
  const currentSubTabs = currentTabObj?.subTabs;

  const currentActiveSubTabId =
    activeTab === "court"
      ? courtSubTab
      : activeTab === "actions"
        ? actionsSubTab
        : null;

  const handleSubTabSelect = (subId: string) => {
    if (activeTab === "court") {
      setCourtSubTab(subId as "hearing" | "decision" | "enforcement");
    } else if (activeTab === "actions") {
      setActionsSubTab(subId as "audit" | "comments" | "notifications" | "checklist");
    }
  };

  return (
    <div className="w-full p-3 md:p-4 space-y-3 font-sans">
      {/* 1. Top Communication Action Bar (Screenshot 1 with "Legal Details" Back button) */}
      <Actions
        cifId={cifId}
        customerDetails={customerDetails}
        followupDetails={followupDetails}
        loanContracts={loanContracts}
        skipInitialContractsFetch={true}
        backUrl="/dashboard"
        backLabel="Legal Details"
        compact={true}
      />

      <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-sky-500 to-emerald-500" />
        <div className="px-5 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Customer Name:</span>
              <span className="font-semibold text-gray-900 dark:text-white truncate">{customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">CIF ID:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{displayCifId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Customer Type:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{customerType}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Nationality:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{nationality}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Age (Years):</span>
              <span className="font-semibold text-gray-900 dark:text-white">{age}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Marital Status:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{maritalStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Gender:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{gender}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Mobile:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{mobile}</span>
            </div>
          </div>

          <div className="mt-2.5 h-px bg-gray-200/80 dark:bg-gray-800/80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 px-5 pb-2.5">
          <Kpi
            label="Total Loan Amount"
            value={`${totalAmount} SAR`}
            accent="indigo"
          />
          <Kpi
            label="Installment Amount"
            value={`${installment} SAR`}
            accent="sky"
          />
          <Kpi
            label="PDP (DPD)"
            value={`${dpd} Days`}
            accent="emerald"
          />
          <Kpi
            label="Total Overdue Amount"
            value={`${totalOverdue} SAR`}
            accent="special"
          />
        </div>
        <div className="px-5 pb-3">
          <div className="h-px bg-gray-200/80 dark:bg-gray-800/80 mb-2.5" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Principal Overdue:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{principalOverdue} SAR</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Profit Overdue:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{profitOverdue} SAR</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Insurance Overdue:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{insuranceOverdue} SAR</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Amortized Charge:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{amortizedChargeOverdue} SAR</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Upfront Charge:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{upfrontChargeOverdue} SAR</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Other Charge:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{otherChargeOverdue} SAR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        <div className="p-4 md:p-6 space-y-4">
          <div>
            <div className="flex flex-wrap gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-slate-600">
              {tabs.map((t) => {
                const isActive = activeTab === t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`
                      group relative shrink-0 cursor-pointer select-none whitespace-nowrap
                      rounded-xl px-5 py-2.5 text-xs md:text-sm font-medium transition-all duration-200
                      shadow-xs hover:shadow
                      bg-white/80 dark:bg-gray-900/80 border border-gray-200/70 dark:border-gray-800/70 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200
                      ${isActive
                        ? "border-cyan-500/50 dark:border-cyan-600/60 bg-linear-to-r from-cyan-50/80 to-sky-50/60 dark:from-cyan-950/70 dark:to-sky-950/60 text-cyan-700 dark:text-cyan-300 shadow-md dark:shadow-cyan-900/30 font-semibold"
                        : ""
                      }
                    `}
                  >
                    {t.label}

                    <span
                      className={`
                        absolute -bottom-1 left-4 right-4 h-0.5 rounded-full transition-all duration-300
                        ${isActive
                          ? "bg-linear-to-r from-cyan-500 to-sky-500 scale-x-100"
                          : "bg-transparent group-hover:bg-gray-400 dark:group-hover:bg-cyan-600/50 scale-x-0 group-hover:scale-x-90"
                        }
                      `}
                    />
                  </button>
                );
              })}
            </div>
            <div className="mt-2 h-px bg-gray-200/80 dark:bg-gray-800/70" />
          </div>
          {currentSubTabs && currentSubTabs.length > 0 && (
            <div className="animate-in fade-in duration-200">
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-slate-600">
                {currentSubTabs.map((st) => {
                  const isSubActive = currentActiveSubTabId === st.id;

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSubTabSelect(st.id)}
                      className={`
                        group relative shrink-0 cursor-pointer select-none whitespace-nowrap
                        rounded-xl px-5 py-2.5 text-xs md:text-sm font-medium transition-all duration-200
                        shadow-xs hover:shadow
                        bg-white/60 dark:bg-gray-950/60 border border-gray-300/50 dark:border-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-900/70 text-gray-700 dark:text-gray-300
                        ${isSubActive
                          ? "border-cyan-500/50 dark:border-cyan-600/60 bg-linear-to-r from-cyan-50/80 to-sky-50/60 dark:from-cyan-950/70 dark:to-sky-950/60 text-cyan-700 dark:text-cyan-300 shadow-md dark:shadow-cyan-900/30 font-semibold"
                          : ""
                        }
                      `}
                    >
                      {st.label}

                      <span
                        className={`
                          absolute -bottom-1 left-4 right-4 h-0.5 rounded-full transition-all duration-300
                          ${isSubActive
                            ? "bg-linear-to-r from-cyan-500 to-sky-500 scale-x-100"
                            : "bg-transparent group-hover:bg-gray-400 dark:group-hover:bg-cyan-600/50 scale-x-0 group-hover:scale-x-90"
                          }
                        `}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 h-px bg-gray-200/80 dark:bg-gray-800/70" />
            </div>
          )}
        </div>
      </div>


      <div>
        {activeTab === "legal" && (
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="p-4 md:p-5">
              <LegalOverviewTab
                cifId={displayCifId}
                customerName={customerName}
                totalAmount={totalAmount}
                totalOverdue={totalOverdue}
                dpd={dpd}
                legalCase={legalCase}
              />
            </div>
          </div>
        )}

        {activeTab === "notice" && (
          <NoticeTab
            legalCase={legalCase}
            cifId={displayCifId}
            loanId={legalCase?.LOANID || getValue(["LOANID", "LoanId"])}
            language={language}
          />
        )}

        {activeTab === "najiz" && (
          <NajizTab
            legalCase={legalCase}
            cifId={displayCifId}
            loanId={legalCase?.LOANID || getValue(["LOANID", "LoanId"])}
            language={language}
          />
        )}

        {activeTab === "court" && (
          <CourtTab
            activeSubTab={courtSubTab}
            onSubTabChange={setCourtSubTab}
            legalCase={legalCase}
            cifId={displayCifId}
            loanId={legalCase?.LOANID || getValue(["LOANID", "LoanId"])}
            language={language}
          />
        )}

        {activeTab === "objection" && (
          <ObjectionTab
            legalCase={legalCase}
            cifId={displayCifId}
            loanId={legalCase?.LOANID || getValue(["LOANID", "LoanId"])}
            language={language}
          />
        )}

        {activeTab === "settlement" && (
          <SettlementTab
            legalCase={legalCase}
            cifId={displayCifId}
            loanId={legalCase?.LOANID || getValue(["LOANID", "LoanId"])}
            language={language}
          />
        )}

        {activeTab === "document" && (
          <LegalDocumentsTab
            legalCase={legalCase}
            cifId={displayCifId}
            loanId={legalCase?.LOANID || getValue(["LOANID", "LoanId"])}
            appId={appId}
            language={language}
          />
        )}

        {activeTab === "actions" && (
          <LegalActionsTab
            activeSubTab={actionsSubTab}
            onSubTabChange={setActionsSubTab}
            language={language}
            appId={actionsAppId}
            twtrecid={getValue(["TWTRECID", "Twtrecid", "twtrecid"])}
          />
        )}
      </div>
    </div>
  );
}
