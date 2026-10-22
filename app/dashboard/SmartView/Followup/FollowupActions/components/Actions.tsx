"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Phone, MessageSquare, MessageCircle, Mail, ArrowLeft, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardParams, hasDashabordParams } from "@/lib/redux/slices/dashboardApplSlice";
import { setSelectedUserId } from "@/lib/redux/slices/userTabSlice";

import { FollowUpModal } from "./FollowUpModal";

interface ActionsProps {
  cifId: number | string;
  customerDetails?: Record<string, any>;
  followupDetails?: Record<string, any>;
}

export const Actions: React.FC<ActionsProps> = ({ cifId, customerDetails, followupDetails }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const smartView = useSelector(dashboardParams);

  const handleSmartViewClick = () => {
    const targetCifId = cifId || customerDetails?.CIFID || followupDetails?.CIFID || smartView?.CIFID || 1;
    const lang = smartView?.language || 1;

    const payload = {
      ...smartView,
      ...customerDetails,
      ...followupDetails,
      CIFID: targetCifId,
      language: lang,
    };

    dispatch(hasDashabordParams(payload));
    dispatch(setSelectedUserId(Number(targetCifId)));
    localStorage.setItem("searchContractParams", JSON.stringify(payload));

    router.push("/dashboard/SmartView/SearchContracts/ContractDetails");
  };

  const [openCallModal, setOpenCallModal] = useState(false);
  const [openCommunicationModal, setOpenCommunicationModal] = useState(false);
  const [openFollowUpModal, setOpenFollowUpModal] = useState(false);
  const [commType, setCommType] = useState<"sms" | "whatsapp" | "email">("sms");
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  // Dynamic real customer details
  const customerFullName =
    customerDetails?.CUSTOMERNAME ||
    customerDetails?.FULLNAME ||
    customerDetails?.CUSTOMERFULLNAME ||
    smartView?.CUSTOMERNAME ||
    smartView?.CUSTOMERFULLNAME ||
    "ALZAHRANI FATIMAH AHMED";

  const customerContactNumber =
    customerDetails?.MOBILENUMBER ||
    customerDetails?.PRIMARYCONTACT ||
    customerDetails?.CONTACTNUMBER ||
    smartView?.MOBILENUMBER ||
    smartView?.PRIMARYCONTACT ||
    "0531646712";

  const customerEmail =
    customerDetails?.EMAIL ||
    customerDetails?.Email ||
    smartView?.EMAIL ||
    "customer@example.com";

  // Dummy Call History matching screenshot 1
  const dummyCallHistory = [
    { id: 1, duration: "03m 42s", date: "8/3/2026", time: "03:56 PM", status: "Completed" },
    { id: 2, duration: "03m 42s", date: "8/3/2026", time: "03:56 PM", status: "Completed" },
    { id: 3, duration: "03m 42s", date: "8/3/2026", time: "03:56 PM", status: "Completed" },
    { id: 4, duration: "03m 42s", date: "8/3/2026", time: "", status: "" },
  ];

  // Dummy Templates matching screenshots 2, 3, 4
  const templatesConfig = {
    sms: {
      title: "Send SMS",
      templates: [
        {
          title: "Regular Sms",
          content: `Dear Customer,\nYou have overdue balance as per our records, if you have not settled yet, please process it urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          title: "Default Sms",
          content: `Dear Customer,\nThis is a notification regarding your default status account. Please process settlement urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          title: "Legal Notice",
          content: `Dear Customer,\nThis is a legal notice regarding your overdue account. Immediate settlement is required to avoid further legal procedures.\n\nFor details, please contact 800 12341234`,
        },
      ],
      history: [
        { id: 1, title: "Regular Sms", date: "12/3/2024", time: "09:28 AM", status: "Sent" },
        { id: 2, title: "Default Sms", date: "12/3/2024", time: "09:27 AM", status: "Sent" },
        { id: 3, title: "Legal Notice", date: "12/3/2024", time: "09:26 AM", status: "Sent" },
        { id: 4, title: "Legal Notice", date: "11/25/2024", time: "06:07 AM", status: "Sent" },
      ],
    },
    whatsapp: {
      title: "Send WhatsApp",
      templates: [
        {
          title: "Regular WhatsApp",
          content: `Dear Customer,\nYou have overdue balance as per our records, if you have not settled yet, please process it urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          title: "Default WhatsApp",
          content: `Dear Customer,\nThis is a notification regarding your default status account. Please process settlement urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          title: "Legal Notice",
          content: `Dear Customer,\nThis is a legal notice regarding your overdue account. Immediate settlement is required to avoid further legal procedures.\n\nFor details, please contact 800 12341234`,
        },
      ],
      history: [
        { id: 1, title: "Regular WhatsApp", date: "12/3/2024", time: "09:28 AM", status: "Sent" },
        { id: 2, title: "Default WhatsApp", date: "12/3/2024", time: "09:27 AM", status: "Sent" },
        { id: 3, title: "Legal Notice", date: "12/3/2024", time: "09:26 AM", status: "Sent" },
        { id: 4, title: "Legal Notice", date: "11/25/2024", time: "06:07 AM", status: "Sent" },
      ],
    },
    email: {
      title: "Send Email",
      templates: [
        {
          title: "Regular Email",
          content: `Dear Customer,\nYou have overdue balance as per our records, if you have not settled yet, please process it urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          title: "Default Email",
          content: `Dear Customer,\nThis is a notification regarding your default status account. Please process settlement urgently to avoid negative score in your credit history.\n\nFor details, please contact 800 12341234`,
        },
        {
          title: "Legal Notice",
          content: `Dear Customer,\nThis is a legal notice regarding your overdue account. Immediate settlement is required to avoid further legal procedures.\n\nFor details, please contact 800 12341234`,
        },
      ],
      history: [
        { id: 1, title: "Regular Email", date: "12/3/2024", time: "09:28 AM", status: "Sent" },
        { id: 2, title: "Default Email", date: "12/3/2024", time: "09:27 AM", status: "Sent" },
        { id: 3, title: "Legal Notice", date: "12/3/2024", time: "09:26 AM", status: "Sent" },
        { id: 4, title: "Legal Notice", date: "11/25/2024", time: "06:07 AM", status: "Sent" },
      ],
    },
  };

  const currentComm = templatesConfig[commType];

  const handleOpenComm = (type: "sms" | "whatsapp" | "email") => {
    setCommType(type);
    setSelectedTemplateIndex(0);
    setOpenCommunicationModal(true);
  };

  return (
    <>
      {/* Top Action Bar Container */}
      <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(15,142,221,0.15)]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] p-5 border border-white/40 dark:border-gray-700/30 flex flex-wrap items-center justify-between gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          {/* Left Communication Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/SmartView/Followup")}
              className="h-10 px-3.5 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2 cursor-pointer text-xs mr-2 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={() => setOpenCallModal(true)}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Phone className="w-4 h-4 fill-current" />
              Call
            </Button>

            <Button
              onClick={() => handleOpenComm("sms")}
              className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </Button>

            <Button
              onClick={() => handleOpenComm("whatsapp")}
              className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              Whatsapp
            </Button>

            <Button
              onClick={() => handleOpenComm("email")}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>

          {/* Right Workflow Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSmartViewClick}
              className="h-10 px-4 rounded-xl border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95"
            >
              Smart View
            </Button>

            <Button
              variant="outline"
              onClick={() => setOpenFollowUpModal(true)}
              className="h-10 px-4 rounded-xl border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Follow up
            </Button>

            <Button className="h-10 px-6 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95">
              Escalate
            </Button>
          </div>
        </div>
      </div>

      {/* 1. MAKE CALL MODAL (Theme Match with Screenshot layout) */}
      {openCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-2xl bg-[#f1f5f9] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-white font-sans">
            {/* Blue Header Bar */}
            <div className="bg-blue-600 text-white px-6 py-3.5 flex items-center justify-between font-bold text-base shadow-xs">
              <span>Make Call</span>
              <button
                onClick={() => setOpenCallModal(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column */}
              <div className="md:col-span-7 flex flex-col gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border border-gray-200/80 dark:border-gray-700/80 flex flex-col gap-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Customer full name: <strong className="text-gray-900 dark:text-white uppercase font-bold">{customerFullName}</strong>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Customer contact number: <strong className="text-gray-900 dark:text-white font-bold">{customerContactNumber}</strong>
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setOpenCallModal(false)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Make A Call
                  </button>
                </div>
              </div>

              {/* Right Column: Call History */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                  History
                </h3>

                <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {dummyCallHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs flex flex-col gap-1 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-gray-800 dark:text-gray-200">
                        <span>Call Duration: {item.duration}</span>
                        <span className="text-gray-500 dark:text-gray-400 font-normal text-[11px]">{item.date} {item.time}</span>
                      </div>
                      {item.status && (
                        <div className="text-gray-600 dark:text-gray-400 text-[11px]">
                          Status: <span className="font-semibold">{item.status}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEND COMMUNICATION MODAL (SMS / WhatsApp / Email) */}
      {openCommunicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl rounded-2xl bg-[#f1f5f9] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-white font-sans">
            {/* Blue Header Bar */}
            <div className="bg-blue-600 text-white px-6 py-3.5 flex items-center justify-between font-bold text-base shadow-xs">
              <span>{currentComm.title}</span>
              <button
                onClick={() => setOpenCommunicationModal(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition-colors cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column */}
              <div className="md:col-span-7 flex flex-col gap-4">
                {/* Main Message Box */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xs border border-gray-200/80 dark:border-gray-700/80 flex flex-col gap-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Customer full name:: <strong className="text-gray-900 dark:text-white uppercase font-bold">{customerFullName}</strong>
                  </p>

                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {commType === "email" ? "Email To: " : "To: "}
                    <strong className="text-gray-900 dark:text-white font-bold">
                      {commType === "email" ? customerEmail : customerContactNumber}
                    </strong>
                  </p>

                  {/* Template Text Content Box */}
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed min-h-[110px]">
                    {currentComm.templates[selectedTemplateIndex]?.content}
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl border border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    Select Template
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <Button
                    onClick={() => setOpenCommunicationModal(false)}
                    className="h-10 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    Send
                  </Button>
                </div>

                {/* Horizontal Selectable Template Cards */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {currentComm.templates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTemplateIndex(idx)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1 shadow-2xs cursor-pointer ${
                        selectedTemplateIndex === idx
                          ? "border-blue-600 bg-white dark:bg-gray-800 ring-2 ring-blue-500/30"
                          : "border-gray-200/80 dark:border-gray-700/80 bg-white/80 dark:bg-gray-800/80 hover:bg-white"
                      }`}
                    >
                      <strong className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {tmpl.title}
                      </strong>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                        {tmpl.content}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: History */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                  History
                </h3>

                <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {currentComm.history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div className="font-bold text-gray-800 dark:text-gray-200 text-xs w-28 truncate">
                        {item.title}
                      </div>

                      <div className="flex flex-col text-[11px] text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-500 dark:text-gray-400 text-[10px]">Date & Time</span>
                        <span>{item.date}</span>
                        <span>{item.time}</span>
                      </div>

                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Status</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADD FOLLOW UP MODAL */}
      <FollowUpModal
        isOpen={openFollowUpModal}
        onClose={() => setOpenFollowUpModal(false)}
        cifId={cifId}
        followupData={followupDetails}
      />
    </>
  );
};
