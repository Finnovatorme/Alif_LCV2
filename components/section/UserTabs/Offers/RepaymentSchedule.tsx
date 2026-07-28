"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "@/utils/axios";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EditModal } from "@/components/ui/editmodal";
import { AnyFieldConfig as FieldConfig } from "@/types/field.types";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { useSelector } from "react-redux";
import { languageParams, dashboardParams } from "@/lib/redux/slices/dashboardApplSlice";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

export type ApiRepaymentSchedule = {
  TRSRECID: number;
  SCHDUEDATE?: string;
  SCHAMOUNT?: number;
  RECSTATUS?: boolean;
  [key: string]: any;
};

interface RepaymentScheduleRow extends ApiRepaymentSchedule {
  id: number;
}

export default function RepaymentSchedule() {
  const router = useRouter();
  const language = useSelector(languageParams);
  const appParams = useSelector(dashboardParams);

  const [records, setRecords] = useState<RepaymentScheduleRow[]>([]);
  const [selectedRecord, setSelectedRecord] =
    useState<RepaymentScheduleRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<RepaymentScheduleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async (): Promise<void> => {
    if (!appParams?.APPID) return;
    try {
      setLoading(true);

      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const response = await axios.get(
        `${baseUrl}/api/ApplRepaySch?APPID=${appParams.APPID}&Language=${language}`,
      );

      const data: ApiRepaymentSchedule[] = Array.isArray(response.data)
        ? response.data
        : [];

      const mapped: RepaymentScheduleRow[] = data.map((item) => ({
        ...item,
        id: Number(item.TRSRECID),
        RECSTATUS: Boolean(item.RECSTATUS),
      }));

      setRecords(mapped);

      mapped.length
        ? toast.success("Repayment Schedule data fetched successfully")
        : toast.info("No data found");
    } catch (error) {
      console.error("Fetch Error:", error);
      setRecords([]);
      toast.error("Failed to fetch Repayment Schedule data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [appParams?.APPID, language]);

  /* ---------------- columns (compact) ---------------- */
  const columns: ColumnDef<RepaymentScheduleRow>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      { accessorKey: "INSTALMENTNUMBER", header: "Installment Number" },

      {
        accessorKey: "INSTALLMENTDATE",
        header: "Installment  Date",
        cell: ({ row }: CellContext<RepaymentScheduleRow, unknown>) => {
          const v = row.original.INSTALLMENTDATE;
          return v ? String(v).slice(0, 10) : "-";
        },
      },

      { accessorKey: "INSTALMENTAMOUNT", header: "Installment Amount" },
      { accessorKey: "PROFITAMOUNT", header: "Profit Amount" },
      { accessorKey: "PRINCIPALAMOUNT", header: "Principal Amount" },
      { accessorKey: "FORECLOSEAMOUNT", header: "Foreclose Amount" },

      {
        accessorKey: "RECSTATUS",
        header: "Status",
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
        ),
      },
    ],
    [],
  );

  const fields: FieldConfig[] = [
    {
      type: "section",
      title: "Repayment Schedule",
      fields: [
        {
          name: "INSTALLMENTNUMBER",
          label: "Installment Number",
          type: "number",
          required: true,
        },
        {
          name: "INSTALLMENTDATE",
          label: "Installment Date",
          type: "date",
          required: true,
        },
        {
          name: "INSTALLMENTAMOUNT",
          label: "Installment Amount",
          type: "number",
        },
        {
          name: "PROFITAMOUNT",
          label: "Profit Amount",
          type: "number",
        },
        {
          name: "PRINCIPALAMOUNT",
          label: "Principal Amount",
          type: "number",
        },
        {
          name: "FORECLOSEAMOUNT",
          label: "Foreclose Amount",
          type: "number",
        },
        {
          name: "RECSTATUS",
          label: "Record Status",
          type: "switch",
        },
      ],
    },
  ];

  const keyMappings = {
    TARSRECID: "TARS RED ID",
    FINANCIERID: "Financier ID",
    APPID: "APP ID",
    TRANUID: "TRAN UID",
    TADRECID: "TADRECID",
    INSTALMENTNUMBER: "Installment Number",
    INSTALLMENTDATE: "Installment Date",
    INSTALLMENTDATEHIJRI: "Installment Date (H)",
    INSTALMENTAMOUNT: "Installment Amount",
    PRINCIPALAMOUNT: "Principal Amount",
    PROFITAMOUNT: "Profit Amount",
    ASSETINSURANCEAMOUNT: "Asset Insurance Amount",
    LIFEINSURANCEAMOUNT: "Life Insurance Amount",
    TAXAMOUNT: "Tax Amount",
    CAPITALIZEDCHARGEAMOUNT: "Capitalized Charge Amount",
    AMORTIZEDCHARGEAMOUNT: "Amortized Charge Amount",
    OTHERCHARGEAMOUNT: "Other Charge Amount",
    AMORTCHARGEFORREVENUERECOG: "Amortized Charge For Revenue Recognition",
    IRR: "Internal Rate Of Return",
    BEGINNINGOS: "Beginning Outstanding",
    CLOSINGOS: "Closing Outstanding",
    BEGINNINGPRINCIPAL: "Beginning Principal",
    CLOSINGPRINCIPAL: "Closing Principal",
    BEGINNINGPROFIT: "Beginning Profit",
    CLOSINGPROFIT: "Closing Profit",
    BEGINNINGINSURANCE: "Beginning Insurance",
    CLOSINGINSURANCE: "Closing Insurance",
    FORECLOSEAMOUNT: "Foreclose Amount",
    MORATORIUMAMOUNT: "Moratorium Amount",
    MORATORIUMPRINCIPAL: "Moratorium Principal",
    MORATORIUMPROFIT: "Moratorium Profit",
    OTHERAMOUNT1: "Other Amount 1",
    OTHERAMOUNT2: "Other Amount 2",
    OTHERAMOUNT3: "Other Amount 3",
    UPDATEBY: "Update by",
    UPDATEDATE: "Update Date",
    RECSTATUS: "Record Status",
  };

  const handleFormSubmit = async (data: any): Promise<void> => {
    const payload = {
      INSTALLMENTNUMBER: data.INSTALLMENTNUMBER ?? 0,
      INSTALLMENTDATE: data.INSTALLMENTDATE ?? "",
      INSTALLMENTAMOUNT: data.INSTALLMENTAMOUNT ?? 0,
      PROFITAMOUNT: data.PROFITAMOUNT ?? 0,
      PRINCIPALAMOUNT: data.PRINCIPALAMOUNT ?? 0,
      FORECLOSEAMOUNT: data.FORECLOSEAMOUNT ?? 0,
      RECSTATUS: data.RECSTATUS ?? true,
      Updateby: "system",
      Updatedate: new Date().toISOString(),
    };

    try {
      if (selectedRecord) {
        await axios.put(
          `${process.env.LO_API_KEY}/api/ApplRepaySch`,
          payload,
        );
        toast.success("Record Updated Successfully");
      } else {
        await axios.post(
          `${process.env.LO_API_KEY}/api/ApplRepaySch`,
          payload,
        );
        toast.success("Record Added Successfully");
      }

      await fetchRecords();
      setEditModalOpen(false);
      setSelectedRecord(null);
      return;
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Operation Failed");
      return;
    }
  };

  const handleDelete = async (row: RepaymentScheduleRow): Promise<void> => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      await axios.delete(
        `${process.env.LO_API_KEY}/api/ApplRepaySch/${row.TRSRECID}`,
      );

      toast.success("Record Deleted Successfully");

      await fetchRecords();
      return;
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Delete Failed");
      return;
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-3xl font-bold">Repayment Schedule</h1>
        </div>

        {/* <Button
          onClick={() => {
            setSelectedRecord(null);
            setEditModalOpen(true);
          }}
        >
          Add New Record
        </Button> */}
      </div>

      <ReusableDataTable<RepaymentScheduleRow>
        initialData={records}
        columns={columns}
        loading={loading}
        onSelectionChange={setSelectedRows}
        keyMappings={keyMappings}

        onDelete={handleDelete}
        pageSizeOptions={[5, 10, 20]}
      />


    </>
  );
}
