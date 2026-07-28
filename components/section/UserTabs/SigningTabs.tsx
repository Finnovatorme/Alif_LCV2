"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EditModal } from "@/components/ui/editmodal";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

type Row = Record<string, any>;
const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
const language = 1;

// ✅ get APPID dynamically
function getAppIdFromUrlOrLS() {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  return (
    url.searchParams.get("APPID") ||
    url.searchParams.get("appId") ||
    url.searchParams.get("appid") ||
    localStorage.getItem("APPID") ||
    localStorage.getItem("selectedAppId") ||
    localStorage.getItem("appId") ||
    localStorage.getItem("appid") ||
    ""
  );
}

// ✅ FIX: never return [null]
function extractRows(res: any): any[] {
  // axios response -> data is the only thing we care about
  const d = res?.data;

  // API returned null / undefined (like your screenshot)
  if (d === null || d === undefined) return [];

  // sometimes backend returns "null" as text/plain
  if (typeof d === "string") {
    const trimmed = d.trim().toLowerCase();
    if (trimmed === "null" || trimmed === "") return [];
    try {
      const parsed = JSON.parse(d);
      if (parsed === null || parsed === undefined) return [];
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (typeof parsed === "object") return [parsed];
      return [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(d)) return d.filter(Boolean);

  if (Array.isArray(d?.data)) return d.data.filter(Boolean);
  if (Array.isArray(d?.DATA)) return d.DATA.filter(Boolean);
  if (Array.isArray(d?.result)) return d.result.filter(Boolean);

  if (typeof d === "object") return [d];

  return [];
}

function isActive(v: any) {
  return v === true || v === 1 || v === "1";
}

export default function SigningTabs() {
  const [records, setRecords] = useState<Row[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Row | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const appId = useMemo(() => getAppIdFromUrlOrLS(), []);

  // ✅ Fetch
  const fetchRecords = async () => {
    if (!appId) {
      setRecords([]);
      toast.error("APPID not found in URL / localStorage");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/GetApplPromissorynotes?APPID=${appId}&Language=${language}`,
      );

      const raw = extractRows(res);

      // ✅ map ONLY valid object rows, prevent "null row"
      const safe = raw.filter((x) => x && typeof x === "object");
      console.log("safe", safe);
      const mapped = safe.map((item: any, idx: number) => ({
        ...item,
        id:
          item.id ??
          item.RECORDID ??
          item.RecordId ??
          item.RECID ??
          item.REC_ID ??
          idx + 1,

        // normalize columns (try multiple possible keys)
        RECORDID:
          item.RECORDID ??
          item.RecordId ??
          item.RECID ??
          item.REC_ID ??
          item.PNRECID ??
          "",

        CITYOFISSUANCE:
          item.CITYOFISSUANCE ??
          item.CityOfIssuance ??
          item.CITY_OF_ISSUANCE ??
          "",

        COUNTRYOFPAYMENT:
          item.COUNTRYOFPAYMENT ??
          item.CountryOfPayment ??
          item.COUNTRY_OF_PAYMENT ??
          "",

        CITYOFPAYMENT:
          item.CITYOFPAYMENT ??
          item.CityOfPayment ??
          item.CITY_OF_PAYMENT ??
          "",

        PROMISSORYNOTETYPE:
          item.PROMISSORYNOTETYPE ??
          item.PromissoryNoteType ??
          item.PROMISSORY_NOTE_TYPE ??
          "",

        REFERENCENUMBER:
          item.REFERENCENUMBER ??
          item.ReferenceNumber ??
          item.REFERENCE_NUMBER ??
          "",

        RECSTATUS: item.RECSTATUS ?? item.recstatus ?? true,
      }));

      setRecords(mapped);

      if (mapped.length > 0) toast.success("Data fetched successfully");
      else toast.info("No data found");
    } catch (e) {
      console.error("API Error:", e);
      setRecords([]);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ columns as you requested (with one extra action column already in datatable)
  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      { accessorKey: "RECORDID", header: "Record ID" },
      { accessorKey: "CITYOFISSUANCE", header: "City Of Issuance" },
      { accessorKey: "COUNTRYOFPAYMENT", header: "Country Of Payment" },
      { accessorKey: "CITYOFPAYMENT", header: "City Of Payment" },
      { accessorKey: "PROMISSORYNOTETYPE", header: "Promissory Note Type" },
      { accessorKey: "REFERENCENUMBER", header: "Reference Number" },

      {
        accessorKey: "RECSTATUS",
        header: "Record Status",
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
        ),
      },
    ],
    [],
  );

  // ✅ keep it simple: show all fields in modal if you want (or customize)
  const fields: any[] = [
    { name: "RECORDID", label: "Record ID", type: "input", readOnly: true },
    { name: "CITYOFISSUANCE", label: "City Of Issuance", type: "input" },
    { name: "COUNTRYOFPAYMENT", label: "Country Of Payment", type: "input" },
    { name: "CITYOFPAYMENT", label: "City Of Payment", type: "input" },
    {
      name: "PROMISSORYNOTETYPE",
      label: "Promissory Note Type",
      type: "input",
    },
    { name: "REFERENCENUMBER", label: "Reference Number", type: "input" },
    { name: "RECSTATUS", label: "Record Status", type: "switch" },
  ];

  const keyMappings: Record<string, string> = {
    RECORDID: "Record ID",
    CITYOFISSUANCE: "City Of Issuance",
    COUNTRYOFPAYMENT: "Country Of Payment",
    CITYOFPAYMENT: "City Of Payment",
    PROMISSORYNOTETYPE: "Promissory Note Type",
    REFERENCENUMBER: "Reference Number",
    RECSTATUS: "Record Status",
  };

  // ✅ Submit (placeholder). Replace endpoint/method when you know exact POST/PUT contract.
  const handleFormSubmit = async (data: any) => {
    try {
      // If you don't have POST/PUT yet, just log:
      console.log("SUBMIT:", data);

      // Example (if you have endpoints):
      // if (selectedRecord) await axios.put(`${API_BASE}/api/.../${selectedRecord.RECORDID}`, data)
      // else await axios.post(`${API_BASE}/api/...`, data)

      toast.success("Saved (check console / wire API)");
      setEditModalOpen(false);
      setSelectedRecord(null);
      await fetchRecords();
    } catch (e) {
      console.error("Submit Error:", e);
      toast.error("Failed to submit record");
    }
  };

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-2xl font-bold">Promissory Notes</div>

        {/* ✅ Add button removed (as requested) */}
      </div>

      {/* ✅ prevent overflow */}
      <div className="w-full overflow-x-auto">
        <ReusableDataTable<Row>
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
              // Replace with real delete if exists
              console.log("DELETE:", row);
              toast.success("Deleted (wire API)");
              setEditModalOpen(false);
              setSelectedRecord(null);
              await fetchRecords();
            } catch (e) {
              console.error("Delete Error:", e);
              toast.error("Failed to delete record");
            }
          }}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>

      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        data={selectedRecord}
        fields={fields}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
