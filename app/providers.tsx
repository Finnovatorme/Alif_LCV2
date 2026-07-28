"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, type AuthData } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { SessionTimeoutModal } from "@/components/auth/session-timeout-modal";

type ProvidersProps = {
  children: React.ReactNode;
  authData: AuthData | null;
};

export default function Providers({ children, authData }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider authData={authData}>
        {children}
        <SessionTimeoutModal />
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}
