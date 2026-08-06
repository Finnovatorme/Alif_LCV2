"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Box, Tag, Layers } from "lucide-react";
import { getCustomerAssetCommodity } from "../../HandlingAPIs";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";

export default function AssetDetails({ cifId }: { cifId: string }) {
  const language = useSelector(languageParams);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getCustomerAssetCommodity({ CIFID: cifId, language });
        setData(response || []);
      } catch (error) {
        toast.error("Failed to fetch asset details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cifId, language]);

  const columns: ColumnDef<any>[] = [
    {
      id: "actions",
      header: "Actions",
    },
    { accessorKey: "ASSETNAME", header: "Asset Name" },
    { accessorKey: "ASSETMODEL", header: "Model" },
    { accessorKey: "ITEMCODE", header: "Item Code" },
    { 
      accessorKey: "ASSETPRICE", 
      header: "Price",
      cell: ({ getValue }) => <span className="font-bold text-indigo-600">{getValue() as string}</span>
    },
    { accessorKey: "ASSETQUANTITY", header: "Qty" },
    { accessorKey: "DOWNPAYMENT", header: "Down Payment" },
    { accessorKey: "RESIDUALAMOUNT", header: "Residual" },
  ];

  const keyMappings = {
    APPID: "App ID",
    ASSETCATEGORY: "Category",
    ASSETCOLOR: "Color",
    ASSETCONDITION: "Condition",
    ASSETDELIVERYLOCATION: "Delivery Location",
    ASSETMAKER: "Maker",
    ASSETMODEL: "Model",
    ASSETNAME: "Asset Name",
    ASSETPRICE: "Price",
    ASSETQUANTITY: "Quantity",
    ASSETSPECIFICATION: "Specification",
    ASSETSUBCATEGORY: "Sub-category",
    ASSETVARIENT: "Variant",
    BARCODE: "Barcode",
    CIFID: "CIF ID",
    COUNTRYMANUFACTURE: "Country of Mfg",
    DOWNPAYMENT: "Down Payment",
    FULLFILMENTCITY: "Fulfillment City",
    ITEMCODE: "Item Code",
    LOANID: "Loan ID",
    LOANREFERENCENO: "Loan Ref No",
    MANUFACTUREYEAR: "Mfg Year",
    RECSTATUS: "Record Status",
    RESIDUALAMOUNT: "Residual Amount",
    SKUCODE: "SKU Code",
    SUPPLIERNAME: "Supplier Name",
    SUPPLIERRECID: "Supplier ID",
    TOTALCOUNT: "Total Count",
    UNITOFMEASURE: "UOM",
    UPDATEDATE: "Update Date",
  };

  return (
    <ReusableDataTable
      title="Assets & Commodities"
      initialData={data}
      columns={columns}
      loading={loading}
      keyMappings={keyMappings}
    />
  );
}
