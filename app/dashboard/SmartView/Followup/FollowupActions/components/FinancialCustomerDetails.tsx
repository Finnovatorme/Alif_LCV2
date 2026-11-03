"use client";

import React from "react";
import { formatDateKSA, formatAmountKSA } from "@/utils/helpers";
import { Calculator, AlertTriangle, FileText, Layers } from "lucide-react";

interface FinancialCustomerDetailsProps {
  data: Record<string, any>;
}

export const FinancialCustomerDetails: React.FC<FinancialCustomerDetailsProps> = ({ data }) => {
  const getValue = (keys: string[], fallback: any = "0") => {
    for (const k of keys) {
      if (data[k] !== undefined && data[k] !== null && data[k] !== "") {
        return data[k];
      }
      const upper = k.toUpperCase();
      if (data[upper] !== undefined && data[upper] !== null && data[upper] !== "") {
        return data[upper];
      }
    }
    return fallback;
  };

  const formatDateWithoutTime = (val: any) => {
    if (!val || val === "—" || val === "-") return "—";
    return formatDateKSA(val) || "—";
  };

  // Group 1: Financing & Repayment
  const dpd = getValue(["DPD", "dpd"], "2");
  const lastInstallmentDate = formatDateWithoutTime(
    getValue(["LASTINSTALLMENTDATE", "LastInstallmentDate"], "01/12/2022")
  );
  const loanAmount = formatAmountKSA(getValue(["LOANAMOUNT", "LoanAmount"], "157481"));
  const totalLoanAmount = formatAmountKSA(getValue(["TOTALLOANAMOUNT", "TotalLoanAmount"], "302089"));
  const installmentAmount = formatAmountKSA(getValue(["INSTALLMENTAMOUNT", "InstallmentAmount"], "1305"));

  // Group 2: Outstanding & Overdue
  const principalOverdue = formatAmountKSA(getValue(["PRINCIPALOVERDUE", "PrincipalOverdue"], "892.89"));
  const profitOverdue = formatAmountKSA(getValue(["PROFITOVERDUE", "ProfitOverdue"], "0"));
  const insuranceOverdue = formatAmountKSA(getValue(["INSURANCEOVERDUE", "InsuranceOverdue"], "0"));
  const amortizedChargeOverdue = formatAmountKSA(getValue(["AMORTIZEDCHARGEOVERDUE", "AmortizedChargeOverdue"], "0"));
  const upfrontChargeOverdue = formatAmountKSA(getValue(["UPFRONTCHARGEOVERDUE", "UpfrontChargeOverdue"], "0"));
  const otherChargeOverdue = formatAmountKSA(getValue(["OTHERCHARGEOVERDUE", "OtherChargeOverdue"], "0"));

  // Group 3: Payment Summary
  const totalLoanReceivableOS = formatAmountKSA(getValue(["TOTALLOANRECEIVABLEOS", "TotalLoanReceivableOs"], "-1632.88"));
  const totalChargeReceivableOS = formatAmountKSA(getValue(["TOTALCHARGERECEIVABLEOS", "TotalChargeReceivableOs"], "-1632.88"));
  const principalPaid = formatAmountKSA(getValue(["PRINCIPALPAID", "PrincipalPaid"], "-1632.68"));
  const profitPaid = formatAmountKSA(getValue(["PROFITPAID", "ProfitPaid"], "0"));
  const insurancePaid = formatAmountKSA(getValue(["INSURANCEPAID", "InsurancePaid"], "0"));
  const chargePaid = formatAmountKSA(getValue(["CAPITALIZEDCHARGEPAID", "CapitalizedChargePaid"], "0"));

  // Group 4: Loan Components
  const profitAmount = formatAmountKSA(getValue(["PROFITAMOUNT", "ProfitAmount"], "144608"));
  const insuranceAmount = formatAmountKSA(getValue(["INSURANCEAMOUNT", "InsuranceAmount"], "0"));
  const amortizedChargeAmount = formatAmountKSA(getValue(["AMORTIZEDCHARGEAMOUNT", "AmortizedChargeAmount"], "0"));
  const capitalizedChargeAmount = formatAmountKSA(getValue(["CAPITALIZEDCHARGEAMOUNT", "CapitalizedChargeAmount"], "0"));
  const taxAmount = formatAmountKSA(getValue(["TAXAMOUNT", "TaxAmount"], "0"));
  const otherChargeAmount = formatAmountKSA(getValue(["OTHERCHARGEAMOUNT", "OtherChargeAmount"], "0"));
  const residualAmount = formatAmountKSA(getValue(["RESIDUALAMOUNT", "ResidualAmount"], "0"));
  const upfrontChargeAmount = formatAmountKSA(getValue(["UPFRONTCHARGEAMOUNT", "UpfrontChargeAmount"], "0"));

  return (
    <div className="xl:col-span-8 flex flex-col gap-5">
      {/* 1. Financing & Repayment Card */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5 font-bold text-gray-900 dark:text-white text-sm">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="tracking-wide">Financing & Repayment</span>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">DPD</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono mt-1">
              {dpd}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Loan Amount</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono mt-1">
              {loanAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Loan Amount</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono mt-1">
              {totalLoanAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Installment</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono mt-1">
              {installmentAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Last Installment Date</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono mt-1">
              {lastInstallmentDate}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Outstanding & Overdue + Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Outstanding & Overdue */}
        <div className="relative overflow-hidden lg:col-span-6 rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] flex flex-col">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5 font-bold text-gray-900 dark:text-white text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="tracking-wide">Outstanding & Overdue</span>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Principal Overdue with prominent styling */}
            <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col">
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400">Principal Overdue</span>
              <span className="text-base font-extrabold text-red-700 dark:text-red-300 font-mono mt-1">
                {principalOverdue}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Profit Overdue</span>
              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
                {profitOverdue}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Insurance Overdue</span>
              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
                {insuranceOverdue}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Amortized Charge Overdue</span>
              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
                {amortizedChargeOverdue}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Upfront Charge Overdue</span>
              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
                {upfrontChargeOverdue}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Other Charge Overdue</span>
              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
                {otherChargeOverdue}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="relative overflow-hidden lg:col-span-6 rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] flex flex-col">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5 font-bold text-gray-900 dark:text-white text-sm">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="tracking-wide">Payment Summary</span>
          </div>
          <div className="p-4 sm:p-5 flex flex-col divide-y divide-gray-100 dark:divide-gray-800/80 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Total Receivable Outstanding</span>
              <span className="font-bold font-mono text-gray-900 dark:text-white">{totalLoanReceivableOS}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Charge Receivable Outstanding</span>
              <span className="font-bold font-mono text-gray-900 dark:text-white">{totalChargeReceivableOS}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Principal Paid</span>
              <span className="font-bold font-mono text-gray-900 dark:text-white">{principalPaid}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Profit Paid</span>
              <span className="font-bold font-mono text-gray-900 dark:text-white">{profitPaid}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Insurance Paid</span>
              <span className="font-bold font-mono text-gray-900 dark:text-white">{insurancePaid}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Charge Paid</span>
              <span className="font-bold font-mono text-gray-900 dark:text-white">{chargePaid}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Loan Components Card */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5 font-bold text-gray-900 dark:text-white text-sm">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="tracking-wide">Loan Components</span>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Profit Amount</span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
              {profitAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Insurance</span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
              {insuranceAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Amortized Charge</span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
              {amortizedChargeAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Capitalized Charge</span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
              {capitalizedChargeAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Tax Amount</span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
              {taxAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Other Charge</span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
              {otherChargeAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Residual Amount</span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
              {residualAmount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Upfront Charge</span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-1">
              {upfrontChargeAmount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
