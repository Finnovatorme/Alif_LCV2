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
  ];

  if (selectedLoan) {
    return (
      <div className="space-y-4">
        <ContractDashboard 
          loanData={selectedLoan} 
          onBack={() => setSelectedLoan(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clean Compact Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 py-3.5 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/SmartView/SearchContracts")}
            className="rounded-xl h-9 w-9 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 text-indigo-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Contract Details
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-sm">
                #{cifId}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-wider uppercase mt-0.5">
              Customer Portfolio • Comprehensive View
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="px-3.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <TabsList className="flex flex-row w-full items-center justify-between bg-transparent group-data-[orientation=horizontal]/tabs:h-auto h-auto p-0 gap-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 gap-2 px-2 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap rounded-lg transition-all duration-200 after:hidden
                  data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 
                  data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm
                  text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div>
          {tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="outline-none"
            >
              <tab.component cifId={String(cifId)} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
