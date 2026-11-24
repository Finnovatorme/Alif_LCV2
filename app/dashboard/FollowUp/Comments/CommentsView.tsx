"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Users,
  User,
  Calendar,
  Search,
  RefreshCw,
  Plus,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  languageParams,
  hasDashabordParams,
} from "@/lib/redux/slices/dashboardApplSlice";
import { formatDateKSA } from "@/utils/helpers";
import {
  getLoanComments,
  LoanCommentItem,
} from "../HandlingAPIs";
import { AddLoanCommentModal } from "@/app/dashboard/SmartView/Followup/FollowupActions/components/AddLoanCommentModal";

export const FollowUpCommentsView: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const selectedLanguage = useSelector(languageParams);
  const { user, loading: authLoading } = useAuth() as any;

  const language = selectedLanguage === "ar" ? 2 : 1;
  const isAr = language === 2;

  const currentUserId = String(
    user?.userId ||
    user?.Userid ||
    user?.UserId ||
    user?.USERID ||
    user?.id ||
    user?.username ||
    "sysadmin"
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [comments, setComments] = useState<LoanCommentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("2020-01-01");
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [selectedCommentForModal, setSelectedCommentForModal] = useState<LoanCommentItem | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLoanComments({
        financierid: 1,
        userid: currentUserId,
        transactionid: 0,
        cifid: 0,
        appid: 0,
        loanid: 0,
        fromdate: fromDate ? `${fromDate}T00:00:00.000Z` : "2020-01-01T00:00:00.000Z",
        todate: toDate ? `${toDate}T23:59:59.000Z` : new Date().toISOString(),
        language,
      });

      setComments(data);
    } catch (err) {
      console.error("Failed to load loan comments:", err);
      toast.error(isAr ? "فشل تحميل الملاحظات" : "Failed to load loan comments");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, fromDate, toDate, language, isAr]);

  useEffect(() => {
    if (!authLoading) {
      fetchComments();
    }
  }, [fetchComments, authLoading]);

  // Statistics
  const stats = useMemo(() => {
    const total = comments.length;
    const everyone = comments.filter((c) => Boolean(c.ISTOEVERYONE)).length;
    const direct = comments.filter((c) => !c.ISTOEVERYONE).length;
    const escalated = comments.filter((c) => Boolean(c.ISESCALATION)).length;
    return { total, everyone, direct, escalated };
  }, [comments]);

  // Filtered comments by search
  const filteredComments = useMemo(() => {
    if (!searchTerm.trim()) return comments;
    const query = searchTerm.toLowerCase().trim();
    return comments.filter((c) => {
      const commentText = String(c.COMMENTS || "").toLowerCase();
      const fromUser = String(c.FROMUSERNAME || c.FROMUSERID || "").toLowerCase();
      const toUser = String(c.TOUSERNAME || c.TOUSERID || "").toLowerCase();
      const loanId = String(c.LOANID || "");
      const cifId = String(c.CIFID || "");
      return (
        commentText.includes(query) ||
        fromUser.includes(query) ||
        toUser.includes(query) ||
        loanId.includes(query) ||
        cifId.includes(query)
      );
    });
  }, [comments, searchTerm]);

  // Navigate to case / loan follow-up actions
  const handleViewCase = (row: LoanCommentItem) => {
    const payload = {
      CIFID: row.CIFID,
      LOANID: row.LOANID,
      APPID: row.APPID,
      TMCARECID: row.TMCARECID,
    };
    dispatch(hasDashabordParams(payload));
    if (typeof window !== "undefined") {
      sessionStorage.setItem("activeFollowupParams", JSON.stringify(payload));
    }
    router.push("/dashboard/SmartView/Followup/FollowupActions");
  };

  const columns: ColumnDef<LoanCommentItem>[] = useMemo(
    () => [
      {
        id: "index",
        header: isAr ? "#" : "#",
        cell: ({ row }) => (
          <span className="font-semibold text-gray-500 text-xs">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "LOANID",
        header: isAr ? "رقم العقد" : "Loan #",
        cell: ({ row }) => {
          const loanId = row.original.LOANID;
          return (
            <span className="font-bold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer">
              {loanId && Number(loanId) > 0 ? loanId : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "CIFID",
        header: isAr ? "رقم العميل" : "CIF ID",
        cell: ({ row }) => {
          const cifId = row.original.CIFID;
          return (
            <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
              {cifId && Number(cifId) > 0 ? cifId : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "FROMUSERNAME",
        header: isAr ? "المرسل" : "From User",
        cell: ({ row }) => {
          const from = row.original.FROMUSERNAME || row.original.FROMUSERID || "—";
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200">
              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[130px] font-medium">{from}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "TOUSERNAME",
        header: isAr ? "المستلم" : "To User",
        cell: ({ row }) => {
          const isEveryone = Boolean(row.original.ISTOEVERYONE);
          const toName = row.original.TOUSERNAME || row.original.TOUSERID;
          if (isEveryone) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                <Users className="w-3 h-3" />
                <span>Everyone</span>
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <User className="w-3 h-3" />
              <span>{toName || "Direct"}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "COMMENTS",
        header: isAr ? "نص الملاحظة" : "Comments",
        cell: ({ row }) => {
          const text = row.original.COMMENTS || "—";
          return (
            <div
              className="max-w-md text-xs text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed"
              title={text}
            >
              {text}
            </div>
          );
        },
      },
      {
        accessorKey: "MAKEDATE",
        header: isAr ? "تاريخ ووقت الإضافة" : "Date & Time",
        cell: ({ row }) => {
          const d = row.original.MAKEDATE;
          if (!d) return <span className="text-gray-400 text-xs">—</span>;
          try {
            const dateObj = new Date(d);
            const dateStr = formatDateKSA(dateObj);
            const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return (
              <div className="flex flex-col text-[11px] text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-800 dark:text-gray-200">{dateStr}</span>
                <span className="text-[10px] text-gray-400">{timeStr}</span>
              </div>
            );
          } catch {
            return <span className="text-xs text-gray-500">{String(d)}</span>;
          }
        },
      },
      {
        id: "actions",
        header: isAr ? "الإجراءات" : "Actions",
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCommentForModal(row.original);
                  setOpenAddModal(true);
                }}
                className="h-8 px-2 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold cursor-pointer gap-1"
                title={isAr ? "إضافة ملاحظة لهذا العقد" : "Add note to this loan"}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isAr ? "تعليق" : "Comment"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewCase(row.original)}
                className="h-8 px-2.5 rounded-lg text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-xs font-semibold cursor-pointer gap-1"
                title={isAr ? "عرض تفاصيل العقد والمتابعة" : "View Case Details"}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isAr ? "عرض" : "View"}</span>
              </Button>
            </div>
          );
        },
      },
    ],
    [isAr]
  );

  return (
    <div className="w-full p-4 md:p-6 space-y-6 font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* 1. Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span>{isAr ? "ملاحظات وتعليقات المتابعة" : "Follow-Up Case Comments"}</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isAr
              ? "سجل الملاحظات والتعليقات المسجلة على القضايا والعقود من قبل مسؤولي التحصيل"
              : "Review all case notes, loan remarks, and team communications"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={fetchComments}
            disabled={loading}
            className="h-10 px-4 rounded-xl border-gray-300 dark:border-gray-700 text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{isAr ? "تحديث" : "Refresh"}</span>
          </Button>

          <Button
            onClick={() => {
              setSelectedCommentForModal(null);
              setOpenAddModal(true);
            }}
            className="h-10 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "إضافة ملاحظة" : "New Comment"}</span>
          </Button>
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isAr ? "إجمالي الملاحظات" : "Total Comments"}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {stats.total}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isAr ? "ملاحظات عامة (الجميع)" : "Broadcast to Everyone"}
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {stats.everyone}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isAr ? "ملاحظات موجهة (لمستخدم)" : "Direct / Targeted"}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {stats.direct}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isAr ? "ملاحظات التصعيد" : "Escalation Notes"}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {stats.escalated}
          </p>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isAr
                ? "بحث برقم العقد، العميل، المستخدم، نص الملاحظة..."
                : "Search by Loan #, CIF, User, Comments text..."
            }
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-gray-600 dark:text-gray-400">
            {isAr ? "من:" : "From:"}
          </span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none"
          />
          <span className="font-semibold text-gray-600 dark:text-gray-400">
            {isAr ? "إلى:" : "To:"}
          </span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none"
          />
          <Button
            size="sm"
            onClick={fetchComments}
            className="h-10 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-semibold cursor-pointer"
          >
            {isAr ? "تطبيق" : "Apply"}
          </Button>
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs p-4">
        <div className="h-1 w-full bg-linear-to-r from-cyan-500 via-sky-500 to-blue-600 mb-4" />
        <ReusableDataTable<LoanCommentItem>
          initialData={filteredComments}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* 5. Add Comment Modal */}
      <AddLoanCommentModal
        isOpen={openAddModal}
        onClose={() => {
          setOpenAddModal(false);
          setSelectedCommentForModal(null);
        }}
        cifId={selectedCommentForModal?.CIFID ?? (comments[0]?.CIFID || 1)}
        loanId={selectedCommentForModal?.LOANID ?? (comments[0]?.LOANID || 10284)}
        tmcaRecId={selectedCommentForModal?.TMCARECID}
        customerName={
          selectedCommentForModal
            ? selectedCommentForModal.CUSTOMERNAME || `Loan #${selectedCommentForModal.LOANID}`
            : undefined
        }
        language={language}
        onSuccess={() => {
          fetchComments();
        }}
      />
    </div>
  );
};

export default FollowUpCommentsView;
