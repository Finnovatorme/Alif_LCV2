"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import axios from "@/utils/axios";

import GenericCardForm, {
  FieldConfig,
} from "@/components/FormComponent/GenericCardForm";

// ✅ icons
import {
  FileText,
  Eye,
  Download,
  Hash,
  AlertCircle,
  UploadCloud,
  Loader2,
} from "lucide-react";

interface ApplicationProps {
  tab?: any;
  appId?: string | number;
}

type Option = { label: string; value: string | number };

function resolveAppId(propAppId?: string | number, tab?: any) {
  if (propAppId !== undefined && propAppId !== null && propAppId !== "")
    return String(propAppId);

  const fromTab =
    tab?.APPID ?? tab?.AppId ?? tab?.appId ?? tab?.TWTRECID ?? tab?.twtRecId;
  if (fromTab !== undefined && fromTab !== null && fromTab !== "")
    return String(fromTab);

  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const q =
      url.searchParams.get("APPID") ||
      url.searchParams.get("appId") ||
      url.searchParams.get("appid");
    if (q) return q;

    const ls =
      localStorage.getItem("APPID") ||
      localStorage.getItem("appId") ||
      localStorage.getItem("selectedAppId");
    if (ls) return ls;
  }

  return "";
}

export default function Document({ tab, appId }: ApplicationProps) {
  const language = useSelector(languageParams);
  const [resolvedAppId, setResolvedAppId] = useState<string>("");

  const [userData, setUserData] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);

  const [documentDetails, setDocumentDetails] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [targetDocument, setTargetDocument] = useState<any>(null);

  const [documentId, setDocumentId] = useState<string>("");
  const [requriedValidation, setRequriedValidation] = useState<string>("");

  const [requiredValidationOptions, setRequiredValidationOptions] = useState<
    Option[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const hasFetched = useRef(false);

  const user = useMemo(() => {
    if (typeof window === "undefined") return { id: "" };
    const id = localStorage.getItem("UserId") || localStorage.getItem("userId") || localStorage.getItem("Userid") || "";
    return { id };
  }, []);

  /* ---------------- Resolve APPID ---------------- */
  useEffect(() => {
    const rid = resolveAppId(appId, tab);
    setResolvedAppId(rid);
  }, [appId, tab]);

  /* ---------------- 1) getUserDetails ---------------- */
  useEffect(() => {
    const getUserDetails = async () => {
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const response = await axios.get(
        `${baseUrl}/api/APPL_APPLICATION?APPID=${resolvedAppId}`,
      );

      const row = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      setUserData(row);
      setUserDetails(row);
    };

    if (resolvedAppId) {
      getUserDetails().catch((e) => console.error("getUserDetails error", e));
    }
  }, [resolvedAppId]);

  /* ---------------- 2) getDocumentDD ---------------- */
  const getDocumentDD = async () => {
    // NOTE: your URL had an extra `}` at the end. Keeping your intent but fixing it.
    const baseUrl = process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
    const response = await axios.get(
      `${baseUrl}/api/WfMasterDocuments/GetWfMasterDocument`,
    );

    console.log("✅ WF docs RAW (first):", response.data?.[0]);
    console.log(
      "✅ WF docs RAW keys:",
      response.data?.[0] ? Object.keys(response.data[0]) : [],
    );

    setDocumentDetails(response.data ?? []);
  };

  useEffect(() => {
    if (resolvedAppId) {
      getDocumentDD().catch((e) => console.error("getDocumentDD error", e));
    }
  }, [resolvedAppId]);

  /* ---------------- 3) REQUIREDVALIDATION options (English) ---------------- */
  useEffect(() => {
    if (hasFetched.current) return;

    // If you later want this from API, you can replace this array.
    // For now: English-only and stable.
    setRequiredValidationOptions([
      { label: "NOT REQUIRED", value: 0 },
      { label: "REQUIRED", value: 1 },
    ]);

    hasFetched.current = true;
  }, []);

  /* ---------------- 4) getAllDocuments ---------------- */
  const getAllDocuments = async () => {
    if (!resolvedAppId) return;
    try {
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const response = await axios.get(
        `${baseUrl}/api/ApplDocuments?APPID=${resolvedAppId}&Language=${language}`,
      );

      setAllDocuments(
        (Array.isArray(response.data) ? response.data : []).reverse(),
      );
    } catch (error: any) {
      console.error(error?.message ?? error);
    }
  };

  useEffect(() => {
    if (resolvedAppId) {
      getAllDocuments().catch((e) => console.error("getAllDocuments error", e));
    }
  }, [resolvedAppId, language]);

  /* ---------------- handlers ---------------- */
  const handleDocumentId = (event: any) => {
    const value = String(event.target.value);
    setDocumentId(value);

    const selected =
      documentDetails?.find((d: any) => String(d.Documentid) === value) ?? null;

    setTargetDocument(selected);

    console.log("✅ Document ID selected value:", value);
    console.log("✅ Document ID selected object:", selected);
  };

  const handleRequiredValidation = (event: any) => {
    const value = String(event.target.value);
    setRequriedValidation(value);

    const selected =
      requiredValidationOptions.find((o) => String(o.value) === value) ?? null;

    console.log("✅ Required Validation selected value:", value);
    console.log("✅ Required Validation selected option:", selected);
  };

  /* ---------------- UI: Document label resolver ---------------- */
  const pickDocLabel = (d: any) => {
    const candidates = [
      d?.Documentname1,
      d?.Documentname,
      d?.DocumentName,
      d?.Documentdesc,
      d?.DocumentDesc,
      d?.Documenttitle,
      d?.DocumentTitle,
      d?.DocName,
      d?.DocDesc,
      d?.Othdesc1,
      d?.Othdesc2,
      d?.Othdesc3,
      d?.Othdesc4,
    ];
    const name = candidates.find(
      (x) => typeof x === "string" && x.trim().length > 0,
    );
    return name ? name.trim() : String(d?.Documentid ?? "");
  };

  const documentIdOptions: Option[] = useMemo(() => {
    const opts =
      (documentDetails || []).map((d: any) => ({
        label: pickDocLabel(d),
        value: d?.Documentid,
      })) ?? [];

    console.log("✅ Document ID options:", opts);
    return opts;
  }, [documentDetails]);

  /* ---------------- Download helpers ---------------- */
  function getFileTypeFromExtension(fileName: string) {
    const ext = fileName?.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      txt: "text/plain",
      csv: "text/csv",
      zip: "application/zip",
      html: "text/html",
      json: "application/json",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  function downloadFile(base64String: string, fileName: string) {
    const fileType = getFileTypeFromExtension(fileName);
    const base64Data = base64String.replace(/^data:.+;base64,/, "");
    const byteCharacters = atob(base64Data);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: fileType });
    return URL.createObjectURL(blob);
  }

  /* ---------------- View/Download ---------------- */
  const handleDocDownload = async (
    docDetails: any,
    action: "download" | "view",
  ) => {
    setIsLoading(true);
    try {
      const dmsUrl = process.env.DMS_API_KEY || "https://demo.finnovator.com.sa:8010";
      const response = await axios.get(
        `${dmsUrl}/api/DocManage/GetFile`,
        {
          params: {
            FinancierID: userData?.FINANCIERID,
            CifID: userData?.CIFID,
            IdNumber: docDetails?.IDNUMBER ?? userDetails?.IDNUMBER,
            TransactionID:
              docDetails?.APPID ?? userData?.APPID ?? resolvedAppId,
            ModuleID: 1,
            DocumentType: docDetails?.DOCUMENTTYPE,
            DocumentID: docDetails?.TADRECID,
          },
        },
      );

      const doc = response?.data?.data?.documents?.[0];
      if (!doc?.fileData || !doc?.fileName) return;

      const fileUrl = downloadFile(doc.fileData, doc.fileName);

      const anchor = document.createElement("a");
      anchor.href = fileUrl;

      if (action === "download") {
        anchor.setAttribute("download", doc.fileName);
        anchor.click();
      } else {
        anchor.target = "_blank";
        anchor.click();
      }
    } catch (error: any) {
      console.error("Download/View error:", error?.message ?? error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- Upload (only when missing) ---------------- */
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    setIsLoading(true);

    const toBase64 = (fileToConvert: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileToConvert);
        reader.onload = () =>
          resolve(String(reader.result).replace(/^data:(.*,)?/, ""));
        reader.onerror = reject;
      });

    try {
      const options = {
        financierID: userData?.FINANCIERID || null,
        cifID: userData?.CIFID || null,
        idNumber: userDetails?.IDNUMBER,
        transactionID: (userData?.APPID ?? resolvedAppId)?.toString() || null,
        moduleID: 1,
        documentType: allDocuments?.[index]?.DOCUMENTTYPE,
        documentID: allDocuments?.[index]?.TADRECID,
        fileData: await toBase64(file),
        fileName: file.name,
      };

      const dmsUrl = process.env.DMS_API_KEY || "https://demo.finnovator.com.sa:8010";
      const response = await axios.post(
        `${dmsUrl}/api/DocManage/PutFile`,
        options,
      );

      const optionsData = {
        tadRecid: allDocuments?.[index]?.TADRECID,
        appid: userData?.APPID ?? Number(resolvedAppId),
        fileName: file.name,
        vb_documentFormat: 0,
        uploadDate: new Date().toISOString(),
        uploadBy: user.id,
        stageName: user.id,
      };

      if (response.data) {
        const loUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
        await axios.post(
          `${loUrl}/api/ApplDocuments/update-ApplDocuments-UploadStatus`,
          optionsData,
        );
        await getAllDocuments();
      }
    } catch (error: any) {
      console.error("Upload error:", error?.message ?? error);
    } finally {
      setUploadingIndex(null);
      setIsLoading(false);
    }
  };

  /* ---------------- Form fields (English only) ---------------- */
  const formFields: FieldConfig[] = [
    {
      name: "documentid",
      label: "Document ID",
      type: "select",
      options: documentIdOptions,
      placeholder: "Select Document ID",
      onChange: handleDocumentId,
      value: documentId as any,
      required: true,
    },
    {
      name: "vb_Requiredvalidation",
      label: "Required Validation",
      type: "select",
      options: requiredValidationOptions,
      placeholder: "Select Required Validation",
      onChange: handleRequiredValidation,
      value: requriedValidation as any,
      required: true,
    },
  ];

  if (!resolvedAppId) return <p>No APPID found.</p>;

  return (
    <div className="space-y-4">
      <GenericCardForm
        title="Document"
        apiEndpoint="/api/ApplDocuments"
        id={resolvedAppId}
        idParamName="APPID"
        formFields={formFields}
      />

      {/* ✅ Documents list: View/Download + Upload if Missing */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Upload Documents
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </div>
          ) : null}
        </div>

        {allDocuments.length === 0 ? (
          <div
            className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm
                          border-gray-200 text-gray-600 bg-white
                          dark:border-gray-800 dark:text-gray-300 dark:bg-gray-950"
          >
            <AlertCircle className="h-4 w-4" />
            <span>No documents found.</span>
          </div>
        ) : (
          <div className="grid gap-3">
            {allDocuments.map((doc, index) => {
              const title =
                doc?.DOCUMENTNAME ?? doc?.DOCUMENTTYPE ?? "Document";
              const recId = doc?.TADRECID ?? index;
              const fileName = doc?.FILENAME || doc?.fileName || "";
              const hasFile = String(fileName).trim().length > 0;

              return (
                <div
                  key={recId}
                  className="group rounded-2xl border p-4 shadow-sm transition
                             border-gray-200 bg-white hover:shadow-md
                             dark:border-gray-800 dark:bg-gray-950 dark:hover:shadow-none"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border
                                      border-gray-200 bg-gray-50
                                      dark:border-gray-800 dark:bg-gray-900"
                      >
                        <FileText className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {title}
                            <span className="text-red-500 ml-1">*</span>
                          </p>

                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium
                                           bg-gray-100 text-gray-700
                                           dark:bg-gray-900 dark:text-gray-300"
                          >
                            <Hash className="h-3 w-3" />
                            {recId}
                          </span>

                          {!hasFile && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-medium
                                             bg-amber-50 text-amber-700 border border-amber-200
                                             dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
                            >
                              Missing
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          {hasFile ? fileName : "No file uploaded"}
                        </p>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {hasFile ? (
                        <>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleDocDownload(doc, "download")}
                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition
                                       border-gray-200 text-gray-700 hover:bg-gray-50
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleDocDownload(doc, "view")}
                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition
                                       border-gray-200 text-gray-700 hover:bg-gray-50
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <label
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition
                                      border border-dashed
                                      border-gray-300 text-gray-700 hover:bg-gray-50
                                      dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900
                                      ${isLoading ? "pointer-events-none opacity-50" : ""}`}
                        >
                          {uploadingIndex === index ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-4 w-4" />
                              Upload
                            </>
                          )}

                          <input
                            hidden
                            type="file"
                            accept="application/msword, application/vnd.ms-excel, application/vnd.ms-powerpoint, .pdf, image/*, .txt, .doc, .docx, .xlsx"
                            onChange={(e) => handleFileChange(e, index)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div
                    className="mt-3 h-px w-full opacity-0 transition group-hover:opacity-100
                                  bg-gray-100 dark:bg-gray-800"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
