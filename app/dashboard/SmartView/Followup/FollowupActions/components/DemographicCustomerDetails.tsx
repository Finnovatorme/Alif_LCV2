"use client";

import React from "react";

interface FieldBoxProps {
  label: string;
  value: any;
}

const FieldBox: React.FC<FieldBoxProps> = ({ label, value }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="w-full h-10 px-3.5 flex items-center rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all shadow-xs">
        <span className="truncate">
          {value === null || value === undefined || String(value).trim() === ""
            ? "0"
            : String(value)}
        </span>
      </div>
    </div>
  );
};

interface DemographicCustomerDetailsProps {
  data: Record<string, any>;
}

export const DemographicCustomerDetails: React.FC<DemographicCustomerDetailsProps> = ({ data }) => {
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

  const rightFields = [
    { label: "Customer Type", value: getValue(["CUSTOMERTYPE", "CustomerType"], "Individual") },
    { label: "ID Number", value: getValue(["IDNUMBER", "IdNumber"], "—") },
    { label: "Mobile Number", value: getValue(["MOBILENUMBER", "MobileNumber", "MOBILE"], "—") },
    { label: "Email", value: getValue(["EMAIL", "Email"], "—") },
    { label: "Date of Birth (H)", value: formatDateWithoutTime(getValue(["DATEOFBIRTH_H", "DOB_H", "DATEOFBIRTH"], "23/01/1980")) },
    { label: "Age (Hijri)", value: getValue(["AGE_HIJRI", "AgeHijri"], "—") },
    { label: "Age (Gregorian)", value: getValue(["AGE_GREGORIAN", "AgeGregorian"], "—") },
    { label: "Gender", value: getValue(["GENDER", "Gender"], "Male") },
    { label: "Nationality", value: getValue(["NATIONALITY", "Nationality"], "Saudi Arabia") },
    { label: "Residential Status", value: getValue(["RESIDENTIALSTATUS", "ResidentialStatus"], "Own House") },
    { label: "Residence Type", value: getValue(["RESIDENCETYPE", "ResidenceType"], "Apartment") },
    { label: "Marital Status", value: getValue(["MARITALSTATUS", "MaritalStatus"], "Married") },
    { label: "Number of Dependents", value: getValue(["NUMBEROFDEPENDENTS", "NumberOfDependents"], "0") },
    { label: "Qualification", value: getValue(["QUALIFICATION", "Qualification"], "Bachelor Degree") },
  ];

  return (
    <div className="xl:col-span-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        Customer Details
      </h2>

      <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(15,142,221,0.15)]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] p-6 lg:p-8 border border-white/40 dark:border-gray-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {rightFields.map((field, idx) => (
              <FieldBox key={idx} label={field.label} value={field.value} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
