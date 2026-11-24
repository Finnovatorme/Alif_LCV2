"use client";

import React from "react";
import { X, Loader2 } from "lucide-react";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string | React.ReactNode;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Note?",
  description = "Your note will be permanently deleted and cannot be recovered.",
  itemName,
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-[360px] rounded-3xl bg-white dark:bg-[#0c1427] border border-gray-200/80 dark:border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-7 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Subtle close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cute Illustrated Trash Can with Sparkles (Matching Image 2) */}
        <div className="relative flex items-center justify-center pt-2 pb-1">
          {/* Subtle Red Ambient Glow */}
          <div className="absolute w-24 h-24 rounded-full bg-rose-500/15 dark:bg-rose-500/20 blur-xl pointer-events-none" />

          {/* Little Floating Sparkles around Trash Can */}
          <span className="absolute -top-1 -left-4 text-rose-500 text-sm font-bold select-none animate-pulse">
            +
          </span>
          <span className="absolute -top-2 right-4 text-rose-500 text-xs font-bold select-none">
            +
          </span>
          <span className="absolute bottom-6 -right-5 text-rose-500 text-base font-bold select-none">
            +
          </span>
          <span className="absolute top-5 -right-3 text-rose-400 text-[10px] select-none">
            ●
          </span>
          <span className="absolute -bottom-1 -left-3 text-rose-400 text-[8px] select-none">
            ●
          </span>
          <span className="absolute bottom-2 right-2 text-rose-400 text-[9px] select-none">
            ●
          </span>

          {/* SVG Trash Can */}
          <svg
            width="88"
            height="88"
            viewBox="0 0 88 88"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative drop-shadow-sm"
          >
            {/* Ground shadow ellipse */}
            <ellipse
              cx="44"
              cy="76"
              rx="28"
              ry="4"
              fill="#F43F5E"
              fillOpacity="0.15"
            />

            {/* Lid Handle */}
            <path
              d="M37 20C37 18.3431 38.3431 17 40 17H48C49.6569 17 51 18.3431 51 20V23H37V20Z"
              fill="#FF4D4F"
            />

            {/* Lid Bar - slightly angled for playful modern feel */}
            <g transform="rotate(-6 44 26)">
              <rect
                x="24"
                y="23"
                width="40"
                height="6"
                rx="3"
                fill="#FF4D4F"
              />
            </g>

            {/* Trash Bin Main Body */}
            <path
              d="M29 30H59L55.8 68.2C55.6 70.3 53.8 72 51.7 72H36.3C34.2 72 32.4 70.3 32.2 68.2L29 30Z"
              fill="#FF4D4F"
            />

            {/* White Stripes on Bin Body */}
            <rect
              x="37"
              y="38"
              width="2.8"
              height="26"
              rx="1.4"
              fill="white"
            />
            <rect
              x="42.6"
              y="38"
              width="2.8"
              height="26"
              rx="1.4"
              fill="white"
            />
            <rect
              x="48.2"
              y="38"
              width="2.8"
              height="26"
              rx="1.4"
              fill="white"
            />
          </svg>
        </div>

        {/* Centered Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-3">
          {title}
        </h3>

        {/* Centered Description */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed max-w-[270px]">
          {description}
        </p>

        {/* Optional Item Highlight */}
        {itemName && (
          <div className="mt-3 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/80 text-[11px] font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/80">
            {itemName}
          </div>
        )}

        {/* Action Buttons (2 equal columns, matching Image 2) */}
        <div className="grid grid-cols-2 gap-3.5 w-full mt-7">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 w-full rounded-2xl border-2 border-rose-500/40 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 bg-white dark:bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-sm font-bold transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-11 w-full rounded-2xl bg-[#FF4D4F] hover:bg-[#ff3b3e] text-white text-sm font-bold shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Deleting...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
