"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { BarChart3, Calendar, DollarSign, TrendingUp, PieChart, Activity, Percent, ShieldCheck } from "lucide-react";
import { getCustomerDetails } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";
import { formatDateKSA } from "@/utils/helpers";

export default function FinancialSummary({ cifId }: { cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerDetails({ CIFID: cifId, language });
        const summary = response?.Summary?.[0] || null;
        setData(summary);
      } catch (error) {
        toast.error("Failed to fetch financial summary");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cifId, language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Active Loans" value={data?.ACTIVELOANS} icon={Activity} color="blue" />
        <StatCard label="Closed Loans" value={data?.CLOSEDLOANS} icon={ShieldCheck} color="emerald" />
        <StatCard label="Total Loans" value={data?.TOTALLOANS} icon={PieChart} color="indigo" />
        <StatCard label="DPD" value={data?.DPD} icon={TrendingUp} color={Number(data?.DPD) > 0 ? "rose" : "emerald"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Installment Tracking */}
        <SummaryCard title="Installment Tracking" icon={Calendar}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Total Installments" value={data?.TOTALINSTALLMENT} />
            <Field label="Paid Installments" value={data?.PAIDINSTALLMENT} color="emerald" />
            <Field label="Overdue Installments" value={data?.OVERDUEINSTALLMENT} color="rose" />
            <Field label="Remaining Installments" value={data?.REMAININGINSTALLMENT} color="indigo" />
            <Field label="Last Paid Date" value={formatDateKSA(data?.LASTPAIDINSTALLMENTDATE)} />
            <Field label="Last Unpaid Date" value={formatDateKSA(data?.LASTUNPAIDINSTALLMENTDATE)} />
            <Field label="Last Installment Date" value={formatDateKSA(data?.LASTINSTALLMENTDATE)} />
            <Field label="Next Installment Amount" value={data?.NEXTINSTALLMENTAMOUNT} isAmount />
          </div>
        </SummaryCard>

        {/* Section 2: Financial Aggregates */}
        <SummaryCard title="Financial Aggregates" icon={DollarSign}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Total Loan Amount" value={data?.TOTALLOANAMOUNT} isAmount />
            <Field label="Principal O/S" value={data?.PRINCIPALOS} isAmount color="indigo" />
            <Field label="Profit O/S" value={data?.PROFITOS} isAmount color="indigo" />
            <Field label="Total Loan Receivable O/S" value={data?.TOTALLOANRECEIVABLEOS} isAmount color="indigo" />
            <Field label="Total Charge Receivable O/S" value={data?.TOTALCHARGERECEIVABLEOS} isAmount color="indigo" />
            <Field label="Excess Amount" value={data?.EXCESSAMOUNT} isAmount color="emerald" />
            <Field label="Principal Overdue" value={data?.PRINCIPALOVERDUE} isAmount color="rose" />
            <Field label="Profit Overdue" value={data?.PROFITOVERDUE} isAmount color="rose" />
          </div>
        </SummaryCard>

        {/* Section 3: Profit Recognition & Provisions */}
        <SummaryCard title="Profit & Provisions" icon={TrendingUp}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Accrued Profit" value={data?.ACCRUEDPROFIT} isAmount />
            <Field label="Recognized Profit" value={data?.RECOGNIZEDPROFIT} isAmount />
            <Field label="Suspense Profit" value={data?.SUSPENSEPROFIT} isAmount />
            <Field label="Moratorium Profit" value={data?.MORATORIUMPROFIT} isAmount />
            <Field label="Specific Provision" value={data?.SPECIFICPROVISION} isAmount />
            <Field label="General Provision" value={data?.GENERALPROVISION} isAmount />
          </div>
        </SummaryCard>

        {/* Section 4: Paid Breakdown */}
        <SummaryCard title="Collection Breakdown (Paid)" icon={ShieldCheck}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Principal Paid" value={data?.PRINCIPALPAID} isAmount color="emerald" />
            <Field label="Profit Paid" value={data?.PROFITPAID} isAmount color="emerald" />
            <Field label="Insurance Paid" value={data?.INSURANCEPAID} isAmount color="emerald" />
            <Field label="Tax Amount" value={data?.TAXAMOUNT} isAmount />
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}

// Internal Helper Components
function StatCard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  const colorMap: any = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    rose: "from-rose-500 to-pink-600 shadow-rose-500/20",
    indigo: "from-indigo-500 to-purple-600 shadow-indigo-500/20",
  };

  return (
    <div className={`relative overflow-hidden group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-500 hover:scale-[1.02]`}>
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]} opacity-[0.03] rounded-full -mr-8 -mt-8`} />
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">{value || "0"}</span>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]} shadow-lg ${colorMap[color].split(' ')[2]}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-xl transition-all duration-500 hover:shadow-indigo-500/5">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, isAmount, color }: { label: string; value: any; isAmount?: boolean; color?: string }) {
  const displayValue = isAmount 
    ? (value ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00")
    : (value || "-");

  const colorClasses: any = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    default: "text-slate-700 dark:text-slate-200"
  };

  return (
    <div className="flex flex-col gap-1.5 group/field">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] ml-1 transition-colors group-hover/field:text-indigo-500">
        {label}
      </label>
      <div className="h-10 px-4 flex items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 group-hover/field:border-indigo-200 dark:group-hover/field:border-indigo-900/50">
        <span className={`text-[13px] font-bold ${color ? colorClasses[color] : colorClasses.default}`}>
          {displayValue}
        </span>
      </div>
    </div>
  );
}
