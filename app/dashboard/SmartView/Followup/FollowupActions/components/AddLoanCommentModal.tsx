"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  MessageSquare,
  Users,
  User,
  Send,
  Loader2,
  FileText,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { useAuth } from "@/hooks/useAuth";
import {
  getEscalationUsers,
  EscalationUserItem,
  addLoanComment,
} from "../HandlingAPIs";

interface AddLoanCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tmcaRecId?: number | string | null;
  cifId?: number | string | null;
  loanId?: number | string | null;
  appId?: number | string | null;
  customerName?: string | null;
  language?: number;
  onSuccess?: (commentData?: any) => void;
}

export const AddLoanCommentModal: React.FC<AddLoanCommentModalProps> = ({
  isOpen,
  onClose,
  tmcaRecId,
  cifId,
  loanId,
  appId,
  customerName,
  language: propLanguage,
  onSuccess,
}) => {
  const selectedLanguage = useSelector(languageParams);
  const { user: authUser } = useAuth();

  const language = propLanguage ?? (selectedLanguage === "ar" ? 2 : 1);
  const isAr = language === 2;

  // Resolve current active logged in user id
  const currentUserId = String(
    authUser?.userId ||
    authUser?.Userid ||
    authUser?.UserId ||
    authUser?.USERID ||
    authUser?.id ||
    authUser?.username ||
    "sysadmin"
  );

  const [users, setUsers] = useState<EscalationUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isEveryone, setIsEveryone] = useState<boolean>(true);
  const [comments, setComments] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Input states for CIF ID and Loan ID (when not fixed or opened from general page)
  const [cifIdInput, setCifIdInput] = useState<string>("1");
  const [loanIdInput, setLoanIdInput] = useState<string>("10284");

  const resetForm = useCallback(() => {
    setSelectedUserId("");
    setIsEveryone(true);
    setComments("");
    setError("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Sync CIF and Loan inputs whenever modal opens or props change
  useEffect(() => {
    if (!isOpen) return;

    if (cifId && Number(cifId) > 0) {
      setCifIdInput(String(cifId));
    } else {
      setCifIdInput("1");
    }

    if (loanId && Number(loanId) > 0) {
      setLoanIdInput(String(loanId));
    } else {
      setLoanIdInput("10284");
    }
  }, [isOpen, cifId, loanId]);

  // Load available users list
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const userList = await getEscalationUsers({
          USERID: currentUserId,
          language,
        });
        if (isMounted) {
          setUsers(userList);
        }
      } catch (err) {
        console.error("Failed to fetch users for comments:", err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUserId, language]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedCifId = Number(cifIdInput) || Number(cifId) || 1;
    const resolvedLoanId = Number(loanIdInput) || Number(loanId) || 10284;

    if (!resolvedCifId || resolvedCifId <= 0) {
      setError(isAr ? "يرجى إدخال رقم عميل صحيح (CIF ID)" : "A valid CIF ID is required");
      return;
    }

    if (!resolvedLoanId || resolvedLoanId <= 0) {
      setError(isAr ? "يرجى إدخال رقم عقد صحيح (Loan #)" : "A valid Loan ID or App ID is required");
      return;
    }

    if (!comments.trim()) {
      setError(isAr ? "يرجى كتابة نص الملاحظة / التعليق" : "Please enter comment text");
      return;
    }

    if (!isEveryone && !selectedUserId) {
      setError(
        isAr
          ? "يرجى اختيار المستخدم المستلم أو تفعيل الإرسال للجميع"
          : "Please select a recipient user or check 'Broadcast to Everyone'"
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        tmcarecid: Number(tmcaRecId || 0),
        financierid: 1,
        cifid: resolvedCifId,
        appid: Number(appId || 0),
        loanid: resolvedLoanId,
        fromuserid: currentUserId,
        touserid: isEveryone ? null : selectedUserId,
        istoeveryone: isEveryone,
        comments: comments.trim(),
        maker: currentUserId,
      };

      const res = await addLoanComment(payload);

      if (res?.responsestatus === false) {
        toast.error(res?.responsedescription || "Failed to add comment");
        return;
      }

      toast.success(
        isAr
          ? "تمت إضافة الملاحظة بنجاح"
          : "Loan comment added successfully!"
      );

      if (onSuccess) {
        onSuccess(payload);
      }
      handleClose();
    } catch (err: any) {
      console.error("Error adding loan comment:", err);
      toast.error(
        err?.response?.data?.title ||
        err?.response?.data?.responsedescription ||
        err?.message ||
        "Failed to add comment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hasFixedTarget = Boolean(cifId && Number(cifId) > 0 && loanId && Number(loanId) > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      dir={isAr ? "rtl" : "ltr"}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) handleClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden font-sans">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-cyan-500 via-sky-500 to-blue-600" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/60 flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                {isAr ? "إضافة ملاحظة على القضية / العقد" : "Add Case Comment"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {customerName ? (
                  <span>
                    {customerName}{" "}
                    {loanId ? `• Loan #${loanId}` : ""}{" "}
                    {cifId ? `• CIF #${cifId}` : ""}
                  </span>
                ) : (
                  <span>{isAr ? "تسجيل ملاحظة متابعة داخلية" : "Log collection follow-up comment"}</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Metadata: Either fixed badges or editable inputs */}
          {hasFixedTarget ? (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-800 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {isAr ? "العقد / الحساب:" : "Target:"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                Loan: {loanId}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">
                CIF: {cifId}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                From: {currentUserId}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{isAr ? "بيانات العميل والعقد المستهدف *" : "Target Account & Loan *"}</span>
                </span>
                <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                  From: {currentUserId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    {isAr ? "رقم العميل (CIF ID) *" : "CIF ID *"}
                  </label>
                  <input
                    type="number"
                    value={cifIdInput}
                    onChange={(e) => {
                      setCifIdInput(e.target.value);
                      if (e.target.value) setError("");
                    }}
                    placeholder="e.g. 1"
                    className="w-full h-9 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    {isAr ? "رقم العقد (Loan #) *" : "Loan # *"}
                  </label>
                  <input
                    type="number"
                    value={loanIdInput}
                    onChange={(e) => {
                      setLoanIdInput(e.target.value);
                      if (e.target.value) setError("");
                    }}
                    placeholder="e.g. 10284"
                    className="w-full h-9 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recipient Option */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              {isAr ? "المستلم / نطاق الملاحظة" : "Recipient Scope"}
            </label>

            {/* Is To Everyone Switch */}
            <div
              onClick={() => {
                const nextVal = !isEveryone;
                setIsEveryone(nextVal);
                if (nextVal) {
                  setSelectedUserId("");
                  setError("");
                }
              }}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500/50 bg-gray-50/60 dark:bg-gray-800/40 cursor-pointer transition-all select-none"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {isAr ? "مرئية للجميع (Everyone)" : "Broadcast to Everyone"}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {isAr
                      ? "جميع موظفي وفرق التحصيل يمكنهم رؤية الملاحظة"
                      : "All team members can see this comment"}
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isEveryone}
                onChange={() => {}}
                className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
              />
            </div>

            {/* Individual user selector if not everyone */}
            {!isEveryone && (
              <div className="pt-1 space-y-1 animate-in fade-in duration-200">
                <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{isAr ? "اختر المستخدم المستلم:" : "Select Specific User:"}</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      if (e.target.value) setError("");
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer"
                  >
                    <option value="">
                      {loadingUsers
                        ? "Loading users..."
                        : "-- Select User --"}
                    </option>
                    {users.map((u) => (
                      <option key={u.USERID} value={u.USERID}>
                        {u.USERNAME} ({u.USERID})
                      </option>
                    ))}
                  </select>
                  {loadingUsers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Comments Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{isAr ? "نص الملاحظة *" : "Comment Details *"}</span>
              </label>
              <span className="text-[10px] text-gray-400">
                {comments.length} chars
              </span>
            </div>

            <textarea
              rows={4}
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              placeholder={
                isAr
                  ? "أدخل تفاصيل ومحتوى الملاحظة هنا..."
                  : "Enter case comment or follow-up notes here..."
              }
              className={`w-full p-3 rounded-xl border text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 transition-all resize-none ${
                error
                  ? "border-red-500 focus:ring-red-400/30"
                  : "border-gray-300 dark:border-gray-700 focus:border-cyan-500 focus:ring-cyan-500/20"
              }`}
            />
            {error && (
              <p className="text-[11px] font-medium text-red-500 pt-0.5">
                {error}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={handleClose}
              className="h-10 px-5 rounded-xl border-gray-300 dark:border-gray-700 text-xs font-semibold cursor-pointer"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="h-10 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري الإرسال..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAr ? "إرسال الملاحظة" : "Submit Comment"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLoanCommentModal;
