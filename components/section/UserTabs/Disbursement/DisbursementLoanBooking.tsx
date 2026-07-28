// "use client";

// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import type { ColumnDef } from "@tanstack/react-table";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import { ArrowLeftIcon } from "lucide-react";
// import { toast } from "sonner";

// import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
// import { Button } from "@/components/ui/button";
// import { EditModal } from "@/components/ui/editmodal";
// import type { FieldConfig } from "@/types/field.types";
// import { vbValue } from "@/utils/dropDownApis";

// type Option = { value: number | string; label: string };

// type Row = Record<string, any>;
// const API_BASE = "https://cftest.finnovatortech.com:8086";

// // ---------- helpers ----------
// function getAppIdFromUrlOrLS() {
//   if (typeof window === "undefined") return "";
//   const url = new URL(window.location.href);
//   return (
//     url.searchParams.get("APPID") ||
//     url.searchParams.get("appId") ||
//     url.searchParams.get("appid") ||
//     localStorage.getItem("APPID") ||
//     localStorage.getItem("appId") ||
//     localStorage.getItem("appid") ||
//     ""
//   );
// }

// function extractRows(res: any): any[] {
//   const d = res?.data;

//   if (d === null || d === undefined) return [];

//   // backend sometimes returns text/plain "null"
//   if (typeof d === "string") {
//     const t = d.trim().toLowerCase();
//     if (t === "null" || t === "") return [];
//     try {
//       const parsed = JSON.parse(d);
//       if (parsed === null || parsed === undefined) return [];
//       if (Array.isArray(parsed)) return parsed.filter(Boolean);
//       if (typeof parsed === "object") return [parsed];
//       return [];
//     } catch {
//       return [];
//     }
//   }

//   if (Array.isArray(d)) return d.filter(Boolean);
//   if (Array.isArray(d?.data)) return d.data.filter(Boolean);
//   if (Array.isArray(d?.DATA)) return d.DATA.filter(Boolean);
//   if (Array.isArray(d?.result)) return d.result.filter(Boolean);

//   if (typeof d === "object") return [d];
//   return [];
// }

// function toNum(v: any, fallback = 0) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : fallback;
// }

// function toStr(v: any, fallback = "") {
//   return v === null || v === undefined ? fallback : String(v);
// }

// function toIsoDate(ymd: any) {
//   const s = toStr(ymd).trim();
//   if (!s) return null;
//   if (s.includes("T")) return s;
//   if (s.length === 10) return `${s}T00:00:00`;
//   return s;
// }

// function toDisplayDate(v: any) {
//   if (!v) return "";
//   if (typeof v === "string" && v.includes("T")) return v.slice(0, 10);
//   return String(v);
// }

// function isActive(v: any) {
//   return v === true || v === 1 || v === "1";
// }

// // ---------- types ----------
// type ApiDisbursmentLoanBooking = {
//   TDBRECID?: number | string;
//   Tdbrecid?: number | string;

//   APPID?: number | string;
//   APPCIFID?: number | string;
//   Appcifid?: number | string;

//   LOANBOOKED?: boolean | number | string;
//   Loanbooked?: boolean | number | string;

//   LOANREFERENCENUMBER?: string;
//   Loanreferencenumber?: string;

//   LOANBOOKDATE?: string;
//   Loanbookdate?: string;

//   MAKER?: string;
//   Makedate?: string;
//   UPDATEBY?: string;
//   Updatedate?: string;

//   RECSTATUS?: boolean | number | string;
//   Recstatus?: boolean | number | string;

//   [key: string]: any;
// };

// interface DisbursmentLoanBookingRow extends ApiDisbursmentLoanBooking {
//   id: number;

//   TDBRECID_VIEW: string;
//   LOANBOOKED_VIEW: boolean;
//   LOANREFERENCENUMBER_VIEW: string;
//   LOANBOOKDATE_VIEW: string;
//   RECSTATUS_VIEW: boolean;
// }

// // ---------- component ----------
// export default function DisbursementLoanBooking() {
//   const router = useRouter();

//   const [records, setRecords] = useState<DisbursmentLoanBookingRow[]>([]);
//   const [selectedRecord, setSelectedRecord] =
//     useState<DisbursmentLoanBookingRow | null>(null);
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [selectedRows, setSelectedRows] = useState<DisbursmentLoanBookingRow[]>(
//     [],
//   );
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // dropdowns
//   const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});
//   const hasFetchedDd = useRef(false);

//   useEffect(() => {
//     if (hasFetchedDd.current) return;

//     (async () => {
//       try {
//         const opts = await vbValue("APPCIFID");
//         setDdValues((prev) => ({ ...prev, APPCIFID: (opts as any) ?? [] }));
//       } catch (e) {
//         console.error("APPCIFID dropdown failed", e);
//       } finally {
//         hasFetchedDd.current = true;
//       }
//     })();
//   }, []);

//   const fetchRecords = useCallback(async () => {
//     const appId = getAppIdFromUrlOrLS();
//     if (!appId) {
//       setError("APPID not found in URL or localStorage");
//       setRecords([]);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError("");

//       const res = await axios.get(
//         `${API_BASE}/api/DisbursmentLoanBooking?APPID=${appId}&language=1`,
//       );

//       const data: ApiDisbursmentLoanBooking[] = extractRows(res);

//       const mapped: DisbursmentLoanBookingRow[] = (data || []).map(
//         (item, idx) => {
//           const recId = item.TDBRECID ?? item.Tdbrecid ?? item.RECID ?? item.ID;

//           const loanBooked = item.LOANBOOKED ?? item.Loanbooked ?? false;

//           const loanRef =
//             item.LOANREFERENCENUMBER ??
//             item.Loanreferencenumber ??
//             item.LOANREFERENCENO ??
//             "";

//           const loanBookDate = item.LOANBOOKDATE ?? item.Loanbookdate ?? "";

//           const recStatus = item.RECSTATUS ?? item.Recstatus ?? true;

//           return {
//             ...item,
//             id: toNum(recId, idx + 1),

//             TDBRECID_VIEW: toStr(recId, ""),
//             LOANBOOKED_VIEW: isActive(loanBooked),
//             LOANREFERENCENUMBER_VIEW: toStr(loanRef, ""),
//             LOANBOOKDATE_VIEW: toDisplayDate(loanBookDate),
//             RECSTATUS_VIEW: isActive(recStatus),
//           };
//         },
//       );

//       setRecords(mapped);

//       mapped.length
//         ? toast.success("Data fetched successfully")
//         : toast.info("No data found");
//     } catch (e) {
//       console.error("API Error:", e);
//       setRecords([]);
//       toast.error("Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchRecords();
//   }, [fetchRecords]);

//   // ✅ columns
//   const columns: ColumnDef<DisbursmentLoanBookingRow>[] = useMemo(
//     () => [
//       { id: "select", header: "Select" } as any,
//       { id: "actions", header: "Actions" } as any,

//       { accessorKey: "TDBRECID_VIEW", header: "Loan Booking Rec ID" },

//       {
//         accessorKey: "LOANBOOKED_VIEW",
//         header: "Loan Booked",
//         cell: ({ row }: any) => {
//           const booked = Boolean(row.original?.LOANBOOKED_VIEW);
//           return (
//             <span
//               className="flex flex-row justify-center items-center px-2 py-1 rounded"
//               style={{
//                 color: booked ? "#00c04b" : "#df2c14",
//                 backgroundColor: booked ? "#cefad0" : "#ffc9bb",
//                 borderRadius: 5,
//                 fontWeight: "800",
//                 width: "fit-content",
//               }}
//             >
//               <p className="font-bold text-justify">
//                 {booked ? "Booked" : "Not Booked"}
//               </p>
//             </span>
//           );
//         },
//       },

//       {
//         accessorKey: "LOANREFERENCENUMBER_VIEW",
//         header: "Loan Reference Number",
//       },
//       { accessorKey: "LOANBOOKDATE_VIEW", header: "Loan Bookdate" },

//       {
//         accessorKey: "RECSTATUS_VIEW",
//         header: "Rec Status",
//         cell: ({ row }: any) => {
//           const active = Boolean(row.original?.RECSTATUS_VIEW);
//           return (
//             <span
//               className="flex flex-row justify-center items-center px-2 py-1 rounded"
//               style={{
//                 color: active ? "#00c04b" : "#df2c14",
//                 backgroundColor: active ? "#cefad0" : "#ffc9bb",
//                 borderRadius: 5,
//                 fontWeight: "800",
//                 width: "fit-content",
//               }}
//             >
//               <p className="font-bold text-justify">
//                 {active ? "Active" : "Inactive"}
//               </p>
//             </span>
//           );
//         },
//       },
//     ],
//     [],
//   );

//   const keyMappings = {
//     TDBRECID: "Tdre Cid",
//     APPID: "App ID",
//     APPCIFID: "App Cif ID",
//     LOANBOOKED: "Loan Booked",
//     LOANREFERENCENUMBER: "Loan Reference Number",
//     LOANBOOKDATE: "Loan Book Date",
//     OTHDESC1: "Other Description 1",
//     OTHDESC2: "Other Description 2",
//     OTHDESC3: "Other Description 3",
//     MAKER: "Maker",
//     MAKEDATE: "Make Date",
//     UPDATEBY: "Update By",
//     UPDATEDATE: "Update Date",
//     RECSTATUS: "Rec Status",
//   };

//   // ✅ form fields (FIX: keep your structure, just cast to FieldConfig like earlier)
//   const fields = useMemo(
//     () => [
//       {
//         type: "section",
//         title: "Loan Booking",
//         fields: [
//           {
//             type: "select",
//             name: "Appcifid",
//             label: "App Cif Id",
//             required: true,
//             options: ddValues?.APPCIFID ?? [],
//             placeholder: "Select",
//           },
//           {
//             type: "input",
//             name: "Loanreferencenumber",
//             label: "Loan Reference Number",
//             required: false,
//           },
//           {
//             type: "date",
//             name: "Loanbookdate",
//             label: "Loan Bookdate",
//             required: false,
//           },
//           {
//             type: "switch",
//             name: "Loanbooked",
//             label: "Loan Booked",
//             required: false,
//           },
//         ],
//       },
//     ],
//     [ddValues],
//   ) as unknown as FieldConfig[];

//   const openAdd = () => {
//     const appId = getAppIdFromUrlOrLS();
//     const today = new Date().toISOString().slice(0, 10);

//     setSelectedRecord({
//       id: Date.now(), // UI only
//       APPID: appId,
//       Appcifid: "",
//       Loanreferencenumber: "",
//       Loanbookdate: today,
//       Loanbooked: false,
//       Recstatus: true,
//     } as any);

//     setEditModalOpen(true);
//   };

//   // ✅ POST/PUT
//   const handleFormSubmit = async (data: any) => {
//     const payload: any = {
//       Appcifid: toNum(data.Appcifid),
//       Loanreferencenumber: toStr(data.Loanreferencenumber, ""),
//       Loanbookdate: toIsoDate(data.Loanbookdate),
//       Loanbooked: Boolean(data.Loanbooked),

//       // defaults
//       Updateby: data.Updateby ?? "system",
//       Updatedate: data.Updatedate ?? new Date().toISOString(),
//       Recstatus: data.Recstatus ?? true,
//       Maker: data.Maker ?? "system",
//       Makedate: data.Makedate ?? new Date().toISOString(),
//     };

//     if (!payload.Appcifid) {
//       toast.error("App CIF ID is required");
//       return;
//     }

//     try {
//       const recId =
//         selectedRecord?.TDBRECID ??
//         selectedRecord?.Tdbrecid ??
//         selectedRecord?.RECID ??
//         selectedRecord?.ID ??
//         null;

//       const isEdit =
//         Boolean(selectedRecord) &&
//         Boolean(selectedRecord?.TDBRECID ?? selectedRecord?.Tdbrecid);

//       if (isEdit && recId) {
//         await axios.put(
//           `${API_BASE}/api/DisbursmentLoanBooking/${recId}`,
//           payload,
//         );
//       } else {
//         await axios.post(`${API_BASE}/api/DisbursmentLoanBooking`, payload);
//       }

//       toast.success("Saved");
//       setEditModalOpen(false);
//       setSelectedRecord(null);
//       await fetchRecords();
//     } catch (e: any) {
//       console.error("Submit Error:", e);
//       toast.error("Failed to save");
//     }
//   };

//   return (
//     <>
//       <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => router.back()}
//             className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 hover:shadow-md"
//           >
//             <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-200 transition-colors duration-200" />
//           </button>

//           <h1 className="text-3xl font-bold">Disbursement Loan Booking</h1>
//         </div>

//         <div className="flex gap-2">
//           <Button onClick={fetchRecords} disabled={loading} variant="outline">
//             {loading ? "Refreshing..." : "Refresh"}
//           </Button>

//           <Button
//             onClick={() => {
//               setSelectedRecord(null);
//               openAdd();
//             }}
//           >
//             Add New Record
//           </Button>
//         </div>
//       </div>

//       {error ? (
//         <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200 mb-4">
//           {error}
//         </div>
//       ) : null}

//       {/* ✅ prevent overflow: table scrolls horizontally */}
//       <div className="w-full overflow-x-auto">
//         <div className="min-w-[1100px]">
//           <ReusableDataTable<DisbursmentLoanBookingRow>
//             initialData={records}
//             columns={columns}
//             loading={loading}
//             keyMappings={keyMappings}
//             pageSizeOptions={[5, 10, 20]}
//             onSelectionChange={setSelectedRows}
//             onUpdate={async (row) => {
//               setSelectedRecord(row);
//               setEditModalOpen(true);
//             }}
//             onDelete={async () =>
//               toast.info("Delete not wired for this screen")
//             }
//           />
//         </div>
//       </div>

//       <EditModal
//         isOpen={editModalOpen}
//         onClose={() => {
//           setEditModalOpen(false);
//           setSelectedRecord(null);
//         }}
//         data={selectedRecord}
//         fields={fields}
//         onSubmit={handleFormSubmit}
//       />
//     </>
//   );
// }
