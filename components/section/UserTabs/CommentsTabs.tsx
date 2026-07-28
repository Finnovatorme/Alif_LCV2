"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "@/utils/axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { toast } from "sonner";

// import useLocales from "@/hooks/useLocals"; // ✅ adjust path if needed
import { useAuth } from "@/hooks/useAuth"; // ✅ your AuthContext hook
import {
  consumerCreditReport,
  getConsumerApplicationForm,
  getConsumerContractReport,
} from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";

// import {
//   consumerCreditReport,
//   getConsumerApplicationForm,
//   getConsumerContractReport,
// } from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";

import { dashboardParams } from "@/lib/redux/slices/dashboardApplSlice";

type PdfState = {
  contractPdf: string;
  simahPdf: string;
  applicationPdf: string;
};

type FormValues = { Comments: string };

export default function CommentsTabs({
  tab,
  hideButton: propHideButton,
}: {
  tab?: any;
  hideButton?: boolean;
}) {
  const hideButton =
    propHideButton || tab?.ALLOWDATAEDIT === false || tab?.ALLOWDATAEDIT === 0;
  const router = useRouter();
  const searchParams = useSearchParams();
  // const { translate } = useLocales();
  const appParams = useSelector(dashboardParams);

  // ✅ Auth from context
  const { user } = useAuth(); // expected: user?.userId or user?.Userid etc.

  // ✅ APPID from URL (App Router)
  const appIdFromUrl = useMemo(() => {
    const raw =
      searchParams.get("appid") ||
      searchParams.get("APPID") ||
      searchParams.get("appId");
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const hasFetched = useRef(false);

  const [openPrint, setOpenPrint] = useState(false);
  const [tabValue, setTabValue] = useState<
    "contract" | "simah" | "application"
  >("contract");

  const [isEligibilityRunning, setIsEligibilityRunning] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<PdfState>({
    contractPdf: "",
    simahPdf: "",
    applicationPdf: "",
  });

  // ---------------- form ----------------
  const methods = useForm<FormValues>({
    defaultValues: { Comments: "" },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  const commentToSend = watch("Comments") || "";

  const requireAppId = () => {
    if (!appIdFromUrl) {
      toast.error("APPID missing in URL. Example: ?appid=40236");
      return false;
    }
    return true;
  };

  // ---------------- API calls ----------------
  const handleEligibilityClick = async () => {
    if (!requireAppId()) return;

    setIsEligibilityRunning(true);
    try {
      const payload = {
        appId: appIdFromUrl,
        userId: user?.userId ?? user?.Userid ?? user?.id ?? "",
      };
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      await axios.post(
        `${baseUrl}/api/GenerateApplInitialOffer`,
        payload,
      );
      toast.success("Eligibility check completed!");
    } catch (error) {
      console.error(error);
      toast.error("Error in eligibility check. Please try again later.");
    } finally {
      setIsEligibilityRunning(false);
    }
  };

  const getSimahReport = async () => {
    if (!requireAppId()) return;

    try {
      const response = await consumerCreditReport({
        APPID: appIdFromUrl,
      } as any);

      // ✅ TS FIX: safely treat data as string
      const pdf = typeof response?.data === "string" ? response.data : "";
      if (pdf.length > 0) {
        setPdfUrl((p) => ({ ...p, simahPdf: pdf }));
      }
    } catch (e) {
      console.log("Simah report error", e);
    }
  };

  const getConsumerReport = async () => {
    if (!requireAppId()) return;

    try {
      const response = await getConsumerContractReport({ APPID: appIdFromUrl });

      // ✅ TS FIX: safely treat data as string
      const pdf = typeof response?.data === "string" ? response.data : "";
      if (pdf.length > 0) {
        setPdfUrl((p) => ({ ...p, contractPdf: pdf }));
      }
    } catch (e) {
      console.log("Contract report error", e);
    }
  };

  const getApplicationForm = async () => {
    if (!requireAppId()) return;

    try {
      const response = await getConsumerApplicationForm({
        APPID: appIdFromUrl,
      });

      // ✅ TS FIX: safely treat data as string
      const pdf = typeof response?.data === "string" ? response.data : "";
      if (pdf.length > 0) {
        setPdfUrl((p) => ({ ...p, applicationPdf: pdf }));
      }
    } catch (e) {
      console.log("Application form error", e);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    if (!appIdFromUrl) return;

    hasFetched.current = true;
    getSimahReport();
    getConsumerReport();
    getApplicationForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appIdFromUrl]);

  const generateUUID = async () =>
    new Date().toISOString().replace(/[a-zA-Z:.]/g, "-");

  const handleWorkflowUpdate = async (userAction: string) => {
    if (!requireAppId()) return;

    const uniqueId = await generateUUID();

    const payload: any = {
      transactionId: appIdFromUrl,
      cifId: null,
      tranUid: uniqueId,
      action: userAction,
      maker: user?.userId ?? user?.Userid ?? user?.id ?? "",
      comments: commentToSend,
      outputResult: true,
    };

    try {
      const baseUrl = process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
      const response = await axios.post(
        `${baseUrl}/api/WorkflowAction/WorkflowAction`,
        payload,
      );

      const data = response?.data;

      if (data?.statuscode === 200) {
        toast.success(data?.messagetext || "Workflow updated");
        setTimeout(() => router.push("/dashboard"), 1200);
      } else {
        toast.error(data?.messagetext || "Workflow update failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Please try again later.");
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!requireAppId()) return;

    try {
      const makerId = user?.userId ?? user?.Userid ?? user?.id ?? "";

      const payload = {
        appid: appIdFromUrl,
        comment: values.Comments,
        commentdate: new Date().toISOString(),
        maker: makerId,
        makedate: new Date().toISOString(),
        updateby: makerId,
        updatedate: new Date().toISOString(),
      };

      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const res = await axios.post(
        `${baseUrl}/api/ApplComment`,
        payload,
      );
      if (res?.data?.message === "Success") {
        toast.success("Comment has been saved successfully");
        reset();
      } else {
        toast.info("Comment saved.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating data. Please try again later.");
    }

    await handleWorkflowUpdate("SUBMIT");
  };

  // ---------------- UI ----------------
  const activePdf =
    tabValue === "contract"
      ? pdfUrl.contractPdf
      : tabValue === "simah"
        ? pdfUrl.simahPdf
        : pdfUrl.applicationPdf;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            APPID: {appIdFromUrl ?? "—"}
          </div>

          <textarea
            {...register("Comments", { required: true })}
            rows={3}
            required
            disabled={hideButton}
            placeholder="Comments *"
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none
                       focus:border-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
          />

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpenPrint(true)}
              disabled={appParams?.ALLOWPRINT === false || appParams?.ALLOWPRINT === 0}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Print
            </button>

            <button
              type="button"
              onClick={handleEligibilityClick}
              disabled={hideButton}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Eligibility
            </button>

            <button
              type="button"
              onClick={() => handleWorkflowUpdate("REJECT")}
              disabled={hideButton || appParams?.ALLOWREJECT === false || appParams?.ALLOWREJECT === 0}
              className="rounded-xl bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm
                         hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
                         dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Reject
            </button>

            <button
              type="button"
              onClick={() => handleWorkflowUpdate("REVIEW")}
              disabled={hideButton || appParams?.ALLOWREVIEW === false || appParams?.ALLOWREVIEW === 0}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review
            </button>

            <button
              type="submit"
              disabled={hideButton || isSubmitting || appParams?.ALLOWSUBMIT === false || appParams?.ALLOWSUBMIT === 0}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </div>
      </form>

      {isEligibilityRunning && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
          <div className="rounded-xl bg-white p-4 text-sm shadow dark:bg-gray-950 dark:text-gray-100">
            Running eligibility check...
          </div>
        </div>
      )}

      {openPrint && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenPrint(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl
                         dark:border-gray-800 dark:bg-gray-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Print
                </div>
                <button
                  onClick={() => setOpenPrint(false)}
                  className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setTabValue("contract")}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold border ${
                    tabValue === "contract"
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                      : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  Contract
                </button>

                <button
                  type="button"
                  onClick={() => setTabValue("simah")}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold border ${
                    tabValue === "simah"
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                      : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  Simah
                </button>

                <button
                  type="button"
                  onClick={() => setTabValue("application")}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold border ${
                    tabValue === "application"
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                      : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  Application Form
                </button>
              </div>

              <div className="h-[80vh] bg-gray-50 dark:bg-gray-900">
                {activePdf ? (
                  <iframe
                    src={activePdf}
                    title="PDF"
                    className="h-full w-full border-none"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                    No PDF found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
