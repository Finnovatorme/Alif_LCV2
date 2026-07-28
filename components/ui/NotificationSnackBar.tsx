"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  responseModal,
  responseModalState,
} from "@/lib/redux/slices/snackbarSlice";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export default function NotificationSnackBar() {
  const dispatch = useDispatch();
  const { message, variant, display } = useSelector(responseModalState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(display);

    if (display) {
      const timer = setTimeout(() => {
        setOpen(false);
        dispatch(responseModal({ display: false }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [display]);

  const closeHandler = () => {
    setOpen(false);
    dispatch(responseModal({ display: false }));
  };

  if (!open) return null;

  let icon, circleBgColor, titleColor, textColor, buttonBgColor;
  switch (variant) {
    case "success":
      icon = <CheckCircle size={40} />;
      circleBgColor = "bg-green-500 dark:bg-green-600";
      titleColor = "text-slate-900 dark:text-slate-100";
      textColor = "text-slate-700 dark:text-slate-200";
      buttonBgColor = "bg-green-500 dark:bg-green-600 hover:opacity-90";
      break;
    case "warning":
      icon = <AlertTriangle size={40} />;
      circleBgColor = "bg-yellow-500 dark:bg-yellow-600";
      titleColor = "text-slate-900 dark:text-slate-100";
      textColor = "text-slate-700 dark:text-slate-200";
      buttonBgColor = "bg-yellow-500 dark:bg-yellow-600 hover:opacity-90";
      break;
    case "info":
      icon = <Info size={40} />;
      circleBgColor = "bg-blue-500 dark:bg-blue-600";
      titleColor = "text-slate-900 dark:text-slate-100";
      textColor = "text-slate-700 dark:text-slate-200";
      buttonBgColor = "bg-blue-500 dark:bg-blue-600 hover:opacity-90";
      break;
    case "error":
    case "failed":
    default:
      icon = <AlertCircle size={40} />;
      circleBgColor = "bg-red-500 dark:bg-red-600";
      titleColor = "text-slate-900 dark:text-slate-100";
      textColor = "text-slate-700 dark:text-slate-200";
      buttonBgColor = "bg-red-500 dark:bg-red-600 hover:opacity-90";
      break;
  }

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-md mx-auto pointer-events-auto">
        <div
          className={`absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full flex items-center justify-center shadow-xl ${circleBgColor} animate-bounce`}
        >
          {React.cloneElement(icon, { className: "text-white" })}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden p-6 pt-14 animate-slide-in-up transition-all duration-300">
          <button
            onClick={closeHandler}
            className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition"
          >
            <X size={20} />
          </button>

          <h3 className={`text-2xl font-bold text-center ${titleColor}`}>
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </h3>
          <p
            className={`text-center text-base mt-3 leading-relaxed ${textColor}`}
          >
            {message}
          </p>

          <div className="mt-6 flex justify-center">
            <button
              onClick={closeHandler}
              className={`px-6 py-2.5 rounded-lg text-white font-semibold tracking-wide ${buttonBgColor} transition`}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
