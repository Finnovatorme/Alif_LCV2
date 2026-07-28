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

import { vbValue, fetchAppCifOptions, Option } from "@/utils/dropDownApis";

const normalizeOptions = (raw: any): Option[] => {
  const arr = Array.isArray(raw) ? raw : (raw?.data ?? raw?.DATA ?? []);
  if (!Array.isArray(arr)) return [];
  return arr
    .map((o: any) => {
      const value = o?.VBVALUE ?? o?.VALUE ?? o?.ID ?? o?.id ?? o?.value;
      const label =
        o?.VBVALUEDESC ??
        o?.VALUEDESC ??
        o?.NAME ??
        o?.name ??
        o?.label ??
        String(value ?? "");
      if (value === null || value === undefined) return null;
      return { value: String(value), label: String(label) };
    })
    .filter(Boolean) as Option[];
};

export type ApiLoanFunding = {
  TDFRECID: number;
  Vb_BankcodeFrom?: string;
  Vb_BankcodeTo?: string;
  Iban?: string;
  RECSTATUS?: boolean;
  [key: string]: any;
};

interface LoanFundingRow extends ApiLoanFunding {
  id: number;
}

export default function LoanFundingTabs() {
  const router = useRouter();
  const language = useSelector(languageParams);
  const appParams = useSelector(dashboardParams);

  const [records, setRecords] = useState<LoanFundingRow[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<LoanFundingRow | null>(
    null,
  );
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<LoanFundingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});
  const [ddLoading, setDdLoading] = useState(false);
  const ddFetched = React.useRef(false);

  useEffect(() => {
    if (ddFetched.current) return;
    ddFetched.current = true;

    (async () => {
      setDdLoading(true);
      try {
        const categories = ["FUNDINGTYPE", "AMOUNTDISBURSEMENTSTATUS", "BANKCODE"];
        
        const pairs = await Promise.all(
          categories.map(async (cat) => {
            const raw = await vbValue(cat);
            return [cat, normalizeOptions(raw)] as const;
          }),
        );
        const merged: Record<string, Option[]> = {};
        pairs.forEach(([k, v]) => (merged[k] = v));

        const appCifOptions = await fetchAppCifOptions();
        merged["APPCIFID"] = appCifOptions;

        setDdValues(merged);
      } catch (e) {
        console.error("dropdown fetch failed", e);
      } finally {
        setDdLoading(false);
      }
    })();
  }, []);

  const fetchRecords = async (): Promise<void> => {
    if (!appParams?.APPID) return;
    try {
      setLoading(true);

      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const response = await axios.get(
        `${baseUrl}/api/DisbursmentFunding?APPID=${appParams.APPID}&Language=${language}`,
      );

      const data: ApiLoanFunding[] = Array.isArray(response.data)
        ? response.data
        : [];

      const mapped: LoanFundingRow[] = data.map((item) => ({
        ...item,
        id: Number(item.TDFRECID),
        RECSTATUS: Boolean(item.RECSTATUS),
      }));

      setRecords(mapped);

      mapped.length
        ? toast.success("Loan Funding data fetched successfully")
        : toast.info("No data found");
    } catch (error) {
      console.error("Fetch Error:", error);
      setRecords([]);
      toast.error("Failed to fetch Loan Funding data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [appParams?.APPID, language]);

  const columns: ColumnDef<LoanFundingRow>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      { accessorKey: "TDFRECID", header: "Funding Rec ID" },
      { accessorKey: "BANKCODE_FROM", header: "Bank Code From" },
      { accessorKey: "BANKCODE_TO", header: "Bank Code To" },
      { accessorKey: "IBAN", header: "IBAN" },

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
      title: "Loan Funding Details",
      fields: [
        {
          type: "select",
          name: "Appcifid",
          label: "App CIF ID",
          error: "",
          required: true,
          options: ddValues?.APPCIFID || [],
        },
        {
          type: "select",
          name: "BANKCODE_FROM",
          label: "Bank Code From",
          error: "",
          required: true,
          options: ddValues?.BANKCODE || [],
        },
        {
          type: "select",
          name: "Tcfbrecid_From",
          label: "Finance Bank Accounts",
          error: "",
          required: false,
          options: [],
        },
        {
          type: "select",
          name: "BANKCODE_TO",
          label: "Bank Code To",
          error: "",
          required: true,
          options: ddValues?.BANKCODE || [],
        },
        {
          type: "text",
          name: "IBAN",
          label: "IBAN",
          error: "",
          required: true,
          max: 24,
        },
        {
          type: "number",
          name: "Netamount",
          label: "Netamount",
          error: "",
          required: true,
        },
        {
          type: "date",
          name: "Loanbookdate",
          label: "Loan Book Date",
          error: "",
          required: false,
        },
        {
          type: "number",
          name: "Transferinterval",
          label: "Transfer Interval",
          error: "",
          required: false,
        },
        {
          type: "select",
          name: "Vb_Fundingtype",
          label: "Funding Type",
          error: "",
          required: true,
          options: ddValues?.FUNDINGTYPE || [],
        },
        {
          type: "number",
          name: "Processid_Funding",
          label: "Processid Funding",
          error: "",
          required: false,
        },
        {
          type: "switch",
          name: "Amounttransferred",
          label: "Amount Transferred",
          error: "",
          required: false,
        },
        {
          type: "select",
          name: "Vb_Amountdisbursementstatus",
          label: "Amount disbursement status",
          error: "",
          required: false,
          options: ddValues?.AMOUNTDISBURSEMENTSTATUS || [],
        },
        {
          type: "date",
          name: "Transferdate",
          label: "Transfer Date",
          error: "",
          required: false,
        },
        {
          type: "text",
          name: "Transferreference",
          label: "Transfer Reference",
          error: "",
          required: false,
        },
      ] as any[],
    },
  ];

  const keyMappings = {
    TDFRECID: "TDFRECID",
    BANKCODE_FROM: "Bank Code From",
    BANKCODE_TO: "Bank Code To",
    IBAN: "IBAN",
    RECSTATUS: "Status",
  };

  const handleFormSubmit = async (data: any): Promise<void> => {
    const authData = localStorage.getItem("authData");
    const auth = authData ? JSON.parse(authData) : {};
    const makerName = auth?.user?.username || "aadnan";

    const payload: any = {
      APPID: Number(appParams?.APPID || 0),
      Appcifid: Number(data.Appcifid || 0),
      Vb_BankcodeFrom: Number(data.BANKCODE_FROM || 0),
      Tcfbrecid_From: Number(data.Tcfbrecid_From || 0),
      Vb_BankcodeTo: Number(data.BANKCODE_TO || 0),
      Iban: data.IBAN || "",
      Netamount: Number(data.Netamount || 0),
      Loanbookdate: data.Loanbookdate ? new Date(data.Loanbookdate).toISOString() : new Date().toISOString(),
      Transferinterval: Number(data.Transferinterval || 0),
      Vb_Fundingtype: Number(data.Vb_Fundingtype || 0),
      Processid_Funding: Number(data.Processid_Funding || 0),
      Amounttransferred: Boolean(data.Amounttransferred),
      Vb_Amountdisbursementstatus: Number(data.Vb_Amountdisbursementstatus || 0),
      Transferdate: data.Transferdate ? new Date(data.Transferdate).toISOString() : new Date().toISOString(),
      Transferreference: data.Transferreference || "",
      RECSTATUS: true,
      Maker: makerName,
      Makedate: new Date().toISOString(),
      Updateby: makerName,
      Updatedate: new Date().toISOString(),
    };

    try {
      if (selectedRecord) {
        payload.TDFRECID = Number(selectedRecord.TDFRECID);
        await axios.put(
          `${process.env.LO_API_KEY}/api/DisbursmentFunding/${selectedRecord.TDFRECID}`,
          payload,
        );
        toast.success("Record Updated Successfully", {
          className: "bg-green-500 text-white",
        });
      } else {
        await axios.post(
          `${process.env.LO_API_KEY}/api/DisbursmentFunding`,
          payload,
        );
        toast.success("Record Added Successfully", {
          className: "bg-green-500 text-white",
        });
      }

      await fetchRecords();
      setEditModalOpen(false);
      setSelectedRecord(null);
      return;
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Operation Failed", {
        className: "bg-red-500 text-white",
      });
      return;
    }
  };

  const handleDelete = async (row: LoanFundingRow): Promise<void> => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const authData = localStorage.getItem("authData");
      const auth = authData ? JSON.parse(authData) : {};
      const updateBy = auth?.user?.username || "aadnan";

      const url = `${process.env.LO_API_KEY}/api/DisbursmentFunding?TDFRECID=${row.TDFRECID}&UPDATEBY=${encodeURIComponent(updateBy)}`;
      
      await axios.delete(url);
      toast.success("Record Deleted Successfully", {
        className: "bg-green-500 text-white",
      });

      await fetchRecords();
      return;
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Delete Failed", {
        className: "bg-red-500 text-white",
      });
      return;
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
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-3xl font-bold">Loan Funding</h1>
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

      <ReusableDataTable<LoanFundingRow>
        initialData={records}
        columns={columns}
        loading={loading}
        onSelectionChange={setSelectedRows}
        keyMappings={keyMappings}
        onUpdate={(row: LoanFundingRow) => {
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
        fields={fields as any}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
