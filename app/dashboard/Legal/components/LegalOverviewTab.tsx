"use client";

import React, { useState } from "react";
import { FileText, Lock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LegalCaseRecord, DEFAULT_LEGAL_CASE } from "../HandlingAPIs";

interface LegalOverviewTabProps {
  cifId?: string | number | null;
  customerName?: string;
  totalAmount?: number | string;
  totalOverdue?: number | string;
  dpd?: number | string;
  isReadOnly?: boolean;
  legalCase?: LegalCaseRecord | null;
}

export const LegalOverviewTab: React.FC<LegalOverviewTabProps> = ({
  cifId = "246",
  customerName = "ALZAHRANI FATIMAH AHMED",
  totalAmount = "80,000.00",
  totalOverdue = "0.00",
  dpd = "0",
  isReadOnly = true,
  legalCase,
}) => {
  const activeCase = legalCase || DEFAULT_LEGAL_CASE;

  const caseRefId = activeCase.TLLCRECID || 1;
  const boundCifId = activeCase.CIFID || cifId || 246;
  const boundLoanId = activeCase.LOANID || 10284;
  const boundTmcaId = activeCase.TMCARECID || 1;
  const boundCreationDate = activeCase.CREATIONDATE
    ? activeCase.CREATIONDATE.slice(0, 10)
    : "2026-11-18";
  const boundApprovedBy = activeCase.APPROVEDBY || "aadna";
  const boundIsApproved = activeCase.ISAPPROVED ?? true;
  const boundCaseType = activeCase.LEGALCASETYPE || "Commercial Debt Recovery";
  const boundClassification =
    activeCase.LEGALCASECLASSIFICATION || "Article 46 Judicial Claim";

  const [formData] = useState({
    caseRef: `LEG-${String(caseRefId).padStart(4, "0")}`,
    claimAmount: String(totalAmount).replace(/ SAR/g, ""),
    legalTenure: "12 Months",
    legalPurpose: boundClassification,
    courtName: "General Court of Riyadh",
    circuitDivision: "Commercial Circuit 3",
    filingChannel: "Najiz Electronic Portal",
    legalCounsel: boundApprovedBy ? `Adv. ${boundApprovedBy}` : "Adv. Mansour Al-Harbi",
    counselLicense: `LC-${boundLoanId || 49210}`,
    nafithBondNo: `NAF-${boundLoanId || 889023}`,
    najizCaseNo: `45100${caseRefId}8234`,
    caseStatus: boundIsApproved ? "Approved Judicial Case" : "Under Judicial Hearing",
    hearingDate: boundCreationDate,
    hearingTime: "10:30 AM",
    dpdDays: String(dpd),
    overdueAmount: String(totalOverdue).replace(/ SAR/g, ""),
    customerConsent: true,
    mobileVerification: true,
    nafathVerification: true,
    article46Enforced: boundIsApproved,
    descEnglish: `Legal recovery case ${caseRefId} initiated under Article 34/46 for Customer CIF ${boundCifId} on Facility Loan ID ${boundLoanId}. Verified by judicial officer ${boundApprovedBy}.`,
    descArabic: `دعوى قضائية وتنفيذية رقم ${caseRefId} مقيدة للعميل رقم ${boundCifId} على العقد التمويلي ${boundLoanId} عبر منصة ناجز ونافذ. اعتمدت بواسطة ${boundApprovedBy}.`,
    descOther: `TMCA: ${boundTmcaId} • Status: Approved (${boundApprovedBy})`,
  });

  const inputClass =
    "h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 cursor-default select-text focus-visible:ring-0 focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Form Card Header (Bound with live Legal Case API) */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200/80 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Legal Case Information
              </h2>
              {boundIsApproved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Approved by {boundApprovedBy}
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
              Case Ref: {formData.caseRef} • CIF: {String(boundCifId)} • Loan ID:{" "}
              {String(boundLoanId)} • Case ID: {String(caseRefId)} • TMCA:{" "}
              {String(boundTmcaId)}
            </span>
          </div>
        </div>

        {isReadOnly && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            <span>Read Only</span>
          </div>
        )}
      </div>

      {/* 5-Column Grid Matching Design */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-4">
          {/* Row 1 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Claim Amount (SAR)
            </label>
            <Input
              value={formData.claimAmount}
              readOnly={isReadOnly}
              className={`${inputClass} font-mono font-semibold`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Litigation Tenure
            </label>
            <Input
              value={formData.legalTenure}
              readOnly={isReadOnly}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Litigation Purpose
            </label>
            <Input
              value={formData.legalPurpose}
              readOnly={isReadOnly}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Court Jurisdiction
            </label>
            <Input
              value={formData.courtName}
              readOnly={isReadOnly}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Circuit Division
            </label>
            <Input
              value={formData.circuitDivision}
              readOnly={isReadOnly}
              className={inputClass}
            />
          </div>

          {/* Row 2 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Filing Channel
            </label>
            <Input
              value={formData.filingChannel}
              readOnly={isReadOnly}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assigned Legal Counsel
            </label>
            <Input
              value={formData.legalCounsel}
              readOnly={isReadOnly}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Counsel Bar License
            </label>
            <Input
              value={formData.counselLicense}
              readOnly={isReadOnly}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nafith Sanad Title No
            </label>
            <Input
              value={formData.nafithBondNo}
              readOnly={isReadOnly}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Najiz Case Reference No
            </label>
            <Input
              value={formData.najizCaseNo}
              readOnly={isReadOnly}
              className={`${inputClass} font-mono`}
            />
          </div>

          {/* Row 3 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Scheduled Hearing Date
            </label>
            <Input
              type="date"
              value={formData.hearingDate}
              readOnly={isReadOnly}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hearing Time
            </label>
            <Input
              value={formData.hearingTime}
              readOnly={isReadOnly}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Days Past Due (PDP / DPD)
            </label>
            <Input
              value={formData.dpdDays}
              readOnly={true}
              className={`${inputClass} font-mono font-bold bg-gray-50 dark:bg-slate-950`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Total Delinquent Overdue
            </label>
            <Input
              value={formData.overdueAmount}
              readOnly={true}
              className={`${inputClass} font-mono font-bold text-rose-600 bg-gray-50 dark:bg-slate-950`}
            />
          </div>

          {/* Switches */}
          <div className="flex flex-col justify-between py-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Customer Notice Consent
            </label>
            <div className="flex items-center h-9">
              <Switch
                checked={formData.customerConsent}
                disabled={isReadOnly}
                className={isReadOnly ? "opacity-75 cursor-default" : ""}
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="flex flex-col justify-between py-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mobile Verification
            </label>
            <div className="flex items-center h-9">
              <Switch
                checked={formData.mobileVerification}
                disabled={isReadOnly}
                className={isReadOnly ? "opacity-75 cursor-default" : ""}
              />
            </div>
          </div>

          <div className="flex flex-col justify-between py-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nafath Verification
            </label>
            <div className="flex items-center h-9">
              <Switch
                checked={formData.nafathVerification}
                disabled={isReadOnly}
                className={isReadOnly ? "opacity-75 cursor-default" : ""}
              />
            </div>
          </div>

          <div className="flex flex-col justify-between py-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Article 46 Execution
            </label>
            <div className="flex items-center h-9">
              <Switch
                checked={formData.article46Enforced}
                disabled={isReadOnly}
                className={isReadOnly ? "opacity-75 cursor-default" : ""}
              />
            </div>
          </div>

          {/* Descriptions / Textareas */}
          <div className="sm:col-span-2 xl:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Legal Summary Description (English)
            </label>
            <Textarea
              rows={2}
              value={formData.descEnglish}
              readOnly={isReadOnly}
              className="text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 cursor-default select-text resize-none focus-visible:ring-0 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 xl:col-span-3 flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Legal Summary Description (Arabic)
            </label>
            <Textarea
              rows={2}
              dir="rtl"
              value={formData.descArabic}
              readOnly={isReadOnly}
              className="text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 font-arabic cursor-default select-text resize-none focus-visible:ring-0 focus:outline-none"
            />
          </div>

          <div className="col-span-full flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Other Notes / Judicial Instructions
            </label>
            <Textarea
              rows={2}
              value={formData.descOther}
              readOnly={isReadOnly}
              className="text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 cursor-default select-text resize-none focus-visible:ring-0 focus:outline-none"
            />
          </div>
        </div>

        {/* Save button only shown when not read-only */}
        {!isReadOnly && (
          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              className="rounded-lg bg-cyan-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Save
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
