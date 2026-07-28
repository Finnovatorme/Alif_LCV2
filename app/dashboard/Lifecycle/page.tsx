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
import { FieldConfig } from "@/types/field.types";

interface SchemeDueDay {
  id: number;
  schemeId: number;
  schemeName: string;
  ruleId: number | null;
  ruleName: string | null;
  dueDayCode: string;
  dueDay: string;
  cutoffDays: number;
  RECID: number;
  DUEDAY: number;
  DUEDAYCUTOFFDAYS: number;
  Othdesc1: string;
  Othdesc2: string;
  Othdesc3: string;
  RECSTATUS?: boolean;
  SCHEMENAME?: string;
}

export default function SchemeDueDayPage() {
  const { t } = useTranslation("SchemeDueDay");
  const [records, setRecords] = useState<SchemeDueDay[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SchemeDueDay | null>(
    null,
  );
  const [editModalOpen, setEditModalOpen] = useState(false);
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<SchemeDueDay[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.BS_API_KEY}/api/CnfgMasterEmployers/GetCnfgMasterEmployer`,
      );

      setRecords(
        response.data.map((item: SchemeDueDay, index: number) => ({
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

  const columns: ColumnDef<SchemeDueDay>[] = [
    { id: "select", header: "selct" },
    { id: "actions", header: "Actions" },
    { accessorKey: "Employername1", header: "Employer Name" },
    { accessorKey: "VbCompanytype", header: "Company Type" },
    { accessorKey: "VbSalaryday", header: "Salary Day" },
    { accessorKey: "Contactperson", header: "Contact person" },
    { accessorKey: "Contactno", header: "Contact No" },
    {
      accessorKey: "RECSTATUS",
      header: "Rec Status",
      cell: ({ row }) => {
        const value = row.original.RECSTATUS;

        return (
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full 
          ${
            value
              ? "bg-green-500 text-white border border-green-300"
              : "bg-red-500 text-white border border-red-300"
          }
        `}
          >
            {value ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];

  const fields: FieldConfig[] = [
    {
      name: "username",
      label: "Username",
      type: "input",
    },
    { name: "password", label: "Password", type: "password" },
    { name: "age", label: "Age", type: "number" },
    { name: "price", label: "Price", type: "number" },
    { name: "bio", label: "Bio", type: "textarea" },

    {
      name: "gender",
      label: "Gender",
      type: "radio",
      options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ],
    },

    {
      name: "department",
      label: "Department",
      type: "select",
      placeholder: "Please select",
      options: [
        { label: "Engineering", value: "eng" },
        { label: "Design", value: "design" },
      ],
    },

    { name: "dob1", label: "Date of Birth", type: "calender" },
    { name: "agree", label: "Agree to terms", type: "checkbox" },
    { name: "isActive", label: "Active", type: "switch" },
    { name: "dob", label: "Date of Birth", type: "date" },
  ];

  const keyMappings = {
    RECID: "Rule Id",
    SCHEMENAME: "Scheme Name",
    DUEDAY: "DUEDAY_VBCODE",
    DUEDAYCUTOFFDAYS: "Cutoff Days",
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
      RECID: data.RECID,
      DUEDAY: data.DUEDAY,
      DUEDAYCUTOFFDAYS: data.DUEDAYCUTOFFDAYS,
      Othdesc1: data.Othdesc1,
      Othdesc2: data.Othdesc2,
      Othdesc3: data.Othdesc3,
      Recstatus: data.Recstatus,
      Updateby: data.Updateby,
      Updatedate: data.Updatedate,
      Checker: data.Checker,
      Checkdate: data.Checkdate,
      Maker: data.Maker,
      Makedate: data.Makedate,
    };

    try {
      if (selectedRecord) {
        await axios.put(
          `${process.env.LO_API_KEY}/api/CnfgSchmeDueDay/${selectedRecord.RECID}`,
          payload,
        );
      } else {
        await axios.post(
          `${process.env.LO_API_KEY}/api/CnfgSchmeDueDay/AddCnfgSchemeDueDay`,
          payload,
        );
      }
      fetchRecords();
    } catch (error) {
      console.error("Submit Error:", error);
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

          <h1 className="text-3xl font-bold">Scheme Due Day</h1>
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

      <div className="">
        <ReusableDataTable<SchemeDueDay>
          initialData={records}
          columns={columns}
          loading={loading}
          onSelectionChange={setSelectedRows}
          keyMappings={keyMappings}
          onUpdate={async (row) => {
            setSelectedRecord(row);
            setEditModalOpen(true);
          }}
          onDelete={async (row) => {
            try {
              await axios.delete(`/api/CnfgSchmeDueDay/${row.RECID}`);

              toast.success("Record deleted successfully");
              setEditModalOpen(false);
              setSelectedRecord(null);
              fetchRecords();
            } catch (error) {
              console.error("Delete Error:", error);
              toast.error("Failed to delete record");
            }
          }}
          pageSizeOptions={[5, 10, 20]}
        />
        <EditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
          }}
          data={selectedRecord}
          fields={fields}
          onSubmit={handleFormSubmit}
        />
      </div>
    </>
  );
}
