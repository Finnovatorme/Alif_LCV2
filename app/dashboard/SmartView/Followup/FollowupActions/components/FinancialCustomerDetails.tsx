"use client";

import React from "react";
import { formatDateKSA, formatAmountKSA } from "@/utils/helpers";
import { Calculator, AlertTriangle, FileText, Layers } from "lucide-react";

interface FinancialCustomerDetailsProps {
  data: Record<string, any>;
}

export const FinancialCustomerDetails: React.FC<FinancialCustomerDetailsProps> = ({ data }) => {
  const normalizedData = React.useMemo(() => {
    const map: Record<string, any> = {};
    if (!data || typeof data !== "object") return map;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null && val !== "") {
        map[key] = val;
        const upperKey = key.toUpperCase();
        if (map[upperKey] === undefined) {
          map[upperKey] = val;
        }
      }
    }
    return map;
  }, [data]);

  const getValue = (keys: string[]): any => {
    for (const k of keys) {
      if (normalizedData[k] !== undefined) {
        return normalizedData[k];
      }
      const upper = k.toUpperCase();
      if (normalizedData[upper] !== undefined) {
        return normalizedData[upper];
      }
    }
    return null;
  };

  const formatAmountOrDash = (val: any) => {
    if (val === null || val === undefined || val === "" || val === "—") return "—";
    return formatAmountKSA(val);
  };

  const formatTextOrDash = (val: any) => {
    if (val === null || val === undefined || val === "" || val === "—") return "—";
    return String(val);
  };

  const formatDateWithoutTime = (val: any) => {
    if (!val || val === "—" || val === "-") return "—";
    return formatDateKSA(val) || "—";
  };

  // Group 1: Financing & Repayment (strictly API values, no static fallbacks)
  const dpd = formatTextOrDash(getValue(["DPD", "dpd"]));
  const lastInstallmentDate = formatDateWithoutTime(
    getValue(["LASTINSTALLMENTDATE", "LastInstallmentDate"])
  );
  const loanAmount = formatAmountOrDash(getValue(["LOANAMOUNT", "LoanAmount"]));
  const totalLoanAmount = formatAmountOrDash(getValue(["TOTALLOANAMOUNT", "TotalLoanAmount"]));
  const installmentAmount = formatAmountOrDash(getValue(["INSTALLMENTAMOUNT", "InstallmentAmount"]));

  // Group 2: Outstanding & Overdue (strictly API values, no static fallbacks)
  const rawPrincipalOverdue = getValue(["PRINCIPALOVERDUE", "PrincipalOverdue"]);
  const principalOverdue = formatAmountOrDash(rawPrincipalOverdue);
  const hasPrincipalOverdue =
    rawPrincipalOverdue !== null && Number(rawPrincipalOverdue) > 0;
  const profitOverdue = formatAmountOrDash(getValue(["PROFITOVERDUE", "ProfitOverdue"]));
  const insuranceOverdue = formatAmountOrDash(getValue(["INSURANCEOVERDUE", "InsuranceOverdue"]));
  const amortizedChargeOverdue = formatAmountOrDash(
    getValue(["AMORTIZEDCHARGEOVERDUE", "AmortizedChargeOverdue"])
  );
  const upfrontChargeOverdue = formatAmountOrDash(
    getValue(["UPFRONTCHARGEOVERDUE", "UpfrontChargeOverdue"])
  );
  const otherChargeOverdue = formatAmountOrDash(
    getValue(["OTHERCHARGEOVERDUE", "OtherChargeOverdue"])
  );

  // Group 3: Payment Summary (strictly API values, no static fallbacks)
  const totalLoanReceivableOS = formatAmountOrDash(
    getValue(["TOTALLOANRECEIVABLEOS", "TotalLoanReceivableOs"])
  );
  const totalChargeReceivableOS = formatAmountOrDash(
    getValue(["TOTALCHARGERECEIVABLEOS", "TotalChargeReceivableOs"])
  );
  const principalPaid = formatAmountOrDash(getValue(["PRINCIPALPAID", "PrincipalPaid"]));
  const profitPaid = formatAmountOrDash(getValue(["PROFITPAID", "ProfitPaid"]));
  const insurancePaid = formatAmountOrDash(getValue(["INSURANCEPAID", "InsurancePaid"]));
  const chargePaid = formatAmountOrDash(
    getValue(["CAPITALIZEDCHARGEPAID", "CapitalizedChargePaid", "CHARGEPAID", "ChargePaid"])
  );

  // Group 4: Loan Components (strictly API values, no static fallbacks)
  const profitAmount = formatAmountOrDash(getValue(["PROFITAMOUNT", "ProfitAmount"]));
  const insuranceAmount = formatAmountOrDash(getValue(["INSURANCEAMOUNT", "InsuranceAmount"]));
  const amortizedChargeAmount = formatAmountOrDash(
    getValue(["AMORTIZEDCHARGEAMOUNT", "AmortizedChargeAmount"])
  );
  const capitalizedChargeAmount = formatAmountOrDash(
    getValue(["CAPITALIZEDCHARGEAMOUNT", "CapitalizedChargeAmount"])
  );
  const taxAmount = formatAmountOrDash(getValue(["TAXAMOUNT", "TaxAmount"]));
  const otherChargeAmount = formatAmountOrDash(
    getValue(["OTHERCHARGEAMOUNT", "OtherChargeAmount"])
  );
  const residualAmount = formatAmountOrDash(getValue(["RESIDUALAMOUNT", "ResidualAmount"]));
  const upfrontChargeAmount = formatAmountOrDash(
    getValue(["UPFRONTCHARGEAMOUNT", "UpfrontChargeAmount"])
  );

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
            <div
              className={`p-3 rounded-xl border flex flex-col ${
                hasPrincipalOverdue
                  ? "bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900/60"
                  : "bg-gray-50/70 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
              }`}
            >
              <span
                className={`text-[11px] font-bold ${
                  hasPrincipalOverdue
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400 font-medium"
                }`}
              >
                Principal Overdue
              </span>
              <span
                className={`text-base font-extrabold font-mono mt-1 ${
                  hasPrincipalOverdue
                    ? "text-red-700 dark:text-red-300"
                    : "text-gray-900 dark:text-white font-bold"
                }`}
              >
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
