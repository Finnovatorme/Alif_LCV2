"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Lock,
  Mail,
  User,
  CreditCard,
  Smartphone,
  CheckCircle2,
  X,
  ArrowLeft,
  MailCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

const recoverySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email address"),
  idNumber: z.string().min(4, "ID Number must be at least 4 digits"),
  mobileNo: z
    .string()
    .min(8, "Mobile No must be at least 8 digits")
    .regex(/^\d+$/, "Must be numeric"),
});

type RecoveryFormValues = z.infer<typeof recoverySchema>;

interface RecoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "verify" | "success";

export function RecoveryModal({ open, onOpenChange }: RecoveryModalProps) {
  const [step, setStep] = useState<Step>("verify");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { userId: "", email: "", idNumber: "", mobileNo: "" },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("verify");
      setErrorMsg("");
      form.reset();
    }, 300);
  };

  const onSubmit = async (values: RecoveryFormValues) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/Authentication/ForgotPasswordScreen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: values.userId,
          email: values.email,
          idNumber: values.idNumber,
          mobileNo: values.mobileNo,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep("success");
      } else {
        setErrorMsg(
          result.error || "Recovery request failed. Please check your details."
        );
      }
    } catch (error) {
      console.error("Recovery error:", error);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[420px] p-0 overflow-hidden border-none bg-transparent shadow-none"
        showCloseButton={false}
      >
        <AnimatePresence mode="wait">
          {/* ── STEP 1: IDENTITY VERIFICATION ── */}
          {step === "verify" && (
            <motion.div
              key="step-verify"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className={cn(
                "relative w-full overflow-hidden rounded-[2.5rem] bg-white p-8 pb-10 pt-12 text-center shadow-2xl dark:bg-zinc-900",
                "border border-zinc-200 dark:border-zinc-800"
              )}
            > 
              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                type="button"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Header */}
              <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white uppercase leading-none">
                  RECOVERY
                </h2>
                <p className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Verify your identity to receive a reset link
                </p>
              </div>

              {/* Error */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left dark:border-red-800 dark:bg-red-900/20"
                >
                  <p className="text-[12px] font-medium text-red-600 dark:text-red-400">
                    {errorMsg}
                  </p>
                </motion.div>
              )}

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10" />
                            <FormControl>
                              <Input
                                placeholder="User ID"
                                {...field}
                                className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 pl-11 pr-4 text-[14px] transition-all focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:bg-zinc-900"
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-[11px] text-left ml-2" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10" />
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Email Address"
                                {...field}
                                className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 pl-11 pr-4 text-[14px] transition-all focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:bg-zinc-900"
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-[11px] text-left ml-2" />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <CreditCard className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10" />
                              <FormControl>
                                <Input
                                  placeholder="ID Number"
                                  {...field}
                                  className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 pl-11 pr-3 text-[13px] transition-all focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:bg-zinc-900"
                                />
                              </FormControl>
                            </div>
                            <FormMessage className="text-[10px] text-left ml-1" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mobileNo"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <Smartphone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10" />
                              <FormControl>
                                <Input
                                  placeholder="Mobile No"
                                  {...field}
                                  className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 pl-11 pr-3 text-[13px] transition-all focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:bg-zinc-900"
                                />
                              </FormControl>
                            </div>
                            <FormMessage className="text-[10px] text-left ml-1" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-2 rounded-xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </Form>

              <button
                type="button"
                onClick={handleClose}
                className="mt-6 flex items-center justify-center gap-2 mx-auto text-sm font-bold text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Login
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: EMAIL SENT SUCCESS ── */}
          {step === "success" && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full rounded-[2.5rem] bg-white p-10 py-14 text-center shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              {/* Animated icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", damping: 15, stiffness: 300 }}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6"
              >
                <MailCheck className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  Check Your Email!
                </h3>
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[270px] mx-auto">
                  A password reset link has been sent to your email.
                  The link is valid for{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    1 hour
                  </span>
                  . Please check your inbox (and spam folder).
                </p>
              </motion.div>

              {/* Checklist */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 space-y-2 text-left max-w-[240px] mx-auto"
              >
                {[
                  "Check your inbox",
                  "Check spam / junk folder",
                  "Click the reset link in the email",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-[13px] text-zinc-600 dark:text-zinc-400">
                      {item}
                    </span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <Button
                  onClick={handleClose}
                  className="h-12 rounded-xl bg-blue-600 px-10 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99]"
                >
                  Back to Login
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
