"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

export function SessionTimeoutModal() {
  const { isTimeoutWarningOpen, countdown, logout, resetInactivityTimer } = useAuth();

  return (
    <Dialog open={isTimeoutWarningOpen} onOpenChange={() => resetInactivityTimer()}>
      <DialogContent className="max-w-[450px] p-8 rounded-[1.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900" showCloseButton={false}>
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">
            Session Timeout
          </DialogTitle>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
            Your session is about to expire due to inactivity. You will be logged out automatically in{" "}
            <span className="text-zinc-900 dark:text-white font-bold text-base transition-all">
               {countdown} seconds.
            </span>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-8 flex flex-row justify-center gap-3 sm:justify-center">
          <Button
            variant="outline"
            onClick={logout}
            className="flex-1 h-12 rounded-xl border-red-200 text-red-600 font-bold hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400"
          >
            Logout Now
          </Button>
          <Button
            onClick={() => resetInactivityTimer()}
            className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
