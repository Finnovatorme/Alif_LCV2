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
        const details = response?.CustomerDetail?.[0] || null;
        setData(details);
      } catch (error) {
        toast.error("Failed to fetch customer details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
    // { name: "COMPREGCATEGORY", label: "Comp. Reg. Category", type: "input", disabled: true },
    // { name: "CUSTOMERSEGMENT", label: "Customer Segment", type: "input", disabled: true },
    // { name: "ECONOMYSECTOR", label: "Economy Sector", type: "input", disabled: true },
    // { name: "COMPANYINDUSTRY", label: "Company Industry", type: "input", disabled: true },
    // { name: "BUSINESSACTIVITY", label: "Business Activity", type: "input", disabled: true },
    // { name: "REGISTRATIONCOUNTRY", label: "Reg. Country", type: "input", disabled: true },
    // { name: "REGISTRATIONCITY", label: "Reg. City", type: "input", disabled: true },
    // { name: "BUSINESSVATNO", label: "Business VAT No", type: "number", disabled: true },
    // { name: "BUSGROUPVATNO", label: "Bus. Group VAT No", type: "number", disabled: true },
    // { name: "PAIDUPCAPITAL", label: "Paid-up Capital", type: "number", disabled: true },
    // { name: "ESTABLISHMENTDATE_G", label: "Estab. Date (G)", type: "input", disabled: true },
    // { name: "ESTABLISHMENTDATE_H", label: "Estab. Date (H)", type: "input", disabled: true },
    // { name: "REVENUECATEGORY", label: "Revenue Category", type: "input", disabled: true },
    // { name: "ANNUALREVENUE", label: "Annual Revenue", type: "number", disabled: true },
    { name: "CUSTOMERRATING", label: "Customer Rating", type: "input", disabled: true },
    { name: "SALARYCREDITTOBANK", label: "Salary Credit to Bank", type: "input", disabled: true },
    { name: "REFERREDBY", label: "Referred By", type: "input", disabled: true },
    { name: "REFERALCODE", label: "Referral Code", type: "input", disabled: true },
    { name: "BLACKLISTED", label: "Blacklisted", type: "input", disabled: true },
    { name: "RELATEDCIFID", label: "Related CIF ID", type: "input", disabled: true },
    { name: "RELATIONSHIPTYPE", label: "Relationship Type", type: "input", disabled: true },
    { name: "REMARKS", label: "Remarks", type: "input", disabled: true },
  ];

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
