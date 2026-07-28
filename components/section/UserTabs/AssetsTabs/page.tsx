"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { languageParams, dashboardParams } from "@/lib/redux/slices/dashboardApplSlice";
import { EditModal } from "@/components/ui/editmodal";
import type { AnyFieldConfig } from "@/types/field.types";
import { useAuth } from "@/hooks/useAuth";

import {
  vbValue,
  fetchFinancierOptions,
  fetchAssetsOptions,
} from "@/utils/dropDownApis";

type Option = { value: number | string; label: string };

export type ApiAssetDetail = {
  id: number;
  TADRECID: number;
  ASSETNAME?: string;
  ASSETS?: string;
  SUPPLIERFULLNAME?: string;
  ASSETCOLOR?: string;
  ASSETCONDITION?: string;
  FULLFILMENTCITY?: string;
  ASSETPRICE?: number;
  RECSTATUS?: boolean;
  WEIGHT?: number;
  [key: string]: any;
};

interface AssetRow extends ApiAssetDetail {
  id: number;
  ASSETS: string;
  ASSETNAME: string;
  SUPPLIERFULLNAME: string;
  ORIGINALASSETPRICE: number;
  DISCOUNTPERCENT: number;
}

export default function AssetTabs() {
  const { t } = useTranslation("AssetFinMasterSupplierAssets");
  const router = useRouter();
  const dispatch = useDispatch();
  const language = useSelector(languageParams);
  const appParams = useSelector(dashboardParams);
  const currentAppId = appParams?.APPID;
  const { user } = useAuth();

  const [records, setRecords] = useState<AssetRow[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AssetRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const categories = [
      "SUPPLIERTYPE",
      "ASSETCONDITION",
      "ASSETCOLOR",
      "UNITOFMEASURE",
      "ASSETDELIVERYLOCATION",
      "FULLFILMENTCITY",
      "COUNTRYMANUFACTURE",
      "ASSETMINORCOLOR",
    ];

    categories.forEach((cat) => {
      getVbValues(cat);
    });

    getFinancierValues();
    getAssetsValues();
  }, []);

  const getVbValues = async (category: string) => {
    try {
      const options = await vbValue(category);
      setDdValues((prev) => ({ ...prev, [category]: options }));
    } catch (err) {
      console.error(`Failed to fetch ${category}`, err);
    }
  };

  const getFinancierValues = async () => {
    try {
      const options = await fetchFinancierOptions();
      setDdValues((prev) => ({ ...prev, FINANCIER: options }));
    } catch (err) {
      console.error("Failed to fetch financiers", err);
    }
  };

  const getAssetsValues = async () => {
    try {
      const options = await fetchAssetsOptions();
      setDdValues((prev) => ({ ...prev, ASSETS: options }));
    } catch (err) {
      console.error("Failed to fetch assets", err);
    }
  };

  // Convert value to number safely
  const toNum = (v: any, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fetchRecords = async () => {
    if (!currentAppId) return;
    try {
      setLoading(true);
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const response = await axios.get(
        `${baseUrl}/api/AssetDetail?APPID=${currentAppId}&Language=${language}`,
      );

      console.log("API Response:", response.data);

      const data: ApiAssetDetail[] = Array.isArray(response.data)
        ? response.data
        : [];

      const mapped: AssetRow[] = data.map((item) => ({
        ...item,
        id: toNum(item.TADRECID),
        // Map API keys to Form keys
        financierId: item.FINANCIERID,
        appId: item.APPID,
        supplierRecId: item.SUPPLIERRECID,
        assetRecId: item.ASSETRECID,
        assetSpecification: item.ASSETSPECIFICATION,
        manufactureYear: item.MANUFACTUREYEAR,
        vb_AssetCondition: item.ASSETCONDITION,
        vb_AssetColor: item.ASSETCOLOR,
        itemCode: item.ITEMCODE,
        barcode: item.BARCODE,
        skuCode: item.SKUCODE,
        assetPrice: item.ASSETPRICE,
        assetQuantity: item.ASSETQUANTITY,
        vb_Unitofmeasure: item.UNITOFMEASURE,
        vb_AssetDeliveryLocation: item.ASSETDELIVERYLOCATION,
        vb_FullfilmentCity: item.FULLFILMENTCITY,
        vb_CountryManufacture: item.COUNTRYMANUFACTURE,
        vb_AssetMinorColor: item.ASSETMINORCOLOR,
        noOfPassengers: item.NOOFPASSENGERS,
        capacity: item.CAPACITY,
        weight: item.WEIGHT,
        numberOfCylinder: item.NUMBEROFCYLINDER,
        othDesc1: item.OTHDESC1,
        othDesc2: item.OTHDESC2,
        othDesc3: item.OTHDESC3,
        othDesc4: item.OTHDESC4,

        ASSETS: item.ASSETS ?? `Asset-${item.ASSETRECID ?? 0}`,
        ASSETNAME: item.ASSETNAME ?? `Asset-${item.ASSETRECID ?? 0}`,
        SUPPLIERFULLNAME:
          item.SUPPLIERFULLNAME ?? `Supplier-${item.SUPPLIERRECID ?? 0}`,
        ORIGINALASSETPRICE: toNum(
          item.ORIGINALASSETPRICE,
          toNum(item.ASSETPRICE, 0),
        ),
        DISCOUNTPERCENT: toNum(item.DISCOUNTPERCENT, 0),
        ASSETCOLOR: item.ASSETCOLOR ?? "",
        ASSETPRICE: toNum(item.ASSETPRICE, 0),
        UNITOFMEASURE: item.UNITOFMEASURE ?? "",
        RECSTATUS: Boolean(item.RECSTATUS),
      }));

      console.log("Mapped Records:", mapped);

      setRecords(mapped);
      mapped.length
        ? toast.success("Data fetched successfully")
        : toast.info("No data found");
    } catch (error) {
      console.error("API Error:", error);
      setRecords([]);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentAppId, language]);

  const columns: ColumnDef<AssetRow>[] = useMemo(
    () => [
      { id: "select", header: "Select" },
      { id: "actions", header: "Actions" },
      { accessorKey: "TADRECID", header: "Record ID" },
      { accessorKey: "WEIGHT", header: "Weight" },
      { accessorKey: "ASSETCOLOR", header: "Asset Color" },
      { accessorKey: "ASSETCONDITION", header: "Asset Condition" },
      { accessorKey: "FULLFILMENTCITY", header: "Fullfilment City" },
      { accessorKey: "ASSETPRICE", header: "Asset Price" },
      {
        accessorKey: "RECSTATUS",
        header: "STATUS",
        cell: ({ row }: any) => {
          const value = Boolean(row.original.RECSTATUS);
          return (
            <div className="flex items-center justify-start">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border shadow-sm ${
                  value
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-700 border-rose-200/50 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
                }`}
              >
                <span className={`relative flex w-2 h-2`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${value ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                  <span className={`relative inline-flex rounded-full w-2 h-2 ${value ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                </span>
                {value ? "Active" : "Inactive"}
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const fields: AnyFieldConfig[] = [
    {
      type: "section",
      title: "Financier",
      fields: [
        {
          name: "financierId",
          label: "Financier",
          type: "select",
          options: ddValues.FINANCIER ?? [],
          placeholder: "Select Financier",
        },
        {
          name: "supplierRecId",
          label: "Supplier",
          type: "select",
          options: ddValues?.SUPPLIERTYPE ?? [],
          placeholder: "Select Supplier",
        },
      ],
    },
    {
      type: "section",
      title: "Asset Information",
      fields: [
        {
          type: "select",
          name: "assetRecId",
          label: "Asset",
          error: "",
          required: true,
          options: ddValues?.ASSETS ?? [],
        },
        {
          name: "assetSpecification",
          label: "Asset Specification",
          type: "input",
        },
        { name: "manufactureYear", label: "Manufacture Year", type: "number" },
        {
          name: "vb_AssetCondition",
          label: "Asset Condition",
          type: "select",
          options: ddValues?.ASSETCONDITION ?? [],
          placeholder: "Select Condition",
        },
        {
          name: "vb_AssetColor",
          label: "Asset Color",
          type: "select",
          options: ddValues?.ASSETCOLOR ?? [],
          placeholder: "Select Color",
        },
        { name: "itemCode", label: "Item Code", type: "input" },
        { name: "barcode", label: "Barcode", type: "input" },
        { name: "skuCode", label: "SKU Code", type: "input" },
        { name: "assetPrice", label: "Asset Price", type: "number" },
        { name: "assetQuantity", label: "Quantity", type: "number" },
        {
          name: "vb_Unitofmeasure",
          label: "Unit Of Measure",
          type: "select",
          options: ddValues?.UNITOFMEASURE ?? [],
          placeholder: "Select Unit",
        },
        {
          type: "select",
          name: "vb_AssetDeliveryLocation",
          label: "Asset Delivery Location",
          error: "",
          required: true,
          options: ddValues?.ASSETDELIVERYLOCATION ?? [],
        },
        {
          type: "select",
          name: "vb_FullfilmentCity",
          label: "Fullfilment City",
          error: "",
          required: true,
          options: ddValues?.FULLFILMENTCITY ?? [],
        },
        {
          type: "select",
          name: "vb_CountryManufacture",
          label: "Country Manufacture",
          error: "",
          required: true,
          options: ddValues?.COUNTRYMANUFACTURE ?? [],
        },
        {
          type: "select",
          name: "vb_AssetMinorColor",
          label: "Asset Minor Color",
          error: "",
          required: true,
          options: ddValues?.ASSETMINORCOLOR ?? [],
        },
        {
          name: "noOfPassengers",
          label: "Number of Passengers",
          type: "number",
        },
        { name: "capacity", label: "Capacity", type: "number" },
        { name: "weight", label: "Weight", type: "number" },
        {
          name: "numberOfCylinder",
          label: "Number of Cylinders",
          type: "number",
        },
      ],
    },
    {
      type: "section",
      title: " Remarks",
      fields: [
        { name: "othDesc1", label: "Description 1", type: "textarea" },
        { name: "othDesc2", label: "Description 2", type: "textarea" },
        { name: "othDesc3", label: "Description 3", type: "textarea" },
      ],
    },
  ];

  const keyMappings = {
    ASSETS: "ASSETS",
    ASSETNAME: "ASSETNAME",
    SUPPLIERFULLNAME: "SUPPLIERFULLNAME",
    ASSETCOLOR: "ASSETCOLOR",
    ORIGINALASSETPRICE: "ORIGINALASSETPRICE",
    DISCOUNTPERCENT: "DISCOUNTPERCENT",
    ASSETPRICE: "ASSETPRICE",
    UNITOFMEASURE: "UNITOFMEASURE",
    RECSTATUS: "STATUS",
  };

  const handleFormSubmit = async (data: any) => {
    const payload = {
      FINANCIERID: toNum(data.financierId),
      APPID: toNum(currentAppId) || toNum(data.appId),
      SUPPLIERRECID: toNum(data.supplierRecId),
      ASSETRECID: toNum(data.assetRecId),
      ASSETSPECIFICATION: data.assetSpecification ?? "",
      MANUFACTUREYEAR: toNum(data.manufactureYear),
      VB_ASSETCONDITION: toNum(data.vb_AssetCondition),
      VB_ASSETCOLOR: toNum(data.vb_AssetColor),
      ITEMCODE: data.itemCode ?? "",
      BARCODE: data.barcode ?? "",
      SKUCODE: data.skuCode ?? "",
      ASSETPRICE: toNum(data.assetPrice),
      ASSETQUANTITY: toNum(data.assetQuantity),
      VB_UNITOFMEASURE: toNum(data.vb_Unitofmeasure),
      VB_ASSETDELIVERYLOCATION: toNum(data.vb_AssetDeliveryLocation),
      VB_FULLFILMENTCITY: toNum(data.vb_FullfilmentCity),
      VB_COUNTRYMANUFACTURE: toNum(data.vb_CountryManufacture),
      VB_ASSETMINORCOLOR: toNum(data.vb_AssetMinorColor),
      NOOFPASSENGERS: toNum(data.noOfPassengers),
      CAPACITY: toNum(data.capacity),
      WEIGHT: toNum(data.weight),
      NUMBEROFCYLINDER: toNum(data.numberOfCylinder),
      OTHDESC1: data.othDesc1 ?? "",
      OTHDESC2: data.othDesc2 ?? "",
      OTHDESC3: data.othDesc3 ?? "",
      OTHDESC4: data.othDesc4 ?? "",
      RECSTATUS: true,
      UPDATEBY: "system",
      UPDATEDATE: new Date().toISOString(),
      CHECKER: data.Checker ?? null,
      CHECKDATE: data.Checkdate ?? null,
      MAKER: data.Maker ?? "system",
      MAKEDATE: data.Makedate ?? new Date().toISOString(),
    };

    try {
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      if (selectedRecord) {
        await axios.put(
          `${baseUrl}/api/AssetDetail/${selectedRecord.TADRECID}`,
          payload,
        );
        toast.success("Record Updated", {
          description: "The asset details have been successfully updated.",
          className: "bg-green-500 text-white border-green-600",
        });
      } else {
        const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
        await axios.post(
          `${baseUrl}/api/AssetDetail`,
          payload,
        );
        toast.success("Record Added", {
          description: "A new asset record has been successfully created.",
          className: "bg-green-500 text-white border-green-600",
        });
      }

      await fetchRecords();
      setEditModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Operation Failed", {
        description: "There was an error saving the record. Please try again.",
        className: "bg-red-500 text-white border-red-600",
      });
    }
  };

  const handleDelete = async (row: AssetRow) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      await axios.delete(
        `${baseUrl}/api/AssetDetail/?Tadrecid=${row.TADRECID}&Appid=${currentAppId}&Updateby=${user?.UserId || "system"}`
      );
      toast.success("Record Deleted", {
        description: "The asset record has been successfully removed.",
        className: "bg-green-500 text-white border-green-600",
      });
      setEditModalOpen(false);
      setSelectedRecord(null);
      await fetchRecords();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Delete Failed", {
        description: "Could not delete the record. Please try again.",
        className: "bg-red-500 text-white border-red-600",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 hover:shadow-md"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-200 transition-colors duration-200" />
          </button>
          <h1 className="text-3xl font-bold">Assets</h1>
        </div>

        <Button
          onClick={() => {
            setSelectedRecord(null);
            setEditModalOpen(true);
          }}
        >
          Add New Record
        </Button>
      </div>

      <ReusableDataTable<AssetRow>
        initialData={records}
        columns={columns}
        loading={loading}
        onSelectionChange={setSelectedRows}
        keyMappings={keyMappings}
        onUpdate={async (row) => {
          setSelectedRecord(row);
          setEditModalOpen(true);
        }}
        onDelete={handleDelete}
        pageSizeOptions={[5, 10, 20]}
      />
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        data={selectedRecord}
        fields={fields}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
