"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { toast } from "sonner";

import axios from "@/utils/axios";
// import { getConsumerContractReport } from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";

// ✅ icons used in your JSX
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";

// ✅ adjust this import path/name to your real slice export
import { consumerContractReport } from "@/lib/redux/slices/tabsControllerSlice";
import { getConsumerContractReport } from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";

/* ---------------- Types ---------------- */
export type ContractSigningRow = {
  id: string;

  CSRRECID?: number | string;
  TOCRECID?: number | string;
  APPID?: number | string;

  INTERNALREFERENCENO?: string;
  Internalreferenceno?: string;

  LOANREFERENCENO?: string;
  Loanreferenceno?: string;

  GUARANTOREXISTS?: boolean | number | string;

  [key: string]: any;
};

/* ---------------- Helpers ---------------- */
const toBool = (v: any) => v === true || v === 1 || v === "1" || v === "true";

/* ---------------- UI helpers (fallback minimal) ---------------- */
/** If you already have these components elsewhere, remove these and import yours instead. */
function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50
                 disabled:opacity-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
    >
      {children}
    </button>
  );
}

function YesNoBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`px-3 py-1 text-xs font-bold rounded ${value ? "text-[#00c04b] bg-[#cefad0]" : "text-[#df2c14] bg-[#ffc9bb]"
        }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

/* ---------------- Modal (Tailwind, dark/light) ---------------- */
function PdfModal({
  open,
  title,
  url,
  loading,
  onClose,
}: {
  open: boolean;
  title?: string;
  url?: string;
  loading?: boolean;
  onClose: () => void;
}) {
  // ESC close
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl
                     dark:border-gray-800 dark:bg-gray-950"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3
                       dark:border-gray-800"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {title ?? "Document Preview"}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {url ? url : loading ? "Loading PDF..." : "No PDF url"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50
                             dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                >
                  Open in new tab
                </a>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50
                           dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="h-[75vh] bg-gray-50 dark:bg-gray-900">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm
                                dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
                >
                  Loading...
                </div>
              </div>
            ) : url ? (
              <iframe title="PDF Viewer" src={url} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                No PDF available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContractSigning() {
  const router = useRouter(); // ✅ App Router router
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  // ✅ APPID from URL: /dashboard/UserTabScreen?appid=40236
  const appidFromUrl = useMemo(() => {
    const raw =
      searchParams.get("appid") ||
      searchParams.get("APPID") ||
      searchParams.get("appId") ||
      localStorage.getItem("selectedAppId");
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);
  const language = useSelector(languageParams);

  const [records, setRecords] = useState<ContractSigningRow[]>([]);
  const [loading, setLoading] = useState(false);

  // toolbar
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // selection (single row)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // pdf state
  const [pdfUrl, setPdfUrl] = useState("");

  // ✅ modal state
  const [openModal, setOpenModal] = useState(false);
  const [modalTitle, setModalTitle] = useState<string>("");

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const response = await axios.get(
        `${baseUrl}/api/OfferContractSigning?APPID=${appidFromUrl}&Language=${language}`,
      );
      const data = Array.isArray(response.data) ? response.data : [];
      const mapped: ContractSigningRow[] = data.map(
        (item: any, index: number) => {
          const key = item?.CSRRECID ?? item?.TOCRECID ?? item?.APPID ?? index;
          return { ...item, id: String(key) };
        },
      );

      const ids = mapped.map((r) => r.id);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dup.length) console.warn("⚠️ Duplicate row ids detected:", dup);

      setRecords(mapped);

      if (mapped.length > 0) toast.success("Contract Signing data fetched");
      else toast.info("No Contract Signing data found");
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch Contract Signing data");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [language]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;

    return records.filter((r) => {
      const internal = String(
        r.INTERNALREFERENCENO ?? r.Internalreferenceno ?? "",
      ).toLowerCase();
      const loan = String(
        r.LOANREFERENCENO ?? r.Loanreferenceno ?? "",
      ).toLowerCase();
      const appid = String(r.APPID ?? "").toLowerCase();
      return internal.includes(q) || loan.includes(q) || appid.includes(q);
    });
  }, [records, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
    setSelectedId(null);
  }, [search, pageSize]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const rangeText = useMemo(() => {
    if (total === 0) return "0–0 of 0";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `${start}–${end} of ${total}`;
  }, [page, pageSize, total]);

  // ✅ uses APPID from URL params
  const getConsumerReport = async () => {
    if (!appidFromUrl) {
      toast.error("APPID missing in URL. Example: ?appid=40236");
      return "";
    }

    const parameters = { APPID: appidFromUrl };
    const response = await getConsumerContractReport(parameters);

    // your API returns string URL in response.data (based on your usage)
    if (response?.data) {
      dispatch(consumerContractReport({ data: response.data }));
      setPdfUrl(response.data);
      return response.data;
    }

    toast.info("No consumer report found.");
    return "";
  };

  // actions
  const handleGenerate = (row: ContractSigningRow) => {
    toast.info(`Generate Document (APPID: ${row.APPID})`);
  };

  // ✅ open modal + load pdf + show inside modal
  const handleViewUnassigned = async () => {
    try {
      setModalTitle("Unassigned Contract");
      setOpenModal(true);
      setLoading(true);

      const url = await getConsumerReport();
      if (!url) return;
    } catch (e) {
      console.error(e);
      toast.error("Failed to load consumer report");
    } finally {
      setLoading(false);
    }
  };

  const handleSendDigital = (row: ContractSigningRow) => {
    toast.info(`Send for Digital Signing (APPID: ${row.APPID})`);
  };

  const handleViewSigned = (row: ContractSigningRow) => {
    toast.info(`View Signed Document (APPID: ${row.APPID})`);
  };

  const exportCsv = () => {
    const headers = [
      "Internal Reference No",
      "Loan Reference No",
      "Guarantor Exists",
    ];
    const lines = [
      headers.join(","),
      ...filtered.map((r) => {
        const internal = String(
          r.INTERNALREFERENCENO ?? r.Internalreferenceno ?? "",
        );
        const loan = String(r.LOANREFERENCENO ?? r.Loanreferenceno ?? "");
        const guar = toBool(r.GUARANTOREXISTS) ? "Yes" : "No";
        const esc = (s: string) => `"${s.replaceAll('"', '""')}"`;
        return [esc(internal), esc(loan), esc(guar)].join(",");
      }),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "contract-signing.csv";
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 8000);
  };

  const closeModal = () => {
    setOpenModal(false);
    setPdfUrl("");
  };

  return (
    <div className="space-y-4">
      {/* ✅ Modal */}
      <PdfModal
        open={openModal}
        title={`${modalTitle}${appidFromUrl ? ` (APPID: ${appidFromUrl})` : ""}`}
        url={pdfUrl}
        loading={loading}
        onClose={closeModal}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Contract Signing
          </h1>
        </div>
      </div>

      {/* Card container */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none
                       focus:border-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
          />

          <button
            type="button"
            onClick={exportCsv}
            className="h-11 w-14 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition
                       flex items-center justify-center"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        {/* Table wrapper */}
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          {/* Header row */}
          <div className="grid grid-cols-[50px_1.7fr_0.6fr_0.6fr_0.5fr] items-center bg-gray-100 px-3 py-3 text-xs font-semibold text-gray-700 dark:bg-gray-900 dark:text-gray-200">
            <div className="text-center" />
            <div className="text-center">Actions</div>

            <div className="text-center border-l border-gray-300 dark:border-gray-700 pl-3">
              Internal Reference No
            </div>

            <div className="text-center">Loan Reference No</div>
            <div className="text-center">Guarantor Exists</div>
          </div>

          {/* Body */}
          {loading && pageRows.length === 0 ? (
            <div className="p-6 text-sm text-gray-600 dark:text-gray-300">
              Loading...
            </div>
          ) : pageRows.length === 0 ? (
            <div className="p-6 text-sm text-gray-600 dark:text-gray-300">
              No records found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {pageRows.map((row) => {
                const internal =
                  row.INTERNALREFERENCENO ?? row.Internalreferenceno ?? "-";
                const loan = row.LOANREFERENCENO ?? row.Loanreferenceno ?? "-";
                const guarantor = toBool(row.GUARANTOREXISTS);
                const selected = selectedId === row.id;

                return (
                  <div
                    key={row.id}
                    className={[
                      "grid grid-cols-[50px_1.7fr_0.6fr_0.6fr_0.5fr] items-center px-3 py-3",
                      selected
                        ? "bg-blue-50 dark:bg-blue-950/30"
                        : "bg-white dark:bg-gray-950",
                    ].join(" ")}
                  >
                    {/* Select */}
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => setSelectedId(selected ? null : row.id)}
                        className="h-4 w-4"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <ActionButton onClick={() => handleGenerate(row)}>
                        Generate Document
                      </ActionButton>

                      <ActionButton
                        onClick={handleViewUnassigned}
                        disabled={loading}
                      >
                        View Unassigned Contract
                      </ActionButton>

                      <ActionButton onClick={() => handleSendDigital(row)}>
                        Send Contract For Digital Signing
                      </ActionButton>

                      <ActionButton onClick={() => handleViewSigned(row)}>
                        View Sign Document
                      </ActionButton>
                    </div>

                    {/* Internal ref */}
                    <div className="text-center text-sm text-gray-800 dark:text-gray-100 border-l border-gray-200 dark:border-gray-800 pl-3">
                      {internal}
                    </div>

                    {/* Loan ref */}
                    <div className="text-center text-sm text-gray-800 dark:text-gray-100">
                      {loan}
                    </div>

                    {/* Guarantor */}
                    <div className="flex items-center justify-center">
                      <YesNoBadge value={guarantor} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
          <div>{selectedId ? "1 row selected" : "0 row selected"}</div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm
                           dark:border-gray-800 dark:bg-gray-950"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm">{rangeText}</div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md p-2 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-900"
              title="Prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md p-2 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-900"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
