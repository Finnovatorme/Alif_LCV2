"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const formSchema = z
  .object({
    userId: z.string().min(1, "User ID is required"),
    email: z.string().email("Invalid email address"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ResetPasswordFormProps extends React.ComponentProps<"div"> {
  token?: string;
  userName?: string;
}

// Password strength evaluator (same logic as FinsolNewTheme)
function evaluatePasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;
  return strength;
}

function getStrengthLabel(strength: number) {
  if (strength < 40) return { label: "Weak", color: "bg-red-500" };
  if (strength < 70) return { label: "Moderate", color: "bg-yellow-500" };
  return { label: "Strong", color: "bg-green-500" };
}

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|:;"'<>,.?/~`]).{8,}$/;

export function ResetPasswordForm({
  className,
  token = "",
  userName = "",
  ...props
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordValue, setPasswordValue] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      userId: userName,
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Countdown redirect after success (same as FinsolNewTheme)
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      router.replace("/login");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, countdown]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (loading) return;
    setPasswordError("");
    setErrorMessage("");

    // Validate password regex (same as FinsolNewTheme)
    if (!PASSWORD_REGEX.test(values.newPassword)) {
      setPasswordError(
        "Password must contain at least 8 characters, uppercase, lowercase, number, and special character."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/Authentication/ResetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userId: values.userId,
          email: values.email,
          newPassword: values.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setErrorMessage(
          result.error || "Password reset failed. The link may have expired."
        );
      }
    } catch (error) {
      console.error("Reset error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── No token: invalid link screen ──────────────────────────────────────────
  if (!token) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="border-2 border-red-400 dark:border-red-700">
          <CardContent className="pt-10 pb-10 text-center space-y-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Invalid Reset Link
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                This link is invalid or has expired. Please request a new
                password reset from the login page.
              </p>
            </div>
            <Button
              onClick={() => router.replace("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Success screen (with countdown like FinsolNewTheme) ────────────────────
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("flex flex-col gap-6", className)}
        {...(props as any)}
      >
        <Card className="border-2 border-green-400 dark:border-green-700">
          <CardContent className="pt-10 pb-10 text-center space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 15 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
            >
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </motion.div>

            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Password Reset Successful!
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Redirecting to login in{" "}
                <span className="font-bold text-blue-600">{countdown}s</span>...
              </p>
            </div>

            {/* Countdown progress bar */}
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </div>

            <Button
              onClick={() => router.replace("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Login Now
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Main Form ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col gap-6", className)}
      {...(props as any)}
    >
      <Card className="border border-[#53a4e2] dark:border-[#53a4e2] w-87.5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription className="text-sm text-zinc-500">
            Enter your details to set a new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-900/20"
            >
              <p className="font-semibold text-red-700 dark:text-red-400">Error</p>
              <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
            </motion.div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* User ID */}
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your User ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Token (disabled — from URL) */}
              <FormItem>
                <FormLabel>User Token</FormLabel>
                <Input
                  value={token}
                  disabled
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed text-xs"
                />
              </FormItem>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Password */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <FormControl>
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="pl-10 pr-10"
                          onChange={(e) => {
                            field.onChange(e);
                            setPasswordValue(e.target.value);
                            setPasswordStrength(
                              evaluatePasswordStrength(e.target.value)
                            );
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Strength Bar (same as FinsolNewTheme) */}
              {passwordValue.length > 0 && (
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        getStrengthLabel(passwordStrength).color
                      )}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  <p
                    className={cn(
                      "text-xs text-right font-semibold",
                      passwordStrength < 40
                        ? "text-red-500"
                        : passwordStrength < 70
                          ? "text-yellow-600"
                          : "text-green-600"
                    )}
                  >
                    Strength: {getStrengthLabel(passwordStrength).label}
                  </p>
                </div>
              )}

              {passwordError && (
                <p className="text-xs text-red-600 dark:text-red-400 text-center">
                  {passwordError}
                </p>
              )}

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="pl-10 pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className={`w-full ${loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
