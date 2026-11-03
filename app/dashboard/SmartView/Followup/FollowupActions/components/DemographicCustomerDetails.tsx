"use client";

import React from "react";
import { formatDateKSA } from "@/utils/helpers";
import { User, Home } from "lucide-react";

interface DemographicCustomerDetailsProps {
  data: Record<string, any>;
}

export const DemographicCustomerDetails: React.FC<DemographicCustomerDetailsProps> = ({ data }) => {
  const getValue = (keys: string[], fallback: any = "—") => {
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

  // Primary Customer Identification
  const customerName = getValue(
    ["CUSTOMERNAME", "CustomerName", "CUSTOMERFULLNAME", "FULLNAME"],
    "ALZAHRANI FATIMAH AHMED"
  );
  const cifId = getValue(["CIFID", "CifId", "cifId"], "1");
  const customerType = getValue(["CUSTOMERTYPE", "CustomerType"], "Individual");
  const customerCategory = getValue(["CUSTOMERCATEGORY", "CustomerCategory"], "Low Risk");

  // Personal Details
  const dobHijri = formatDateWithoutTime(
    getValue(["DOB_H", "DATEOFBIRTH_H", "DOB_H_DESC", "DATEOFBIRTH", "DOB_G"], "01/23/1980")
  );
  const age = getValue(["AGE_H", "AGE_G", "AGE_HIJRI", "AgeHijri", "AGE"], "46");
  const gender = getValue(["GENDER", "Gender"], "Male");
  const nationality = getValue(["NATIONALITY", "Nationality"], "Saudi Arabia");
  const maritalStatus = getValue(["MARITALSTATUS", "MaritalStatus"], "Married");
  const qualification = getValue(
    ["QUALIFICATIONTYPE", "QUALIFICATION", "QualificationType", "Qualification"],
    "Bachelor Degree"
  );
  const dependents = getValue(
    ["NOOFDEPENDENTS", "NUMBEROFDEPENDENTS", "NoOfDependents", "NumberOfDependents"],
    "0"
  );

  // Contact & Residence
  const idNumber = getValue(["IDNUMBER", "IdNumber"], "—");
  const contactNumber = getValue(
    ["CONTACTNUMBER", "MOBILENUMBER", "MobileNumber", "MOBILE", "ContactNumber"],
    "0531646712"
  );
  const email = getValue(["EMAIL", "Email"], "—");
  const residentialStatus = getValue(
    ["RESIDENTIALSTATUS", "ResidentialStatus"],
    "Own House"
  );
  const residenceType = getValue(
    ["RESIDENCETYPE", "ResidenceType"],
    "Apartment"
  );

  return (
    <div className="xl:col-span-4 flex flex-col gap-5">
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)]">
        {/* Top Gradient */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        {/* Header matching App Theme */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between font-bold text-gray-900 dark:text-white text-sm">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold tracking-wide">Customer Information</span>
          </div>
          {/* <span className="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            CIF: {cifId}
          </span> */}
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Top Customer Name & Identity Banner matching Theme */}
          {/* <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Customer Name
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-2xs">
                {customerType}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
              {customerName}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              <span>CIF ID: <strong className="font-mono text-gray-900 dark:text-white">{cifId}</strong></span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span>Category: <strong className="text-emerald-600 dark:text-emerald-400">{customerCategory}</strong></span>
            </div>
          </div> */}

          {/* Sub-section 1: Personal Details */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 mb-3.5">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="uppercase tracking-wider">Personal Details</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  DOB (Hijri)
                </span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  {dobHijri}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Nationality
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {nationality}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Age (Years)
                </span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  {age}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Marital Status
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {maritalStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Gender
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {gender}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Qualification
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {qualification}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 col-span-2">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Number of Dependents
                </span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  {dependents}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Sub-section 2: Contact & Residence */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 mb-3.5">
              <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="uppercase tracking-wider">Contact & Residence</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  ID Number
                </span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  {idNumber}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Mobile
                </span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">
                  {contactNumber}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Residential Status
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {residentialStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Residence Type
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {residenceType}
                </span>
              </div>

              <div className="col-span-2 p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                  Email
                </span>
                <span className="font-bold text-gray-900 dark:text-white truncate block">
                  {email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
