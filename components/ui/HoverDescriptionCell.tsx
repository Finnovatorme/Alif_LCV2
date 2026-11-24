"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FileText, Eye } from "lucide-react";

export interface HoverDescriptionCellProps {
  text?: string;
  title?: string;
  arabicTitle?: string;
  maxWidth?: string;
  themeColor?: "emerald" | "blue" | "indigo" | "purple" | "cyan" | "amber";
  onViewClick?: () => void;
  language?: number;
}

export const HoverDescriptionCell: React.FC<HoverDescriptionCellProps> = ({
  text,
  title = "Description Details",
  arabicTitle = "تفاصيل البيان",
  maxWidth = "max-w-[210px]",
  themeColor = "indigo",
  onViewClick,
  language = 1,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    arrowLeft: number;
    isUpward: boolean;
    maxHeight: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!text || text.trim() === "" || text === "—") {
    return <span className="text-gray-400 italic text-[11px]">—</span>;
  }

  const isAr = language === 2;
  const displayTitle = isAr ? (arabicTitle || title) : title;

  const colorStyles = {
    emerald: {
      hoverText: "group-hover/text:text-emerald-500",
      iconBg: "hover:bg-emerald-500/10 text-emerald-400",
      accent: "text-emerald-400",
      link: "text-emerald-400 hover:text-emerald-300",
      scrollbar: "[scrollbar-color:#10b981_transparent] [&::-webkit-scrollbar-thumb]:bg-emerald-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-400",
    },
    blue: {
      hoverText: "group-hover/text:text-blue-500",
      iconBg: "hover:bg-blue-500/10 text-blue-400",
      accent: "text-blue-400",
      link: "text-blue-400 hover:text-blue-300",
      scrollbar: "[scrollbar-color:#3b82f6_transparent] [&::-webkit-scrollbar-thumb]:bg-blue-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-blue-400",
    },
    indigo: {
      hoverText: "group-hover/text:text-indigo-500",
      iconBg: "hover:bg-indigo-500/10 text-indigo-400",
      accent: "text-indigo-400",
      link: "text-indigo-400 hover:text-indigo-300",
      scrollbar: "[scrollbar-color:#6366f1_transparent] [&::-webkit-scrollbar-thumb]:bg-indigo-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-indigo-400",
    },
    cyan: {
      hoverText: "group-hover/text:text-cyan-500",
      iconBg: "hover:bg-cyan-500/10 text-cyan-400",
      accent: "text-cyan-400",
      link: "text-cyan-400 hover:text-cyan-300",
      scrollbar: "[scrollbar-color:#06b6d4_transparent] [&::-webkit-scrollbar-thumb]:bg-cyan-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400",
    },
    purple: {
      hoverText: "group-hover/text:text-purple-500",
      iconBg: "hover:bg-purple-500/10 text-purple-400",
      accent: "text-purple-400",
      link: "text-purple-400 hover:text-purple-300",
      scrollbar: "[scrollbar-color:#a855f7_transparent] [&::-webkit-scrollbar-thumb]:bg-purple-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-purple-400",
    },
    amber: {
      hoverText: "group-hover/text:text-amber-500",
      iconBg: "hover:bg-amber-500/10 text-amber-400",
      accent: "text-amber-400",
      link: "text-amber-400 hover:text-amber-300",
      scrollbar: "[scrollbar-color:#f59e0b_transparent] [&::-webkit-scrollbar-thumb]:bg-amber-500/40 hover:[&::-webkit-scrollbar-thumb]:bg-amber-400",
    },
  }[themeColor];

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 400;
      const left = Math.max(16, Math.min(rect.left, window.innerWidth - (popoverWidth + 24)));
      const arrowLeft = Math.max(16, Math.min(rect.left - left + 16, popoverWidth - 30));

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If space below is limited (< 280px) or if above has more room, flip upwards so it never cuts off at taskbar/bottom
      const isUpward = spaceBelow < 280 || (spaceBelow < 350 && spaceAbove > spaceBelow);

      const availableSpace = isUpward ? spaceAbove - 24 : spaceBelow - 24;
      const computedMaxHeight = Math.max(90, Math.min(240, availableSpace - 50));

      setCoords({
        top: isUpward ? undefined : rect.bottom + 6,
        bottom: isUpward ? window.innerHeight - rect.top + 6 : undefined,
        left,
        arrowLeft,
        isUpward,
        maxHeight: computedMaxHeight,
      });
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block ${maxWidth}`}
    >
      <div
        onClick={onViewClick}
        className="flex items-center gap-1.5 cursor-pointer group/text"
        title={isAr ? "انقر لمعاينة التفاصيل الكاملة" : "Click to view full description"}
      >
        <span
          className={`truncate block text-gray-700 dark:text-gray-300 font-normal transition-colors ${colorStyles.hoverText}`}
        >
          {text}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewClick?.();
          }}
          title={isAr ? "معاينة التفاصيل" : "Open description preview"}
          className={`shrink-0 p-0.5 rounded transition-colors cursor-pointer ${colorStyles.iconBg}`}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {mounted &&
        isOpen &&
        coords &&
        createPortal(
          <div
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
            style={{
              position: "fixed",
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              zIndex: 99999,
            }}
            className="flex flex-col animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          >
            {/* Arrow pointing UP when opening downwards */}
            {!coords.isUpward && (
              <div
                style={{ marginLeft: `${coords.arrowLeft}px` }}
                className="w-2.5 h-2.5 bg-slate-900 dark:bg-[#0c1427] border-l border-t border-gray-700 rotate-45 -mb-1 z-10 self-start"
              />
            )}

            {/* Popover Card */}
            <div
              style={{ maxHeight: `${coords.maxHeight}px` }}
              className={`bg-slate-900/98 dark:bg-[#0c1427] text-white text-xs rounded-2xl p-3.5 shadow-2xl border border-gray-700/80 whitespace-normal min-w-[280px] max-w-[420px] overflow-y-auto leading-relaxed [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${colorStyles.scrollbar}`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between pb-1 border-b border-gray-800">
                <span className={`flex items-center gap-1 ${colorStyles.accent}`}>
                  <FileText className="w-3 h-3" />
                  <span>{displayTitle}</span>
                </span>
              </div>
              <p className="text-gray-200 text-xs select-text whitespace-pre-wrap break-words leading-relaxed font-normal pt-1">
                {text}
              </p>
              <div className="mt-2 pt-1.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
                <span>{isAr ? "انقر على النص للمعاينة الكاملة" : "Click text to open full view"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onViewClick?.();
                  }}
                  className={`font-semibold underline cursor-pointer ${colorStyles.link}`}
                >
                  {isAr ? "عرض كامل" : "View Full"}
                </button>
              </div>
            </div>

            {/* Arrow pointing DOWN when opening upwards */}
            {coords.isUpward && (
              <div
                style={{ marginLeft: `${coords.arrowLeft}px` }}
                className="w-2.5 h-2.5 bg-slate-900 dark:bg-[#0c1427] border-r border-b border-gray-700 rotate-45 -mt-1 z-10 self-start"
              />
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
