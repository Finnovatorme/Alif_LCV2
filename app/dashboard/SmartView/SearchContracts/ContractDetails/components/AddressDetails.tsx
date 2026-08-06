"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import GenericCardForm, { FieldConfig } from "@/components/FormComponent/GenericCardForm";
import { MapPin } from "lucide-react";
import { getCustomerAddress } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";

export default function AddressDetails({ cifId }: { cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerAddress({ CIFID: cifId, language });
        setData(response || []);
      } catch (error) {
        toast.error("Failed to fetch address details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cifId, language]);

  const fields: FieldConfig[] = [
    { name: "BUILDINGNO", label: "Building Number", type: "number", disabled: true },
    { name: "ADDITIONALNO", label: "Additional Number", type: "number", disabled: true },
    { name: "UNITNO", label: "Unit Number", type: "number", disabled: true },
    { name: "GPSCOORDINATESLA", label: "GPS Coordinates LA", type: "number", disabled: true },
    { name: "GPSCOORDINATESLO", label: "GPS Coordinates LO", type: "number", disabled: true },
    { name: "ADDRESSTYPE", label: "Address Type", type: "input", disabled: true },
    { name: "ADDRSTATUS", label: "Address Status", type: "input", disabled: true },
    { name: "RESIDENCETYPE", label: "Residence Type", type: "input", disabled: true },
    { name: "COMPLETEADDRESS", label: "Complete Address", type: "input", disabled: true },
    { name: "ADRESS1ARABIC", label: "Address in Arabic 1", type: "input", disabled: true },
    { name: "ADDRESS2ARABIC", label: "Address in Arabic 2", type: "input", disabled: true },
    { name: "ADDRESS1ENGLISH", label: "Address in English 1", type: "input", disabled: true },
    { name: "ADDRESS2ENGLISH", label: "Address in English 2", type: "input", disabled: true },
    { name: "ADDRESS3ENGLISH", label: "Address in English 3", type: "input", disabled: true },
    { name: "COUNTRY", label: "Country", type: "input", disabled: true },
    { name: "REGION", label: "Region", type: "input", disabled: true },
    { name: "DISTRICT", label: "District", type: "input", disabled: true },
    { name: "CITYNAME", label: "City Name", type: "input", disabled: true },
    { name: "POBOX", label: "PO Box", type: "number", disabled: true },
    { name: "ZIPCODE", label: "Zip Code", type: "number", disabled: true },
    { name: "LANDMARK", label: "Landmark", type: "input", disabled: true },
    { name: "OCCUPANCYSINCE", label: "Occupancy Since", type: "number", disabled: true },
    { name: "CONTACTPERSONTYPE", label: "Contact Person Type", type: "input", disabled: true },
    { name: "CONTACTPERSON", label: "Contact Person", type: "input", disabled: true },
    { name: "CONTACTMETHOD", label: "Contact Method", type: "input", disabled: true },
    { name: "PREFCONTACTTIME", label: "Pref. Contact time", type: "input", disabled: true },
    { name: "PRIMARYPHONE", label: "Primary Phone", type: "input", disabled: true },
    { name: "PRIMARYPHONEEXT", label: "Primary Phone Ext.", type: "number", disabled: true },
    { name: "SECONDARYPHONE", label: "Secondary Phone", type: "input", disabled: true },
    { name: "SECONDARYPHONEEXT", label: "Secondary Phone Ext.", type: "number", disabled: true },
    { name: "FAX", label: "Fax", type: "input", disabled: true },
    { name: "PRIMARYMOBILE", label: "Primary Mobile", type: "input", disabled: true },
    { name: "SECONDARYMOBILE", label: "Secondary Mobile", type: "input", disabled: true },
    { name: "EMAIL", label: "Email", type: "input", disabled: true },
    { name: "LINKEDLN", label: "LinkedIn", type: "input", disabled: true },
    { name: "FACEBOOK", label: "Facebook", type: "input", disabled: true },
    { name: "TWITTER", label: "Twitter", type: "input", disabled: true },
    { name: "ISPRIMARY", label: "Is Primary", type: "switch", disabled: true },
  ];

  return (
    <div className="space-y-6">
      {data.length > 0 ? (
        data.map((address, index) => (
          <GenericCardForm
            key={index}
            title={`Address Details ${index + 1} ${address.ISPRIMARY ? "(Primary)" : ""}`}
            formFields={fields}
            prefilled={address}
            disabled={true}
            hideSubmitButton={true}
            
            icon={MapPin}
          />
        ))
      ) : (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-500 font-medium">No address information available</p>
        </div>
      )}
    </div>
  );
}
