"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  Landmark,
  Box,
  BarChart3,
  FileText,
  Wallet,
  CreditCard,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Components
import ContractList from "./components/ContractList";
import FinancialSummary from "./components/FinancialSummary";
import CustomerDetails from "./components/CustomerDetails";
import AddressDetails from "./components/AddressDetails";
import EmploymentDetails from "./components/EmploymentDetails";
import IncomeDetails from "./components/IncomeDetails";
import LiabilitiesDetails from "./components/LiabilitiesDetails";
import BankDetails from "./components/BankDetails";
import AssetDetails from "./components/AssetDetails";
import AuditTrail from "./components/AuditTrail";
import ContractDashboard from "./components/ContractDashboard";

export default function ContractDetailsPage() {
  const router = useRouter();
  const reduxParams = useSelector(dashboardParams);
  const selectedLanguage = useSelector(languageParams);

  const [cifId, setCifId] = useState<number | string>(1);
  const [activeTab, setActiveTab] = useState("contracts");
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  useEffect(() => {
    let activeCifId: number | string = 1;

    if (reduxParams && (reduxParams.CIFID || reduxParams.CifId)) {
      activeCifId = reduxParams.CIFID || reduxParams.CifId;
    } else {
      const saved = localStorage.getItem("searchContractParams");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.CIFID || parsed.CifId) activeCifId = parsed.CIFID || parsed.CifId;
        } catch (e) {
          console.error("Error parsing saved params", e);
        }
      }
    }

    setCifId(activeCifId);
  }, [reduxParams, selectedLanguage]);

  const tabs = [
    {
      id: "contracts",
      label: "Contract List",
      icon: FileText,
      component: ({ cifId }: { cifId: string }) => (
        <ContractList cifId={cifId} onSelectLoan={setSelectedLoan} />
      ),
    },
    {
      id: "summary",
      label: "Financial Summary",
      icon: BarChart3,
      component: FinancialSummary,
    },
    {
      id: "customer",
      label: "Customer Details",
      icon: User,
      component: CustomerDetails,
    },
    {
      id: "address",
      label: "Address Details",
      icon: MapPin,
      component: AddressDetails,
    },
    {
      id: "employment",
      label: "Employment Details",
      icon: Briefcase,
      component: EmploymentDetails,
    },
    {
      id: "income",
      label: "Income Details",
      icon: Wallet,
      component: IncomeDetails,
    },
    {
      id: "liabilities",
      label: "Liabilities Details",
      icon: CreditCard,
      component: LiabilitiesDetails,
    },
    {
      id: "bank",
      label: "Bank Details",
      icon: Landmark,
      component: BankDetails,
    },
    {
      id: "assets",
      label: "Asset and Commodity Details",
      icon: Box,
      component: AssetDetails,
    },
    { id: "audit", label: "Audit Trail", icon: History, component: AuditTrail },
  ];

  if (selectedLoan) {
    return (
      <div className="relative min-h-screen p-4 md:p-6 space-y-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-[2.5rem] border border-white dark:border-slate-800 shadow-2xl overflow-hidden min-h-[85vh]">
          <ContractDashboard 
            loanData={selectedLoan} 
            onBack={() => setSelectedLoan(null)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 md:p-6 space-y-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      {/* Premium Background Decoration */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />

      {/* Ultra-Compact Glassmorphic Header */}
      <div className="relative z-10 flex items-center justify-between backdrop-blur-md bg-white/70 dark:bg-slate-900/70 py-4 px-6 rounded-[1.5rem] border border-white dark:border-slate-800 shadow-xl shadow-indigo-500/5 transition-all duration-500">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/SmartView/SearchContracts")}
            className="rounded-xl h-10 w-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-indigo-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Contract Details
              </h1>
              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-black shadow-md">
                #{cifId}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase mt-0.5 opacity-80">
              Customer Portfolio • Comprehensive View
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="px-4 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Main Content with Premium Compact Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="relative z-10 space-y-6"
      >
        <div className="backdrop-blur-md bg-slate-200/50 dark:bg-slate-800/30 p-1 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-inner">
          <TabsList className="flex flex-row w-full items-center justify-between bg-transparent h-auto p-0.5 gap-0.5">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 gap-2 px-1 py-2 text-[11px] font-black whitespace-nowrap rounded-xl transition-all duration-500
                  data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 
                  data-[state=active]:text-indigo-600 data-[state=active]:shadow-md
                  data-[state=active]:scale-[1.02]
                  text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <tab.icon
                  className={`h-3 w-3 transition-transform duration-500 ${activeTab === tab.id ? "scale-110" : ""}`}
                />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="relative">
          {tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-700 outline-none"
            >
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-[2rem] border border-white dark:border-slate-800 shadow-2xl overflow-hidden min-h-[400px]">
                <tab.component cifId={String(cifId)} />
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
