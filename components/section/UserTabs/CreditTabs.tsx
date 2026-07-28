"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { X, Check, HelpCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

import {
  applicationGet,
  consumerCreditReport,
  userCreditDetailsGet,
} from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";
import {
  consumerSimahReport,
  creditDetailsResponse,
  customerDetailsResponse,
  userCreditDetailsDataResponse,
  customerDetailsDataResponse,
  consumerSimahReportDataResponse,
} from "@/lib/redux/slices/tabsControllerSlice";
import {
  dashboardParams,
  languageParams,
} from "@/lib/redux/slices/dashboardApplSlice";
import { cn } from "@/lib/utils";
import { formatDateKSA } from "@/utils/helpers";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ScoringEngineDetails from "./CreditTabsComponents/ScoringEngineDetails";
import axios from "@/utils/axios";
// import { useTranslation } from "react-i18next";
import {
  Gauge as GaugeIcon,
  Activity,
  CreditCard,
  Trophy,
} from "lucide-react";

const CreditTabs = ({
  tab,
  hideButton: propHideButton,
}: {
  tab?: any;
  hideButton?: boolean;
}) => {
  // const { t: translate } = useTranslation();
  const router = useRouter();
  const isReadOnly = tab?.ALLOWDATAEDIT === false || tab?.ALLOWDATAEDIT === 0;
  // Note: We keep isReadOnly for form fields, but we won't let it block the Deviate button if ISCREDITUSER is true.
  const hideButton = propHideButton; 
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, any>>({
    defaultValues: {},
  });

  const dispatch = useDispatch();
  const language = useSelector(languageParams);
  const appParams = useSelector(dashboardParams);
  const custDetailsDataResponse = useSelector(customerDetailsDataResponse);
  const simahReportData = useSelector(consumerSimahReportDataResponse);
  const userCreditDetails = useSelector(userCreditDetailsDataResponse);

  const [userDetails, setUserDetails] = useState<any>({});
  const [bureauScoreGraph, setBureauScoreGraph] = useState(0);
  const [customerRiskGraph, setCustomerRiskGraph] = useState(0);
  const [engineScoreGraph, setEngineScoreGraph] = useState(0);
  const [simahModalOpen, setSimahModalOpen] = useState(false);
  const [scoringDetailsModal, setScoringDetailsModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [scoringData, setScoringData] = useState({
    Array1: [],
    Array2: [],
    Array3: [],
  });
  const [viewPolicyOpen, setViewPolicyOpen] = useState(false);
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);
  const [revisedAmount, setRevisedAmount] = useState("");
  const [revisedTenure, setRevisedTenure] = useState("");
  const [revisedProfitRate, setRevisedProfitRate] = useState("");
  const [deviateConfirmOpen, setDeviateConfirmOpen] = useState(false);
  const [isDeviating, setIsDeviating] = useState(false);

  // Use refs to prevent multiple calls for the same APPID
  const lastFetchedDetailsAppId = React.useRef<string | null>(null);
  const lastFetchedCreditIdNum = React.useRef<string | null>(null);
  const lastFetchedScoringAppId = React.useRef<string | null>(null);
  const lastFetchedSimahAppId = React.useRef<string | null>(null);

  const getUserDetails = async () => {
    if (
      !appParams.APPID ||
      lastFetchedDetailsAppId.current === String(appParams.APPID)
    )
      return;

    console.log("Fetching User Details for APPID:", appParams.APPID);
    try {
      const parameters = { APPID: appParams.APPID, Language: language };
      const response = await applicationGet(parameters);

      if (response && Array.isArray(response) && response.length > 0) {
        lastFetchedDetailsAppId.current = String(appParams.APPID);
        dispatch(customerDetailsResponse(response));
        setUserDetails(response[0]);
      } else {
        console.warn("Invalid response from applicationGet:", response);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    }
  };

  useEffect(() => {
    if (appParams.APPID) {
      getUserDetails();
    }
  }, [appParams.APPID, language]);

  const getUserCreditDetails = async () => {
    if (!appParams.APPID || !userDetails?.IDNUMBER) return;
    const currentKey = `${appParams.APPID}-${userDetails.IDNUMBER}`;
    if (lastFetchedCreditIdNum.current === currentKey) return;

    console.log(
      "Fetching Credit Details for APPID:",
      appParams.APPID,
      "ID:",
      userDetails.IDNUMBER,
    );
    try {
      const parameters = {
        APPID: appParams.APPID,
        IdNumber: userDetails.IDNUMBER,
        Language: language,
      };
      const response = await userCreditDetailsGet(parameters);
      if (response && !response.error) {
        lastFetchedCreditIdNum.current = currentKey;
        dispatch(creditDetailsResponse(response));
      } else {
        console.warn("Invalid response from userCreditDetailsGet:", response);
      }
    } catch (err) {
      console.error("Error fetching credit details:", err);
    }
  };

  useEffect(() => {
    if (userDetails?.IDNUMBER && appParams.APPID) {
      getUserCreditDetails();
    }
  }, [userDetails?.IDNUMBER, appParams.APPID, language]);

  useEffect(() => {
    if ((userCreditDetails?.APPLICATION_DETAILS?.length ?? 0) > 0) {
      const appDetail = userCreditDetails.APPLICATION_DETAILS[0];
      setRevisedProfitRate(appDetail?.PROFITRATE ?? "");
      setRevisedTenure(appDetail?.APPROVEDTENURE ?? "");
      setRevisedAmount(appDetail?.APPROVEDAMOUNT ?? "");
    }
  }, [userCreditDetails]);

  const bureauFields = [
    { name: "BUREAUREPORTDATE", label: "Bureau Report Date" },
    { name: "BUREAUSCORE", label: "Bureau Score" },
    { name: "REPORTTYPE", label: "Report Type" },
    { name: "EARLIESTISSUEDATE", label: "Earliest Issue Date" },
    { name: "ACTIVEINSTRUMENT", label: "Active Instrument" },
    { name: "CLOSEDINSTRUMENT", label: "Closed Instrument" },
    { name: "GUARANTEEDINSTRUMENT", label: "Guaranteed Instrument" },
    { name: "ACTIVELIMITS", label: "Active Limits" },
    { name: "GUARANTEEDLIMITS", label: "Guaranteed Limits" },
    { name: "ACTIVEOS", label: "Active O/S" },
    { name: "GUARANTEEDOS", label: "Guaranteed O/S" },
    { name: "OVERDUECOUNT", label: "Over Due Count" },
    { name: "OVERDUEAMOUNT", label: "Over Due Amount" },
    { name: "DEFAULTCOUNT", label: "Default Count" },
    { name: "DEFAULTAMOUNT", label: "Default Amount" },
    { name: "DEFAULTOS", label: "Default O/S" },
    { name: "ACTIVEBOUNCEDCHECK", label: "Active Bounced Check" },
    { name: "TOTALBOUNCEDCHECK", label: "Total Bounced Check" },
    { name: "DEFAULTCLOSE1MONTH", label: "Default Close 1 Month" },
    { name: "DEFAULTCLOSE2MONTH", label: "Default Close 2 Month" },
    { name: "DEFAULTCLOSE3MONTH", label: "Default Close 3 Month" },
    { name: "DEFAULTCLOSE6MONTH", label: "Default Close 6 Month" },
    { name: "DEFAULTCLOSE12MONTH", label: "Default Close 12 Month" },
    { name: "INSTRUMENTCLOSE1MONTH", label: "Instrument Close 1 Month" },
    { name: "INSTRUMENTCLOSE2MONTH", label: "Instrument Close 2 Month" },
    { name: "INSTRUMENTCLOSE3MONTH", label: "Instrument Close 3 Month" },
    { name: "INSTRUMENTCLOSE6MONTH", label: "Instrument Close 6 Month" },
    { name: "INSTRUMENTCLOSE12MONTH", label: "Instrument Close 12 Month" },
    { name: "MAXCYCLE1MONTH", label: "Max Cycle 1 Month" },
    { name: "MAXCYCLE2MONTH", label: "Max Cycle 2 Month" },
    { name: "MAXCYCLE3MONTH", label: "Max Cycle 3 Month" },
    { name: "MAXCYCLE6MONTH", label: "Max Cycle 6 Month" },
    { name: "MAXCYCLE12MONTH", label: "Max Cycle 12 Month" },
    { name: "ACTIVEJUDGEMENT", label: "Active Judgement" },
    { name: "TOTALJUDGEMENT", label: "Total Judgement" },
    { name: "LASTCLOSEDATE", label: "Last Close Date" },
    { name: "LASTDEFAULTCLOSEDATE", label: "Last Default Close Date" },
    { name: "PREVIOUSINQUIRY", label: "Previous Inquiry" },
    { name: "PREVIOUSINQUIRY30DAYS", label: "Previous Inquiry 30 Days" },
  ];

  useEffect(() => {
    if (userCreditDetails?.CREDIT_BUREAU_SUMMARY.length < 1) return;
    Object.entries(userCreditDetails.CREDIT_BUREAU_SUMMARY[0]).forEach(
      ([key, value]: [string, any]) => {
        setValue(key, value);
      },
    );
  }, [userCreditDetails, setValue]);

  const [fetchingScoring, setFetchingScoring] = useState(false);
  const fetchScoringData = async () => {
    const appId = appParams.APPID;
    if (!appId || lastFetchedScoringAppId.current === String(appId)) return;

    console.log("Fetching Scoring Data for APPID:", appId);
    setFetchingScoring(true);
    try {
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const response = await axios.get(
        `${baseUrl}/api/SpGetScoringResult?APPID=${appId}&Language=${language}`,
      );

      if (response && response.data) {
        lastFetchedScoringAppId.current = String(appId);
        setScoringData(response.data);
      }
    } catch (err) {
      console.error("Scoring data error:", err);
    } finally {
      setFetchingScoring(false);
    }
  };

  useEffect(() => {
    if (appParams.APPID) {
      fetchScoringData();
    }
  }, [appParams.APPID, language]);

  const getSimahReport = async () => {
    const appId = appParams.APPID || userDetails?.APPID;
    const itemCifId = appParams.CIFID || userDetails?.CIFID || userCreditDetails?.APPLICATION_DETAILS?.[0]?.CIFID;

    if (!appId || !itemCifId) {
      console.warn("Cannot fetch Simah report: APPID or CIFID missing", { appId, itemCifId });
      return;
    }

    if (lastFetchedSimahAppId.current === `${appId}-${itemCifId}`) return;
    lastFetchedSimahAppId.current = `${appId}-${itemCifId}`;

    try {
      const parameters = { APPID: appId, CIFID: itemCifId };
      const response = await consumerCreditReport(parameters);
      if (response && "data" in response) {
        dispatch(consumerSimahReport({ data: response.data }));
        setPdfUrl(response.data);
      }
    } catch (err) {
      console.error("Simah report error:", err);
      lastFetchedSimahAppId.current = null;
      toast.error("Failed to load Simah report");
    }
  };

  useEffect(() => {
    if (simahReportData?.data && simahReportData.data.length > 0) {
      setPdfUrl(simahReportData.data);
    } else if (appParams.CIFID && appParams.APPID) {
      getSimahReport();
    }
  }, [simahReportData, appParams.CIFID, appParams.APPID]);

  const mapRiskToPercent = (risk: string) => {
    switch (risk) {
      case "HIGH RISK":
        return 100;
      case "MEDIUM RISK":
        return 66;
      case "LOW RISK":
        return 33;
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (userCreditDetails?.CREDIT_ENGINE_SUMMARY?.length > 0) {
      const engine = userCreditDetails.CREDIT_ENGINE_SUMMARY[0];
      const score = (engine?.ENGINESCORE ?? 0) > 0 ? engine.ENGINESCORE : 0;
      const total =
        (engine?.ENGINETOTALSCORE ?? 0) > 0 ? engine.ENGINETOTALSCORE : 100;
      setEngineScoreGraph((score / total) * 100);
    }

    if (userCreditDetails?.CREDIT_BUREAU_SUMMARY?.length > 0) {
      const bureau = userCreditDetails.CREDIT_BUREAU_SUMMARY[0];
      setBureauScoreGraph(mapRiskToPercent(bureau?.BUREAUSCORELEVEL));
      setCustomerRiskGraph(mapRiskToPercent(bureau?.CUSTOMERRISK));
    }
  }, [userCreditDetails]);

  const handleDeviate = async () => {
    const appId =
      userCreditDetails?.APPLICATION_DETAILS?.[0]?.APPID || appParams.APPID;
    if (!appId) {
      toast.error("Application ID missing");
      return;
    }

    const payload = {
      appId: appId,
      approvedAmount: revisedAmount,
      profitRate: revisedProfitRate,
      approvedTenure: revisedTenure,
    };

    setIsDeviating(true);
    try {
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const response = await axios.post(
        `${baseUrl}/api/Credit_Deviations/Appl-CreditDeviation`,
        payload,
      );

      if (response && response.status === 200) {
        toast.success("Application deviated successfully");
        setDeviateConfirmOpen(false);
        router.push("/dashboard");
      } else {
        toast.error("Failed to deviate application");
      }
    } catch (error) {
      console.error("Deviation error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsDeviating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "null") return "-";
    try {
      const date = new Date(dateStr);
      return date.toISOString().split("T")[0];
    } catch (e) {
      return dateStr;
    }
  };

  const appDetail = userCreditDetails.APPLICATION_DETAILS[0] || {};

  // Recharts Radial Gauge Data
  const engineChartData = [
    {
      name: "Score",
      value: engineScoreGraph,
      fill:
        engineScoreGraph > 70
          ? "#10b981"
          : engineScoreGraph > 40
            ? "#f59e0b"
            : "#ef4444",
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <form onSubmit={handleSubmit(() => { })}>
        {/* Bureau Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Bureau Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Risk Visuals */}
              <div className="md:col-span-1 space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Bureau Score Level
                </Label>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Low</span>
                  <span>Med</span>
                  <span>High</span>
                </div>
                <Progress value={bureauScoreGraph} className="h-2" />
              </div>
              <div className="md:col-span-1 space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Customer Risk
                </Label>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Low</span>
                  <span>Med</span>
                  <span>High</span>
                </div>
                <Progress value={customerRiskGraph} className="h-2" />
              </div>

              {/* Dynamic Bureau Fields */}
              {bureauFields.map((field) => (
                <Field key={field.name} className="gap-1">
                  <FieldLabel className="text-xs truncate">
                    {field.label}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...register(field.name)}
                      disabled
                      className="h-6 text-sm px-2"
                    />
                  </FieldContent>
                </Field>
              ))}

              {/* View Simah Button */}
              <div className="col-span-full flex justify-end mt-2 text-white">
                <Button
                  variant="default"
                  type="button"
                  onClick={() => {
                    setSimahModalOpen(true);
                    if (!pdfUrl) getSimahReport();
                  }}
                >
                  View Simah Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engine and Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
          {/* Credit Engine */}
          <Card className="md:col-span-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">
                Credit Engine
              </CardTitle>
              <GaugeIcon className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-start gap-8 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <Trophy className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Engine Score
                      </Label>
                      <p className="text-sm font-semibold truncate">
                        {userCreditDetails.CREDIT_ENGINE_SUMMARY[0]?.ENGINESCORE ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                      <HelpCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Engine Result
                      </Label>
                      <p className="text-sm font-semibold truncate">
                        {userCreditDetails.CREDIT_ENGINE_SUMMARY[0]?.ENGINERESULT ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                      <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Customer Risk
                      </Label>
                      <p className="text-sm font-semibold truncate">
                        {userCreditDetails.CREDIT_ENGINE_SUMMARY[0]?.CUSTOMERRISK ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                         Engine Pricing
                      </Label>
                      <p className="text-sm font-semibold truncate">
                        {userCreditDetails.CREDIT_ENGINE_SUMMARY[0]?.SUGGESTEDPRICING ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 w-full lg:w-64">
                  <div className="w-full aspect-square relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        data={engineChartData}
                        startAngle={225}
                        endAngle={-45}
                      >
                        <RadialBar background dataKey="value" cornerRadius={8} />
                        <PolarAngleAxis
                          type="number"
                          domain={[0, 100]}
                          angleAxisId={0}
                          tick={false}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                      <span className="text-4xl font-black text-primary">
                        {Math.round(engineScoreGraph)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                        Score Index
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    className="w-full shadow-lg shadow-blue-500/20"
                    type="button"
                    onClick={() => setScoringDetailsModal(true)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Policy */}
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Credit Policy</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full justify-between pb-6">
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="border rounded-lg p-4 flex flex-col items-center flex-1">
                    <Check className="text-green-500 w-10 h-10 mb-1" />
                    <span className="text-sm font-medium">Pass</span>
                    <span className="text-2xl font-bold">
                      {userCreditDetails.CREDIT_POLICY_SUMMARY[0]
                        ?.PASSESPOLICIES || 0}
                    </span>
                  </div>
                  <div className="border rounded-lg p-4 flex flex-col items-center flex-1">
                    <X className="text-red-500 w-10 h-10 mb-1" />
                    <span className="text-sm font-medium">Fail</span>
                    <span className="text-2xl font-bold">
                      {userCreditDetails.CREDIT_POLICY_SUMMARY[0]
                        ?.FAILEDPOLICIES || 0}
                    </span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <span className="text-sm font-medium block">
                    Total Policies
                  </span>
                  <span className="text-2xl font-bold">
                    {userCreditDetails.CREDIT_POLICY_SUMMARY[0]
                      ?.TOTALPOLICIES || 0}
                  </span>
                </div>
              </div>
              <Button
                variant="default"
                className="w-full mt-4"
                type="button"
                onClick={() => setViewPolicyOpen(true)}
              >
                View Policy Results
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Application Details Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <Field className="gap-1">
                <FieldLabel className="text-xs">App Type</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.APPLICATIONTYPE || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">App Date</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={formatDate(appDetail.APPLICATIONDATE)}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Branch</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.BRANCHNAME || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Sales Channel</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.SALESCHANNEL || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Sales Division</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.SALESDIVISION || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Product</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.PRODUCTNAME || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Sub Product</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.SUBPRODUCTNAME || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Scheme</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.SCHEMENAME || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Req Amount</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.REQUESTAMOUNT || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Req Tenure</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.REQUESTTENURE || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Profit Rate</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.PROFITRATE || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Profit IRR</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.PROFITIRR || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Approved Amount</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.APPROVEDAMOUNT || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Approved Tenure</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.APPROVEDTENURE || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Profit Amount</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.PROFITAMOUNT || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Total Loan</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.TOTALLOANAMOUNT || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Installment</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.INSTALLMENTAMOUNT || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Profit APR</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.PROFITAPR || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Income</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.INCOMEAMOUNT || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Other Income</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.OTHERINCOME || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Gov Support</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.GOVERNMENTSUPPORTINCOME || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Total Obligation</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.TOTALOBLIGATIONS || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Disposable Inc</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.DISPOSABLEINCOME || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Max DBR</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.MAXELIGIBLEDBR || ""}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs">Current DBR</FieldLabel>
                <Input
                  disabled
                  className="h-6 text-sm"
                  value={appDetail.CURRENTDBR || ""}
                />
              </Field>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setRepaymentModalOpen(true)}
              >
                Repayment Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Deviation Card */}
        <Card className="mt-4 border-amber-200 dark:border-amber-900/50 bg-amber-50/10 dark:bg-amber-950/5">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              Credit Deviation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-4">
                <div className="p-2 border rounded-md text-sm bg-muted/20">
                  Approved Amount
                </div>
                <div className="p-2 border rounded-md text-sm bg-muted/20">
                  Approved Tenure
                </div>
                <div className="p-2 border rounded-md text-sm bg-muted/20">
                  Profit Rate
                </div>
              </div>
              <div className="space-y-4">
                <Input disabled value={appDetail.APPROVEDAMOUNT || ""} />
                <Input disabled value={appDetail.APPROVEDTENURE || ""} />
                <Input disabled value={`${appDetail.PROFITRATE || ""}%`} />
              </div>
              <div className="space-y-4">
                <Field>
                  <FieldLabel className="text-xs">Revised Amount</FieldLabel>
                  <Input
                    value={revisedAmount}
                    onChange={(e) => setRevisedAmount(e.target.value)}
                    placeholder="Enter amount"
                    disabled={!appParams.ISCREDITUSER}
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-xs">
                    Revised Tenure (Months)
                  </FieldLabel>
                  <Input
                    value={revisedTenure}
                    onChange={(e) => setRevisedTenure(e.target.value)}
                    placeholder="Enter tenure"
                    disabled={!appParams.ISCREDITUSER}
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-xs">
                    Revised Profit Rate (%)
                  </FieldLabel>
                  <Input
                    value={revisedProfitRate}
                    onChange={(e) => setRevisedProfitRate(e.target.value)}
                    placeholder="Enter rate"
                    disabled={!appParams.ISCREDITUSER}
                  />
                </Field>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="default"
                className={cn(
                  "bg-amber-600 hover:bg-amber-700 text-white",
                  !appParams.ISCREDITUSER && "opacity-50 pointer-events-none"
                )}
                type="button"
                onClick={() => setDeviateConfirmOpen(true)}
                disabled={propHideButton || !appParams.ISCREDITUSER}
              >
                Deviate Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Modals & Dialogs */}

      {/* Simah Report Modal */}
      <Dialog open={simahModalOpen} onOpenChange={setSimahModalOpen}>
        <DialogContent className="max-w-5xl h-[85vh]">
          <DialogHeader>
            <DialogTitle>Simah Report</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full min-h-125">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded border"
                title="Simah Report"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                Loading report...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Scoring Details Modal */}
      <Dialog open={scoringDetailsModal} onOpenChange={setScoringDetailsModal}>
        <DialogContent className="max-w-none w-[95vw] h-[90vh] overflow-y-auto p-8 sm:max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Scoring Engine Details</DialogTitle>
          </DialogHeader>
          <ScoringEngineDetails scoringDetails={scoringData} />
        </DialogContent>
      </Dialog>

      {/* Credit Policy Modal */}
      <Dialog open={viewPolicyOpen} onOpenChange={setViewPolicyOpen}>
        <DialogContent className="sm:max-w-7xl">
          <DialogHeader>
            <DialogTitle>Credit Policy Results</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>APPID</TableHead>
                  <TableHead>Policy Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Authority</TableHead>
                  <TableHead className="text-center">Rule Scanned</TableHead>
                  <TableHead className="text-center">Rule Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(userCreditDetails.CREDIT_POLICY_DETAILS || []).map(
                  (policy: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{policy.APPID}</TableCell>
                      <TableCell className="font-medium">
                        {policy.POLICYNAME}
                      </TableCell>
                      <TableCell>{formatDateKSA(policy.POLICYDATE)}</TableCell>
                      <TableCell>{policy.APPROVALAUTHORITY}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-bold",
                            policy.RULESCANNED
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700",
                          )}
                        >
                          {policy.RULESCANNED ? "YES" : "NO"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-bold",
                            policy.RULERESULT
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700",
                          )}
                        >
                          {policy.RULERESULT ? "PASS" : "FAIL"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Repayment Schedule Modal */}
      <Dialog open={repaymentModalOpen} onOpenChange={setRepaymentModalOpen}>
        <DialogContent className="sm:max-w-7xl">
          <DialogHeader>
            <DialogTitle>Repayment Schedule</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inst. No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Inst. Amount</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">O/S Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(userCreditDetails.REPAYMENT_SCHEDULE || []).map(
                  (row: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{row.INSTALMENTNUMBER}</TableCell>
                      <TableCell>{formatDateKSA(row.INSTALLMENTDATE)}</TableCell>
                      <TableCell className="text-right">
                        {row.INSTALMENTAMOUNT}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.PROFITAMOUNT}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.PRINCIPALAMOUNT}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.CLOSINGOS}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deviation Confirmation Modal */}
      <Dialog open={deviateConfirmOpen} onOpenChange={setDeviateConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <HelpCircle className="w-10 h-10 text-amber-600" />
            </div>
            <DialogTitle className="text-center">Confirm Deviation</DialogTitle>
          </DialogHeader>
          <p className="text-center text-muted-foreground">
            Are you sure you want to deviate this application with the revised
            values?
          </p>
          <DialogFooter className="flex sm:justify-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeviateConfirmOpen(false)}
            >
              No, Cancel
            </Button>
            <Button
              variant="default"
              className="bg-amber-600 hover:bg-amber-700 text-white min-w-[100px]"
              onClick={handleDeviate}
              disabled={isDeviating}
            >
              {isDeviating ? "Processing..." : "Yes, Proceed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditTabs;
