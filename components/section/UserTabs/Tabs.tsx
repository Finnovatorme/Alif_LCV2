"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "@/utils/axios";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setFromArray, hydrateFromStorage } from "@/lib/redux/slices/applicationSlice";
import { languageParams, dashboardParams } from "@/lib/redux/slices/dashboardApplSlice";

// Your component imports (unchanged)
import ApplCifCustDetails from "@/components/section/UserTabs/Customer/ApplCifCustDetails";
import CIfAddress from "@/components/section/UserTabs/Customer/CIfAddress";
import CifAffiliation from "@/components/section/UserTabs/Customer/CifAffiliation";
import CifBank from "@/components/section/UserTabs/Customer/CifBank";
import Identification from "@/components/section/UserTabs/Customer/Identification";
import Income from "@/components/section/UserTabs/Customer/Income";
import Liabilities from "@/components/section/UserTabs/Customer/Liabilities";
import Employement from "@/components/section/UserTabs/Customer/Employement";
import ExpenseTabs from "@/components/section/UserTabs/Customer/ExpenseTabs";
import Expensemaster from "@/components/section/UserTabs/Customer/Expensemaster";
import ExpenseDetails from "@/components/section/UserTabs/Customer/ExpenseDetails";
import SchemeOffer from "@/components/section/UserTabs/Offers/SchemeOffer";
import SelectedScheme from "@/components/section/UserTabs/Offers/SelectedScheme";
import Charges from "@/components/section/UserTabs/Offers/Charges";
import DueDate from "@/components/section/UserTabs/Offers/DueDate";
import ProfitRate from "@/components/section/UserTabs/Offers/ProfitRate";
import LoanOffer from "@/components/section/UserTabs/Offers/LoanOffer";
import RepaymentSchedule from "@/components/section/UserTabs/Offers/RepaymentSchedule";
import ContractSigning from "@/components/section/UserTabs/Signing/ContractSigning";
import TawarruqTransaction from "@/components/section/UserTabs/Signing/TawarruqTransaction";
import Audittrail from "@/components/section/UserTabs/Actions/Audittrail";
import Comments from "@/components/section/UserTabs/Actions/Comments";
import Notifications from "@/components/section/UserTabs/Actions/Notifications";
import LoanFunding from "@/components/section/UserTabs/Disbursement/LoanFunding";
import Application from "./Application";
import CustomerTabs from "./CustomerTabs";
import SchemeTabs from "./SchemeTabs";
import Documents from "./Documents";
import AssetTabs from "../UserTabs/AssetsTabs/page";
import SigningTabs from "./SigningTabs";
import CommentsTabs from "./CommentsTabs";
import DisbursementTabs from "./Disbursement/LoanBooking";
import CreditTabs from "./CreditTabs";
import OfferTabs from "./OfferTabs";

const TAB_COMPONENTS = {
  Application,
  CustomerTabs,
  AssetTabs,
  SchemeTabs,
  Documents,
  SigningTabs,
  CommentsTabs,
  DisbursementTabs,
  CreditTabs,
  OfferTabs,
  ApplCifCustDetails,
  CIfAddress,
  CifAffiliation,
  CifBank,
  Identification,
  Income,
  Liabilities,
  Employement,
  ExpenseTabs,
  Expensemaster,
  ExpenseDetails,
};

type RawTab = Record<string, any>;

const getId = (t: any) => t.MENUID;
const getParentId = (t: any) => t.PARENTMENU;

/** ✅ normalize API page names so "New application" still maps to Application */
const normalizeKey = (s: any) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "") // remove spaces
    .replace(/_/g, "") // remove underscores
    .replace(/-/g, ""); // remove dashes

/** ✅ Map normalized page names -> component */
const TAB_COMPONENTS_NORMALIZED: Record<string, any> = {
  // Main tabs
  application: Application,
  customertabs: CustomerTabs,
  assetdetails: AssetTabs,
  schemetabs: SchemeTabs,
  documents: Documents,
  promisorrynote: SigningTabs,
  actions: CommentsTabs,
  disbursementloanbooking: DisbursementTabs,
  credittabs: CreditTabs,
  offertabs: OfferTabs,

  // Customer children
  applcifcustdetails: ApplCifCustDetails,
  cifaddress: CIfAddress,
  cifaffiliation: CifAffiliation,
  cifbank: CifBank,
  identification: Identification,
  income: Income,
  liabilities: Liabilities,
  employement: Employement,

  // Expense children
  expensetabs: ExpenseTabs,
  expensemaster: Expensemaster,
  expensedetails: ExpenseDetails,

  // Offer children
  schemeoffer: SchemeOffer,
  applscheme: SelectedScheme,
  applschememaster: Charges,
  applschemedueday: DueDate,
  applschemeprofitrate: ProfitRate,
  loanoffer: LoanOffer,
  repayschedule: RepaymentSchedule,

  // Signing children
  tawarruqtransaction: TawarruqTransaction,
  offercontractsigning: ContractSigning,

  // Actions children
  comments: Comments,
  notification: Notifications,
  audittrail: Audittrail,

  disbursementfunding: LoanFunding,

  // ✅ Common aliases from APIs
  newapplication: Application,
  newapplicationtab: Application,
  newapplicationform: Application,
  applicationform: Application,
};

function buildTree(list: RawTab[]) {
  const map = new Map<number, any>();
  const roots: any[] = [];

  list.forEach((item) => {
    const id = Number(getId(item));
    map.set(id, { ...item, __id: id, children: [] });
  });

  map.forEach((node) => {
    const parent = getParentId(node);
    if (parent == null || parent === "" || isNaN(Number(parent))) {
      roots.push(node);
    } else {
      const pid = Number(parent);
      const parentNode = map.get(pid);
      if (parentNode) parentNode.children.push(node);
      else roots.push(node);
    }
  });

  return roots;
}

function TabRow({
  items,
  activeId,
  onSelect,
  level = 0,
}: {
  items: any[];
  activeId: number | null;
  onSelect: (item: any) => void;
  level?: number;
}) {
  if (!items?.length) return null;
  console.log("tabssss", items);
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {items.map((t) => {
          const isActive = activeId === t.__id;

          return (
            <button
              key={t.__id}
              type="button"
              onClick={() => onSelect(t)}
              className={`
                group relative shrink-0 cursor-pointer select-none whitespace-nowrap
                rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2
                focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900
                shadow-sm hover:shadow
                ${level === 0
                  ? "bg-white/80 dark:bg-gray-900/80 border border-gray-200/70 dark:border-gray-800/70 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                  : "bg-white/60 dark:bg-gray-950/60 border border-gray-300/50 dark:border-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-900/70 text-gray-700 dark:text-gray-300"
                }
                ${isActive
                  ? "border-cyan-500/50 dark:border-cyan-600/60 bg-linear-to-r from-cyan-50/80 to-sky-50/60 dark:from-cyan-950/70 dark:to-sky-950/60 text-cyan-700 dark:text-cyan-300 shadow-md dark:shadow-cyan-900/30"
                  : ""
                }
              `}
            >
              {String(t.MENUNAME1 ?? "Untitled").trim()}

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
      <div className="mt-1 h-px bg-gray-200/80 dark:bg-gray-800/70" />
    </div>
  );
}

function getAuthFromLocalStorage() {
  try {
    const raw = localStorage.getItem("authData");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Tabs({
  transactionId = 36,
  moduleId = 1,
  language = 1,
  authFromRedux,
  appId,
}: {
  transactionId?: number;
  moduleId?: number;
  language?: any;
  authFromRedux?: any;
  appId?: number | string;
}) {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const appParams = useSelector(dashboardParams);
  const storedAppId = appParams?.APPID;
  const languageFromRedux = useSelector(languageParams);

  // Use redux language if prop is missing
  const activeLanguage = language ?? languageFromRedux;

  const [rawTabs, setRawTabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeMain, setActiveMain] = useState<any>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [activeSub2, setActiveSub2] = useState<any>(null);

  const auth =
    authFromRedux ??
    (typeof window !== "undefined" ? getAuthFromLocalStorage() : null);
  const authUserId =
    auth?.USERID ??
    auth?.Userid ??
    auth?.userId ??
    auth?.UserId ??
    auth?.id ??
    null;

  // ✅ APPID from URL params (for now)
  const paramAppId =
    searchParams.get("APPID") ||
    searchParams.get("appId") ||
    searchParams.get("appid") ||
    "";

  // ✅ resolved appId to pass everywhere (props > url > redux)
  const resolvedAppId = (appId ?? paramAppId ?? storedAppId ?? "") as any;

  // ✅ restore from localStorage on refresh
  useEffect(() => {
    dispatch(hydrateFromStorage());
  }, [dispatch]);

  // ✅ fetch & store application info using APPID from params (or props)
  useEffect(() => {
    const loadApplicationInfo = async () => {
      const finalAppId = resolvedAppId;
      if (!finalAppId) return;

      try {
        const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
        const res = await axios.get(
          `${baseUrl}/api/ApplDocuments?APPID=${finalAppId}&Language=${activeLanguage}`,
        );
        console.log("application-data", res.data);
        dispatch(setFromArray(res.data)); // ✅ saves + persists
      } catch (e) {
        console.error("ApplicationInfo load failed", e);
      }
    };

    // If storage missing OR param exists (means navigation changed)
    if (resolvedAppId && (paramAppId || !storedAppId)) {
      loadApplicationInfo();
    }
  }, [resolvedAppId, paramAppId, storedAppId, dispatch, activeLanguage]);

  const tree = useMemo(() => {
    const filtered = rawTabs.filter((t) => {
      const page = String(t.PAGENAME ?? "")
        .trim()
        .toLowerCase();
      const menu = String(t.MENUNAME1 ?? "")
        .trim()
        .toLowerCase();

      // Hide by page name OR menu name
      if (page === "home") return false;
      if (page === "new application") return false;
      if (menu === "home") return false;
      if (menu === "new application") return false;

      return true;
    });

    return buildTree(filtered);
  }, [rawTabs]);

  useEffect(() => {
    if (!tree.length) return;
    const first = tree[0];
    setActiveMain(first);
    const second = first?.children?.[0];
    setActiveSub(second ?? null);
    setActiveSub2(second?.children?.[0] ?? null);
  }, [tree]);

  const subTabs = activeMain?.children ?? [];
  const sub2Tabs = activeSub?.children ?? [];

  const activeNode = activeSub2 ?? activeSub ?? activeMain;
  const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
  useEffect(() => {
    const fetchTabs = async () => {
      if (!authUserId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const baseUrl = process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
        const res = await axios.post(`${baseUrl}/api/GetUserRoleMenuScreens`, {
          roleId: null,
          transactionId,
          UserId: authUserId,
          twtRecId: null,
          moduleId,
          Language: activeLanguage,
        });
        console.log("res", res);
        setRawTabs(res.data || []);
      } catch (e) {
        console.error("Tabs error:", e);
        setRawTabs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTabs();
  }, [authUserId, transactionId, moduleId, activeLanguage]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-6 animate-pulse">
        <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-800 mb-6" />
        <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (!tree.length) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-10 text-center">
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
          No tabs available
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Check permissions or data
        </p>
      </div>
    );
  }

  const pageName = String(activeNode?.PAGENAME ?? "").trim();
  const norm = normalizeKey(pageName);

  console.log("norm", norm);
  const ActiveComponent =
    (norm ? TAB_COMPONENTS_NORMALIZED[norm] : undefined) ??
    (pageName
      ? TAB_COMPONENTS[pageName as keyof typeof TAB_COMPONENTS]
      : undefined);

  return (
    <div className="space-y-6">
      {/* Tabs Navigation - Matching your Page card style */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        {/* Gradient Accent Bar - same as your Page */}
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        <div className="p-6 md:p-8">
          <TabRow
            items={tree}
            activeId={activeMain?.__id ?? null}
            onSelect={(t) => {
              setActiveMain(t);
              setActiveSub(t.children?.[0] ?? null);
              setActiveSub2(t.children?.[0]?.children?.[0] ?? null);
            }}
            level={0}
          />

          {subTabs.length > 0 && (
            <div className="mt-6">
              <TabRow
                items={subTabs}
                activeId={activeSub?.__id ?? null}
                onSelect={(t) => {
                  setActiveSub(t);
                  setActiveSub2(t.children?.[0] ?? null);
                }}
                level={1}
              />
            </div>
          )}

          {sub2Tabs.length > 0 && (
            <div className="mt-6">
              <TabRow
                items={sub2Tabs}
                activeId={activeSub2?.__id ?? null}
                onSelect={setActiveSub2}
                level={2}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Card - same style as your application details card */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="p-6 md:p-8">
          {ActiveComponent ? (
            <ActiveComponent tab={activeNode} appId={resolvedAppId} />
          ) : (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              No component mapped for{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {pageName || "Unknown"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
