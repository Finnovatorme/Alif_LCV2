"use client";
import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EditModal } from "@/components/ui/editmodal";
import type { FieldConfig } from "@/types/field.types";

interface DueDay {
  id: number;
  SAPRECID?: string;
  SUPPLIERRECID?: number;
  SUPPLIERFULLNAME?: string;
  ASSETRECID?: number;
  ASSETNAME?: string;
  ASSETPIC1?: string;
  RECSTATUS?: boolean;
}

export default function SchemeDueDayPage() {
  const { t } = useTranslation("SchemeDueDay");
  const [records, setRecords] = useState<DueDay[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DueDay | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<DueDay[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.BS_API_KEY}/api/AssetFinMasterSupplierAssetPics/GetAssetFinMasterSupplierAssetPics`,
      );

      setRecords(
        response.data.map((item: DueDay, index: number) => ({
          ...item,
          id: index + 1,
        })),
      );

      if (response.data.length > 0) {
        toast.success("Data has been fetched");
      } else {
        toast.info("No data found");
      }
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
  }, []);

  useEffect(() => {
    console.log(records);
  }, [records]);

  const columns: ColumnDef<DueDay>[] = [
    { id: "select", header: "selct" },
    { id: "actions", header: "Actions" },
    { accessorKey: "SAPRECID", header: "SAP Rec Id" },

    {
      accessorKey: "ASSETPIC1",
      header: "Asset Pic 1",
      cell: ({ row }) => {
        const base64 = row.original.ASSETPIC1;
        const src = base64
          ? base64.startsWith("data:image")
            ? base64
            : `data:image/jpeg;base64,${base64}`
          : null;

        if (!src) return <span>No Image</span>;
        return (
          <img
            src={src}
            alt="Asset Pic 1"
            className="w-20 h-20 object-cover rounded"
          />
        );
      },
    },
    {
      accessorKey: "RECSTATUS",
      header: "Rec Status",
      cell: ({ row }) => {
        const value = row.original.RECSTATUS;
        return (
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              value
                ? "bg-green-500 text-white border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
          >
            {value ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];

  const formFields: FieldConfig[] = [
    {
      name: "SUPPLIERRECID",
      label: "Supplier ID",
      type: "number",
      required: true,
    },
    {
      name: "SUPPLIERFULLNAME",
      label: "Supplier Name",
      type: "text",
      required: true,
    },
    {
      name: "ASSETRECID",
      label: "Asset ID",
      type: "number",
      required: true,
    },
    {
      name: "ASSETNAME",
      label: "Asset Name",
      type: "text",
      required: true,
    },
    {
      name: "ASSETPIC1",
      label: "Asset Picture (Base64)",
      type: "textarea",
      required: true,
    },
    {
      name: "RECSTATUS",
      label: "Status",
      type: "checkbox",
    },
  ];

  const keyMappings = {
    SAPRECID: "SAP Rec Id",
    SUPPLIERRECID: "Supplier ID",
    SUPPLIERFULLNAME: "Supplier Name",
    ASSETRECID: "Asset ID",
    ASSETNAME: "Asset Name",
    ASSETPIC1: "Asset Picture",
    RECSTATUS: "Record Status",
    OTHDESC1: "Description in English",
    OTHDESC2: "Description in Arabic",
    OTHDESC3: "Description in Other Language",
    MAKER: "Maker ",
    MAKEDATE: "Make date",
    UPDATEBY: "Update by",
    UPDATEDATE: "Update date",
  };

  const handleFormSubmit = async (data: any) => {
    const payload = {
      SUPPLIERRECID: Number(data.SUPPLIERRECID),
      SUPPLIERFULLNAME: data.SUPPLIERFULLNAME,
      ASSETRECID: Number(data.ASSETRECID),
      ASSETNAME: data.ASSETNAME,
      ASSETPIC1: data.ASSETPIC1,
      ASSETPIC3FORMAT: "jpeg",
      ASSETPIC3FORMATDETAILS: "data:image/jpeg;base64,",
      RECSTATUS: data.RECSTATUS ?? true,
    };

    try {
      if (selectedRecord?.SAPRECID) {
        await axios.put(
          `/api/AssetFinMasterSupplierAssetPics/${selectedRecord.SAPRECID}`,
          payload,
        );

        toast.success("Record updated successfully");
      } else {
        await axios.post(`/api/AssetFinMasterSupplierAssetPics`, payload);

        toast.success("Record added successfully");
      }

      setEditModalOpen(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Failed to save record");
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="
    flex items-center justify-center w-10 h-10 rounded-full
    bg-gray-100 dark:bg-gray-800
    cursor-pointer
    transition-all duration-200 ease-in-out

    hover:bg-gray-200 dark:hover:bg-gray-700
    hover:scale-105
    hover:shadow-md
  "
          >
            <ArrowLeftIcon
              className="
      w-5 h-5
      text-gray-700 dark:text-gray-200
      transition-colors duration-200
    "
            />
          </button>

          <h1 className="text-3xl font-bold"> Due Day</h1>
        </div>
        <Button
          onClick={() => {
            setSelectedRecord(null);
            setEditModalOpen(true);
          }}
        >
          Add Record
        </Button>
      </div>

      <>
        <ReusableDataTable<DueDay>
          initialData={records}
          columns={columns}
          loading={loading}
          onSelectionChange={setSelectedRows}
          keyMappings={keyMappings}
          onUpdate={async (row) => {
            setSelectedRecord(row);
            setEditModalOpen(true);
          }}
          // onDelete={async (row) => {
          //   try {
          //     await axios.delete(`/api/CnfgSchmeDueDay/${row.RECID}`);

          //     toast.success("Record deleted successfully");
          //     setEditModalOpen(false);
          //     setSelectedRecord(null);
          //     fetchRecords();
          //   } catch (error) {
          //     console.error("Delete Error:", error);
          //     toast.error("Failed to delete record");
          //   }
          // }}
          pageSizeOptions={[5, 10, 20]}
        />
        <EditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
          }}
          data={selectedRecord}
          fields={formFields}
          onSubmit={handleFormSubmit}
        />
      </>
    </>
  );
}
