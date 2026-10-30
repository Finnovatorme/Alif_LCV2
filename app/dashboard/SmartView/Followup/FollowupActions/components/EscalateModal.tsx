"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  X,
  AlertTriangle,
  Users,
  User,
  MessageSquare,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  dashboardParams,
  languageParams,
} from "@/lib/redux/slices/dashboardApplSlice";
import {
  getEscalationUsers,
  addNewEscalation,
  EscalationUserItem,
  AddEscalationPayload,
} from "../HandlingAPIs";

interface EscalateModalProps {
  isOpen: boolean;
  onClose: () => void;
  cifId?: number | string | null;
  customerDetails?: Record<string, any>;
  followupDetails?: Record<string, any>;
  loanContracts?: any[];
  onSuccess?: () => void;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  isOpen,
  onClose,
  cifId,
  customerDetails = {},
  followupDetails = {},
  loanContracts = [],
  onSuccess,
}) => {
  const selectedLanguage = useSelector(languageParams);
  const smartView = useSelector(dashboardParams);
  const { user: authUser } = useAuth();

  const language = selectedLanguage === "ar" ? 2 : 1;

  // Resolve current active logged in user id
  const currentUserId = String(
    authUser?.userId ||
    authUser?.Userid ||
    authUser?.UserId ||
    authUser?.USERID ||
    authUser?.id ||
    authUser?.username ||
    "1"
  );

  const customerFullName =
    customerDetails?.CUSTOMERNAME ||
    customerDetails?.FULLNAME ||
    customerDetails?.CUSTOMERFULLNAME ||
    smartView?.CUSTOMERNAME ||
    smartView?.CUSTOMERFULLNAME ||
    "—";

  // Form states
  const [users, setUsers] = useState<EscalationUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isEveryone, setIsEveryone] = useState<boolean>(false);
  const [comments, setComments] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ user?: string; comments?: string }>({});

  // Helper to completely clear and reset all form state
  const resetForm = useCallback(() => {
    setSelectedUserId("");
    setIsEveryone(false);
    setComments("");
    setErrors({});
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Whenever modal opens or closes, reset the state completely
  useEffect(() => {
    resetForm();
  }, [isOpen, resetForm]);

  // Handle ESC key to close and reset
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Proactively fetch users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await getEscalationUsers({
          USERID: currentUserId,
          language,
        });
        if (isMounted) {
          if (Array.isArray(data)) {
            setUsers(data);
          } else {
            setUsers([]);
          }
        }
      } catch (err) {
        console.error("Failed to load escalation users:", err);
        if (isMounted) {
          toast.error("Failed to fetch escalation users list");
        }
      } finally {
        if (isMounted) {
          setLoadingUsers(false);
        }
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

    const newErrors: { user?: string; comments?: string } = {};

    if (!comments.trim()) {
      newErrors.comments = "Escalation comment is required.";
    }

    if (!isEveryone && !selectedUserId) {
      newErrors.user =
        "Please select a user to escalate to, or check 'Escalate to Everyone'.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const resolvedCif = Number(
        cifId ||
        customerDetails?.CIFID ||
        followupDetails?.CIFID ||
        smartView?.CIFID ||
        loanContracts?.[0]?.CIFID ||
        0
      );

      const resolvedAppId = Number(
        customerDetails?.APPLICATIONID ||
        customerDetails?.APPID ||
        followupDetails?.APPLICATIONID ||
        smartView?.APPLICATIONID ||
        loanContracts?.[0]?.APPLICATIONID ||
        loanContracts?.[0]?.APPID ||
        0
      );

      const resolvedLoanId = Number(
        loanContracts?.[0]?.LOANID ||
        customerDetails?.LOANID ||
        followupDetails?.LOANID ||
        smartView?.LOANID ||
        0
      );

      const resolvedFinancierId = Number(
        customerDetails?.FINANCIERID ||
        customerDetails?.Financierid ||
        followupDetails?.FINANCIERID ||
        smartView?.FINANCIERID ||
        loanContracts?.[0]?.FINANCIERID ||
        0
      );
      
      const payload: AddEscalationPayload = {
        // financierid: resolvedFinancierId,
        // cifid: resolvedCif,
        financierid: 3,
        cifid: 40403,
        appid: 60364,
        loanid: resolvedLoanId,
        escalatedfromuserid: currentUserId,
        escalatedtouserid: isEveryone ? "" : selectedUserId,
        isescalatedtoeveryone: isEveryone,
        comments: comments.trim(),
        maker: currentUserId,
      };

      const res = await addNewEscalation(payload);

      if (
        res?.succeeded === false ||
        res?.responsestatus === false ||
        res?.responsecode === "DATA_INSERT_ERROR"
      ) {
        toast.error(
          res?.responsedescription ||
          res?.messagetext ||
          "Failed to submit escalation."
        );
        return;
      }

      toast.success(
        res?.responsedescription || "Case escalated successfully!"
      );

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Error creating escalation:", err);
      toast.error(
        err?.response?.data?.responsedescription ||
        err?.message ||
        "Failed to escalate case."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-[#f1f5f9] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden text-gray-900 dark:text-white font-sans flex flex-col max-h-[92vh]">
        {/* Header Bar matching app theme */}
        <div className="bg-blue-600 text-white px-6 py-3.5 flex items-center justify-between font-bold text-base shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-white" />
            <span className="text-base font-bold">Escalate Case</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="hover:bg-white/20 p-1 rounded-lg transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Context Strip */}
        <div className="bg-white dark:bg-gray-800 px-6 py-3 border-b border-gray-200/80 dark:border-gray-700/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              Customer:
            </span>
            <strong className="text-gray-900 dark:text-white font-bold uppercase truncate max-w-[220px]">
              {customerFullName}
            </strong>
          </div>

          <div className="flex items-center gap-2.5">
            {cifId && (
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200 dark:border-blue-900">
                CIF: {cifId}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 font-medium text-[11px] border border-gray-200 dark:border-gray-700">
              From: {currentUserId}
            </span>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* 1. Checkbox: Escalate to Everyone */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-4 shadow-xs transition-all">
            <div className="flex items-start gap-3">
              <Checkbox
                id="escalate-everyone"
                checked={isEveryone}
                onCheckedChange={(checked) => {
                  const val = checked === true;
                  setIsEveryone(val);
                  if (val) {
                    setErrors((prev) => ({ ...prev, user: undefined }));
                  }
                }}
                className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="escalate-everyone"
                  className="text-xs font-bold text-gray-900 dark:text-white cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Escalate to Everyone
                </label>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Broadcast this case to the entire review team. User selection is
                  not required when this is checked.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Dropdown: Select User */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-500" />
                Assign To User
                {!isEveryone && <span className="text-red-500 font-bold">*</span>}
              </span>
              {isEveryone && (
                <span className="text-[11px] text-gray-400 italic font-normal">
                  (Optional - Broadcasting to everyone)
                </span>
              )}
            </label>

            <div className="relative">
              <select
                value={selectedUserId}
                disabled={isEveryone || loadingUsers}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  if (e.target.value) {
                    setErrors((prev) => ({ ...prev, user: undefined }));
                  }
                }}
                className={`w-full h-11 px-3.5 rounded-xl border bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white transition-all appearance-none outline-none focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:opacity-60 shadow-xs ${errors.user
                    ? "border-red-500 focus:ring-red-400/40"
                    : "border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
              >
                <option value="">
                  {loadingUsers
                    ? "Loading users..."
                    : isEveryone
                      ? "All eligible users will be notified"
                      : "-- Select an Escalation User --"}
                </option>
                {users.map((u) => (
                  <option key={u.USERID} value={u.USERID}>
                    {u.USERNAME} ({u.USERID})
                  </option>
                ))}
              </select>

              {loadingUsers ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                  ▼
                </div>
              )}
            </div>

            {errors.user && (
              <span className="text-[11px] font-medium text-red-500">
                {errors.user}
              </span>
            )}
          </div>

          {/* 3. Textarea: Escalation Comments */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
              Escalation Comments <span className="text-red-500 font-bold">*</span>
            </label>
            <Textarea
              rows={4}
              value={comments}
              placeholder="Enter detailed reason for escalation, key observations, or instructions..."
              onChange={(e) => {
                setComments(e.target.value);
                if (e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, comments: undefined }));
                }
              }}
              className={`rounded-xl border p-3.5 text-xs bg-white dark:bg-gray-800 transition-all outline-none min-h-[110px] resize-y shadow-xs ${errors.comments
                  ? "border-red-500 focus-visible:ring-red-400/40"
                  : "border-gray-300 dark:border-gray-700 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                }`}
            />
            {errors.comments && (
              <span className="text-[11px] font-medium text-red-500">
                {errors.comments}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200/80 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={handleClose}
              className="h-10 px-5 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="h-10 px-6 rounded-xl bg-red-800 hover:bg-red-900 active:scale-95 text-white text-xs font-bold shadow-sm cursor-pointer transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Escalating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Escalate Case
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
