"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import GenericCardForm, { FieldConfig } from "@/components/FormComponent/GenericCardForm";
import { User } from "lucide-react";
import { getCustomerDetails } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";

export default function CustomerDetails({ cifId }: { cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerDetails({ CIFID: cifId, language });
        const rawDetails =
          response?.CustomerDetail?.[0] ||
          (Array.isArray(response?.CustomerDetail) ? response.CustomerDetail[0] : response?.CustomerDetail) ||
          response?.CustomerDetails?.[0] ||
          (Array.isArray(response?.CustomerDetails) ? response.CustomerDetails[0] : response?.CustomerDetails) ||
          (Array.isArray(response?.data?.CustomerDetail) ? response.data.CustomerDetail[0] : response?.data?.CustomerDetail) ||
          (Array.isArray(response?.data) ? response.data[0] : response?.data) ||
          (Array.isArray(response) ? response[0] : response);

        if (rawDetails && typeof rawDetails === "object" && !rawDetails.error) {
          // Normalize keys so field matching works seamlessly for uppercase property names
          const normalized: Record<string, any> = { ...rawDetails };
          Object.keys(rawDetails).forEach((key) => {
            normalized[key.toUpperCase()] = rawDetails[key];
          });
          setData(normalized);
        } else {
          setData(null);
        }
      } catch (error) {
        toast.error("Failed to fetch customer details");
      } finally {
        setLoading(false);
      }
    };
    if (cifId) {
      fetchData();
    }
  }, [cifId, language]);

  const fields: FieldConfig[] = [
    { name: "CUSTOMERNAME", label: "Customer Name", type: "input", disabled: true },
    { name: "CUSTOMERTYPE", label: "Customer Type", type: "input", disabled: true },
    { name: "DOB_G", label: "Date of Birth (G)", type: "input", disabled: true },
    { name: "DOB_H", label: "Date of Birth (H)", type: "input", disabled: true },
    { name: "GENDER", label: "Gender", type: "input", disabled: true },
    { name: "NATIONALITY", label: "Nationality", type: "input", disabled: true },
    { name: "RESIDENTIALSTATUS", label: "Residential Status", type: "input", disabled: true },
    { name: "RESIDENCETYPE", label: "Residence Type", type: "input", disabled: true },
    { name: "MARITALSTATUS", label: "Marital Status", type: "input", disabled: true },
    { name: "NOOFDEPENDENTS", label: "No. of Dependents", type: "number", disabled: true },
    { name: "QUALIFICATIONTYPE", label: "Qualification", type: "input", disabled: true },
    { name: "CUSTOMERCATEGORY", label: "Customer Category", type: "input", disabled: true },
    { name: "INCOMEBRACKET", label: "Income Bracket", type: "number", disabled: true },
    { name: "CUSTOMERRATING", label: "Customer Rating", type: "input", disabled: true },
    { name: "SALARYCREDITTOBANK", label: "Salary Credit to Bank", type: "input", disabled: true },
    { name: "REFERREDBY", label: "Referred By", type: "input", disabled: true },
    { name: "REFERALCODE", label: "Referral Code", type: "input", disabled: true },
    { name: "BLACKLISTED", label: "Blacklisted", type: "input", disabled: true },
    { name: "RELATEDCIFID", label: "Related CIF ID", type: "input", disabled: true },
    { name: "RELATIONSHIPTYPE", label: "Relationship Type", type: "input", disabled: true },
    { name: "REMARKS", label: "Remarks", type: "input", disabled: true },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-2 text-sm text-slate-500 font-medium">Loading customer details...</p>
      </div>
    );
  }

  return (
    <GenericCardForm
      title="Personal Information"
      formFields={fields}
      prefilled={data}
      disabled={true}
      hideSubmitButton={true}
      icon={User}
    />
  );
}
