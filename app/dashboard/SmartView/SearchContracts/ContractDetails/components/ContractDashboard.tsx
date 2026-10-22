"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Percent, DollarSign, Calendar, FileText, Receipt, History, Wallet, CreditCard, Landmark, Box, Activity, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCustomerContractDetails } from "../../HandlingAPIs";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toYMD, formatDateKSA } from "@/utils/helpers";
import RepaymentSchedule from "./RepaymentSchedule";
import Receipts from "./Receipts";
import Receivables from "./Receivables";
import Charges from "./Charges";
import AddressDetails from "./AddressDetails";
import EmploymentDetails from "./EmploymentDetails";
import BankDetails from "./BankDetails";
import AssetDetails from "./AssetDetails";
import AuditTrail from "./AuditTrail";

interface ContractDashboardProps {
  loanData: any;
  onBack: () => void;
}

export default function ContractDashboard({ loanData, onBack }: ContractDashboardProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [fullData, setFullData] = useState<any>(loanData);
  const language = useSelector(languageParams);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await getCustomerContractDetails({
          LOANID: loanData?.LOANID || loanData?.LoanId || loanData?.id,
          CIFID: loanData?.CIFID || loanData?.CifId,
          language
        });

        const detailsData =
          response?.ContractDetails?.[0] ||
          response?.ContractDetail?.[0] ||
          (Array.isArray(response?.data) ? response.data[0] : response?.data) ||
          (Array.isArray(response) ? response[0] : response);

        if (detailsData && typeof detailsData === "object" && !detailsData.error) {
          const normalized: Record<string, any> = { ...detailsData };
          Object.keys(detailsData).forEach((key) => {
            normalized[key.toUpperCase()] = detailsData[key];
          });
          setFullData((prev: any) => ({ ...prev, ...normalized }));
        }
      } catch (error) {
        console.error("Failed to fetch contract details", error);
      } finally {
        setLoading(false);
      }
    };
    if (loanData?.LOANID || loanData?.CIFID || loanData?.id) {
      fetchDetails();
    }
  }, [loanData?.LOANID, loanData?.CIFID, loanData?.id, language]);

  if (loading && !fullData?.LOANID) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Premium Stats for APR/IRR/Profit Rate
  const stats = [
    { label: "Profit APR", value: fullData?.PROFITAPR || "0.00", icon: TrendingUp, gradient: "from-blue-600 to-indigo-600", shadow: "shadow-blue-500/20" },
    { label: "Profit IRR", value: fullData?.PROFITIRR || "0.00", icon: Activity, gradient: "from-indigo-600 to-violet-600", shadow: "shadow-indigo-500/20" },
    { label: "Profit Rate", value: fullData?.PROFITRATE || "0.00", icon: Percent, gradient: "from-violet-600 to-fuchsia-600", shadow: "shadow-violet-500/20" },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-5 duration-500">
      {/* Clean Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 text-indigo-600" />
          </Button>
          
          <div className="flex items-center gap-8">
            <HeaderInfo label="CIF ID" value={fullData?.CIFID || "-"} color="indigo" />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <HeaderInfo label="Customer Name" value={fullData?.CUSTOMERNAME || "FAISAL ABDULRAHMAN SALIM AL"} isBold />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <HeaderInfo label="Loan ID" value={fullData?.LOANID || "-"} color="indigo" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active Status</span>
          </div>
        </div>
      </div>

      <div className="py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Modern Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-6">
            <TabsList className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 w-full bg-transparent group-data-[orientation=horizontal]/tabs:h-auto h-auto p-0 gap-1">
              <DashboardTab value="details" label="ContractDetails" icon={FileText} active={activeTab === "details"} />
              <DashboardTab value="schedule" label="RescheduleTabs" icon={Calendar} active={activeTab === "schedule"} />
              <DashboardTab value="receipts" label="Receipts" icon={Receipt} active={activeTab === "receipts"} />
              <DashboardTab value="receivables" label="Recievables" icon={Wallet} active={activeTab === "receivables"} />
              <DashboardTab value="charges" label="Charges" icon={CreditCard} active={activeTab === "charges"} />
            </TabsList>
          </div>

          <TabsContent value="details" className="space-y-8 mt-0 outline-none animate-in fade-in zoom-in-95 duration-500">
            {/* Stats Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="relative overflow-hidden group p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-[0.03] rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150`} />
                  
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg shadow-indigo-500/20`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {stat.value}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comprehensive Details Sections */}
            <div className="space-y-6">
              {/* Group 1: Core Contract Information */}
              <DetailsCard title="Core Contract Information" icon={FileText}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Loan ID" value={fullData?.LOANID} />
                  <Field label="Loan Reference No" value={fullData?.LOANREFERENCENO} />
                  <Field label="App ID" value={fullData?.APPID} />
                  <Field label="Branch Name" value={fullData?.BRANCHNAME} />
                  <Field label="Product Name" value={fullData?.PRODUCTNAME} />
                  <Field label="Sub Product Name" value={fullData?.SUBPRODUCTNAME} />
                  <Field label="Scheme Name" value={fullData?.SCHEMENAME} />
                  <Field label="Loan Status" value={fullData?.LOANSTATUS} isBadge />
                </div>
              </DetailsCard>

              {/* Group 2: Important Dates */}
              <DetailsCard title="Key Milestones & Dates" icon={Calendar}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Application Date" value={formatDateKSA(fullData?.APPLICATIONDATE)} />
                  <Field label="Approval Date" value={formatDateKSA(fullData?.APPROVALDATE)} />
                  <Field label="Disbursal Date" value={formatDateKSA(fullData?.DISBURSALDATE)} />
                  <Field label="First Installment Date" value={formatDateKSA(fullData?.FIRSTINSTALLMENTDATE)} />
                  <Field label="Last Installment Date" value={formatDateKSA(fullData?.LASTINSTALLMENTDATE)} />
                  <Field label="Loan Sub Status" value={fullData?.LOANSUBSTATUS} isBadge />
                </div>
              </DetailsCard>

              {/* Group 3: Financial Summary & Breakdown */}
              <DetailsCard title="Financial Breakdown" icon={DollarSign}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Request Amount" value={fullData?.REQUESTAMOUNT} isAmount />
                  <Field label="Asset Amount" value={fullData?.ASSETAMOUNT} isAmount />
                  <Field label="Down Payment" value={fullData?.DOWNPAYMENTAMOUNT} isAmount />
                  <Field label="Loan Amount" value={fullData?.LOANAMOUNT} isAmount />
                  <Field label="Disbursed Amount" value={fullData?.DISBURSEDAMOUNT} isAmount />
                  <Field label="Tax Amount" value={fullData?.TAXAMOUNT} isAmount />
                  <Field label="Total Loan Amount" value={fullData?.TOTALLOANAMOUNT} isAmount />
                  <Field label="Installment Amount" value={fullData?.INSTALLMENTAMOUNT} isAmount />
                  <Field label="Residual Amount" value={fullData?.RESIDUALAMOUNT} isAmount />
                  <Field label="Tenure" value={fullData?.TENURE} suffix=" Months" />
                  <Field label="Insurance Amount" value={fullData?.INSURANCEAMOUNT} isAmount />
                  <Field label="Upfront Charge" value={fullData?.UPFRONTCHARGEAMOUNT} isAmount />
                </div>
              </DetailsCard>

              {/* Group 4: Principal & Profit Analysis */}
              <DetailsCard title="Principal & Profit Analysis" icon={TrendingUp}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Principal Amount" value={fullData?.PRINCIPALAMOUNT} isAmount />
                  <Field label="Principal Paid" value={fullData?.PRINCIPALPAID} isAmount />
                  <Field label="Principal Overdue" value={fullData?.PRINCIPALOVERDUE} isAmount color="red" />
                  <Field label="Principal O/S" value={fullData?.PRINCIPALOS} isAmount color="indigo" />
                  
                  <Field label="Profit Amount" value={fullData?.PROFITAMOUNT} isAmount />
                  <Field label="Profit Paid" value={fullData?.PROFITPAID} isAmount />
                  <Field label="Profit Overdue" value={fullData?.PROFITOVERDUE} isAmount color="red" />
                  <Field label="Profit O/S" value={fullData?.PROFITOS} isAmount color="indigo" />
                </div>
              </DetailsCard>

              {/* Group 5: Charges & Receivables Breakdown */}
              <DetailsCard title="Charges & Receivables" icon={Receipt}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Insurance Paid" value={fullData?.INSURANCEPAID} isAmount />
                  <Field label="Insurance Overdue" value={fullData?.INSURANCEOVERDUE} isAmount color="red" />
                  <Field label="Insurance O/S" value={fullData?.INSURANCEOS} isAmount color="indigo" />
                  
                  <Field label="Capitalized Charge Paid" value={fullData?.CAPITALIZEDCHARGEPAID} isAmount />
                  <Field label="Capitalized Charge Overdue" value={fullData?.CAPITALIZEDCHARGEOVERDUE} isAmount color="red" />
                  <Field label="Capitalized Charge O/S" value={fullData?.CAPITALIZEDCHARGEOS} isAmount color="indigo" />

                  <Field label="Amortized Charge Paid" value={fullData?.AMORTIZEDCHARGEPAID} isAmount />
                  <Field label="Amortized Charge Overdue" value={fullData?.AMORTIZEDCHARGEOVERDUE} isAmount color="red" />
                  <Field label="Amortized Charge O/S" value={fullData?.AMORTIZEDCHARGEOS} isAmount color="indigo" />

                  <Field label="Total Loan Receivable O/S" value={fullData?.TOTALLOANRECEIVABLEOS} isAmount color="indigo" />
                  <Field label="Total Charge Receivable O/S" value={fullData?.TOTALCHARGERECEIVABLEOS} isAmount color="indigo" />
                </div>
              </DetailsCard>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="animate-in fade-in slide-in-from-bottom-5 duration-500 outline-none">
            <RepaymentSchedule loanId={fullData?.LOANID} cifId={fullData?.CIFID} />
          </TabsContent>

          <TabsContent value="receipts" className="animate-in fade-in slide-in-from-right-5 duration-500">
            <Receipts loanId={fullData?.LOANID} cifId={fullData?.CIFID} />
          </TabsContent>

          <TabsContent value="receivables" className="animate-in fade-in slide-in-from-right-5 duration-500">
            <Receivables loanId={fullData?.LOANID} cifId={fullData?.CIFID} />
          </TabsContent>

          <TabsContent value="charges" className="animate-in fade-in slide-in-from-right-5 duration-500">
            <Charges loanId={fullData?.LOANID} cifId={fullData?.CIFID} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper Components
function HeaderInfo({ label, value, color, isBold, className = "" }: { label: string; value: string; color?: string; isBold?: boolean; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-[16px] font-bold tracking-normal ${
        color === "indigo" ? "text-indigo-600" : 
        isBold ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
      }`}>
        {value}
      </span>
    </div>
  );
}

function DashboardTab({ value, label, icon: Icon, active }: { value: string; label: string; icon: any; active: boolean }) {
  return (
    <TabsTrigger
      value={value}
      className={`
        w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] sm:text-sm font-semibold rounded-xl transition-all duration-300 after:hidden h-full
        ${active 
          ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-md" 
          : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"}
      `}
    >
      <Icon className={`h-4 w-4 transition-transform duration-300 ${active ? "scale-110" : ""}`} />
      <span className="truncate">{label}</span>
    </TabsTrigger>
  );
}

function DetailsCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, isAmount, isBadge, color, suffix = "", className = "" }: { label: string; value: any; isAmount?: boolean; isBadge?: boolean; color?: string; suffix?: string; className?: string }) {
  const displayValue = isAmount 
    ? (value ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00")
    : (value || "-");

  return (
    <div className={`flex flex-col gap-1.5 group/field ${className}`}>
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1 transition-colors group-hover/field:text-indigo-500">
        {label}
      </label>
      <div className="h-11 px-4 flex items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 group-hover/field:border-indigo-200 dark:group-hover/field:border-indigo-900/50 group-hover/field:shadow-md">
        {isBadge ? (
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
            String(value).toLowerCase() === "active" 
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          }`}>
            {displayValue}
          </span>
        ) : (
          <span className={`text-sm font-medium ${
            color === "red" ? "text-rose-600 font-semibold" : 
            color === "indigo" ? "text-indigo-600 font-semibold" : 
            "text-slate-800 dark:text-slate-200"
          }`}>
            {displayValue}{suffix}
          </span>
        )}
      </div>
    </div>
  );
}
