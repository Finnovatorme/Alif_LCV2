"use client";
import React from "react";

export default function SchemeTabs({ tab, appId }: any) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Offer / Schemes
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        This is Schemes tab screen.
      </p>

      <div className="mt-4 text-sm text-gray-700 dark:text-gray-200">
        appId: {String(appId ?? "—")}
      </div>
    </div>
  );
}
