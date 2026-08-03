"use client";

import React from "react";

interface FieldBoxProps {
  label: string;
  value: any;
  isOverdue?: boolean;
}

const FieldBox: React.FC<FieldBoxProps> = ({ label, value, isOverdue = false }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <label
        className={`text-xs font-medium ${
          isOverdue
            ? "text-red-600 dark:text-red-400 font-semibold"
            : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {label}
      </label>
      <div
        className={`w-full h-10 px-3.5 flex items-center rounded-xl text-sm font-medium transition-all shadow-xs ${
          isOverdue
            ? "border border-red-500/80 dark:border-red-500/60 bg-red-50/40 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-bold"
            : "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        }`}
      >
        <span className="truncate">
          {value === null || value === undefined || String(value).trim() === ""
            ? "0"
            : String(value)}
        </span>
      </div>
    </div>
  );
};

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
    if (!val || val === "—") return "—";
    const str = String(val).trim();
    if (str.includes("T")) {
      return str.split("T")[0];
    }
    if (str.includes(" ")) {
      return str.split(" ")[0];
    }
    return str;
  };

  const leftFields = [
    { label: "DPD", value: getValue(["DPD", "dpd"], "2"), isOverdue: false },
    { label: "Last Installment Date", value: formatDateWithoutTime(getValue(["LASTINSTALLMENTDATE", "LastInstallmentDate"], "01/12/2022")), isOverdue: false },
    { label: "Loan Amount", value: getValue(["LOANAMOUNT", "LoanAmount"], "157481"), isOverdue: false },
    { label: "Principal Amount", value: getValue(["PRINCIPALAMOUNT", "PrincipalAmount"], "157481"), isOverdue: false },
    { label: "Profit Amount", value: getValue(["PROFITAMOUNT", "ProfitAmount"], "144608"), isOverdue: false },
    { label: "Insurance Amount", value: getValue(["INSURANCEAMOUNT", "InsuranceAmount"], "0"), isOverdue: false },
    { label: "Amortized Charge Amount", value: getValue(["AMORTIZEDCHARGEAMOUNT", "AmortizedChargeAmount"], "0"), isOverdue: false },
    { label: "Capitalized Charge Amount", value: getValue(["CAPITALIZEDCHARGEAMOUNT", "CapitalizedChargeAmount"], "0"), isOverdue: false },
    { label: "Tax Amount", value: getValue(["TAXAMOUNT", "TaxAmount"], "0"), isOverdue: false },
    { label: "Total Loan Amount", value: getValue(["TOTALLOANAMOUNT", "TotalLoanAmount"], "302089"), isOverdue: false },
    { label: "Other Charge Amount", value: getValue(["OTHERCHARGEAMOUNT", "OtherChargeAmount"], "0"), isOverdue: false },
    { label: "Installment Amount", value: getValue(["INSTALLMENTAMOUNT", "InstallmentAmount"], "1305"), isOverdue: false },
    { label: "Residual Amount", value: getValue(["RESIDUALAMOUNT", "ResidualAmount"], "0"), isOverdue: false },
    { label: "Upfront Charge Amount", value: getValue(["UPFRONTCHARGEAMOUNT", "UpfrontChargeAmount"], "0"), isOverdue: false },
    { label: "Total Loan Receivable OS", value: getValue(["TOTALLOANRECEIVABLEOS", "TotalLoanReceivableOs"], "0"), isOverdue: false },
    { label: "Total Charge Receivable OS", value: getValue(["TOTALCHARGERECEIVABLEOS", "TotalChargeReceivableOs"], "0"), isOverdue: false },
    { label: "Principal Overdue", value: getValue(["PRINCIPALOVERDUE", "PrincipalOverdue"], "892.89"), isOverdue: true },
    { label: "Profit Overdue", value: getValue(["PROFITOVERDUE", "ProfitOverdue"], "0"), isOverdue: true },
    { label: "Insurance Overdue", value: getValue(["INSURANCEOVERDUE", "InsuranceOverdue"], "0"), isOverdue: true },
    { label: "Capitalized Charge Overdue", value: getValue(["CAPITALIZEDCHARGEOVERDUE", "CapitalizedChargeOverdue"], "0"), isOverdue: true },
    { label: "Amortized Charge Overdue", value: getValue(["AMORTIZEDCHARGEOVERDUE", "AmortizedChargeOverdue"], "0"), isOverdue: true },
    { label: "Upfront Charge Overdue", value: getValue(["UPFRONTCHARGEOVERDUE", "UpfrontChargeOverdue"], "0"), isOverdue: true },
    { label: "Other Charge Overdue", value: getValue(["OTHERCHARGEOVERDUE", "OtherChargeOverdue"], "0"), isOverdue: true },
    { label: "Principal Paid", value: getValue(["PRINCIPALPAID", "PrincipalPaid"], "-1632.68"), isOverdue: false },
    { label: "Profit Paid", value: getValue(["PROFITPAID", "ProfitPaid"], "0"), isOverdue: false },
    { label: "Insurance Paid", value: getValue(["INSURANCEPAID", "InsurancePaid"], "0"), isOverdue: false },
    { label: "Capitalized Charge Paid", value: getValue(["CAPITALIZEDCHARGEPAID", "CapitalizedChargePaid"], "0"), isOverdue: false },
    { label: "Amortized Charge Paid", value: getValue(["AMORTIZEDCHARGEPAID", "AmortizedChargePaid"], "0"), isOverdue: false },
  ];

  return (
    <div className="xl:col-span-8 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        Customer Details
      </h2>

      <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(15,142,221,0.15)]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] p-6 lg:p-8 border border-white/40 dark:border-gray-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {leftFields.map((field, idx) => (
              <FieldBox
                key={idx}
                label={field.label}
                value={field.value}
                isOverdue={field.isOverdue}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
