"use client";
import React from "react";

export default function ExpenseTabs({ tab, appId }: any) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Expenses
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Select a sub-tab like Expense Master / Expense Details.
      </p>
    </div>
  );
}
