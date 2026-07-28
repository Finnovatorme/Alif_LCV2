"use client";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import axios from "@/utils/axios";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";

import { useAuth } from "@/hooks/useAuth";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";

import { ddOptions } from "@/lib/redux/slices/ddValuesSlice";
import { vbValue } from "@/utils/dropDownApis";

// ✅ shadcn form (same form used for add + edit)
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

type Option = { value: number | string; label: string };

type CommentRowApi = {
  TACRECID?: number;
  APPID?: number;
  Appid?: number;

  VB_COMMENTCATEGORY?: number | string;
  VB_COMMENTSUBCATEGORY?: number | string;

  Vb_Commentcategory?: number | string;
  Vb_Commentsubcategory?: number | string;

  COMMENTCATEGORY?: string;
  COMMENTSUBCATEGORY?: string;

  Commentcategory?: string;
  Commentsubcategory?: string;

  COMMENT?: string;
  Comment?: string;

  COMMENTDATE?: string;
  Commentdate?: string;

  RECSTATUS?: boolean;
  Recstatus?: boolean;

  Maker?: string;
  Makedate?: string;
  Updateby?: string;
  Updatedate?: string;

  [key: string]: any;
};

type CommentRow = CommentRowApi & { id: number };

const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const pick = <T,>(...vals: T[]) =>
  vals.find((v) => v !== undefined && v !== null);

type FormValues = {
  Vb_Commentcategory: string;
  Vb_Commentsubcategory: string;
  Comment: string;
};

export default function Comments() {
  const dispatch = useDispatch();
  const language = useSelector(languageParams);
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // ✅ APPID resolver (URL first, otherwise localStorage)
  const [appidFromUrl, setAppidFromUrl] = useState<number | null>(null);
  const [appidChecked, setAppidChecked] = useState(false);

  useEffect(() => {
    // URL: ?appid=40236
    const rawFromUrl =
      searchParams.get("appid") ||
      searchParams.get("APPID") ||
      searchParams.get("appId");

    const urlNum = Number(rawFromUrl);
    if (Number.isFinite(urlNum) && urlNum > 0) {
      setAppidFromUrl(urlNum);
      setAppidChecked(true);
      return;
    }

    // ✅ Fallback: localStorage (only if URL is missing/invalid)
    try {
      if (typeof window !== "undefined") {
        const rawFromLs =
          localStorage.getItem("APPID") ||
          localStorage.getItem("appid") ||
          localStorage.getItem("appId") ||
          localStorage.getItem("selectedAppId") ||
          localStorage.getItem("AppId");

        const lsNum = Number(rawFromLs);
        if (Number.isFinite(lsNum) && lsNum > 0) {
          setAppidFromUrl(lsNum);
          setAppidChecked(true);
          return;
        }
      }
    } catch {
      // ignore
    }

    setAppidFromUrl(null);
    setAppidChecked(true);
  }, [searchParams]);

  const userId = (user as any)?.Userid ?? (user as any)?.userId ?? "system";

  const [records, setRecords] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ edit state (same form)
  const [editingRow, setEditingRow] = useState<CommentRow | null>(null);

  // ✅ dd values locally
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});
  const hasFetchedDD = useRef(false);

  // ✅ prevent duplicate GET in Next.js dev strict mode
  const hasFetchedComments = useRef(false);

  // ✅ same form for add + edit
  const form = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      Vb_Commentcategory: "",
      Vb_Commentsubcategory: "",
      Comment: "",
    },
  });

  const resetToEmpty = () => {
    form.reset({
      Vb_Commentcategory: "",
      Vb_Commentsubcategory: "",
      Comment: "",
    });
  };

  // ---------------- Dropdowns ----------------
  const getVbValues = async (cat: string) => {
    try {
      const options = (await vbValue(cat)) as Option[];
      setDdValues((prev) => ({ ...prev, [cat]: options }));
      dispatch(ddOptions({ [cat]: options })); // optional
      return options;
    } catch (e) {
      console.error(`Failed to fetch ${cat}`, e);
      return [];
    }
  };

  useEffect(() => {
    if (hasFetchedDD.current) return;

    (async () => {
      if (!ddValues?.COMMENTCATEGORY?.length)
        await getVbValues("COMMENTCATEGORY");
      if (!ddValues?.COMMENTSUBCATEGORY?.length)
        await getVbValues("COMMENTSUBCATEGORY");
    })();

    hasFetchedDD.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Fetch Comments ----------------
  const fetchComments = async () => {
    if (!appidFromUrl) return;

    try {
      setLoading(true);
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const res = await axios.get(
        `${baseUrl}/api/ApplComment?Appid=${appidFromUrl}&Language=${language}`,
      );

      const data = Array.isArray(res.data) ? res.data : [];

      const mapped: CommentRow[] = data.map((item: any, index: number) => {
        const tac = toNum(item.TACRECID, -1);
        return {
          ...item,
          // ✅ always unique id (prevents duplicate row rendering)
          id: tac > 0 ? tac : index + 1000000,
        };
      });

      setRecords(mapped);
    } catch (e) {
      console.error(e);
      setRecords([]);
      toast.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!appidFromUrl) return;
    fetchComments();
  }, [appidFromUrl, language]);

  useEffect(() => {
    hasFetchedComments.current = false;
  }, [appidFromUrl]);

  // ---------------- Delete ----------------
  const handleDelete = async (row: CommentRow) => {
    if (!appidFromUrl) return toast.error("APPID missing in URL");

    try {
      setLoading(true);
      await axios.delete(
        `${process.env.LO_API_KEY}/api/ApplComment/?Tacrecid=${row.TACRECID}&Appid=${appidFromUrl}&Updateby=${userId}`,
      );

      // if deleting the same row being edited -> cancel edit
      if (editingRow?.TACRECID && editingRow.TACRECID === row.TACRECID) {
        setEditingRow(null);
        resetToEmpty();
      }

      toast.success("Deleted");
      await fetchComments();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Start Edit (fill SAME form) ----------------
  const handleStartEdit = (row: CommentRow) => {
    setEditingRow(row);

    form.reset({
      Vb_Commentcategory: String(
        pick(row.Vb_Commentcategory, row.VB_COMMENTCATEGORY, "") ?? "",
      ),
      Vb_Commentsubcategory: String(
        pick(row.Vb_Commentsubcategory, row.VB_COMMENTSUBCATEGORY, "") ?? "",
      ),
      Comment: String(pick(row.Comment, row.COMMENT, "") ?? ""),
    });

    // optional: scroll to top form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    resetToEmpty();
  };

  // ---------------- Submit (Add or Update) ----------------
  const onSubmit = async (values: FormValues) => {
    if (!appidFromUrl) return toast.error("APPID missing in URL");

    const now = new Date().toISOString();
    const isEdit = Boolean(editingRow?.TACRECID);

    const payload = {
      Appid: appidFromUrl,
      Vb_Commentcategory: values?.Vb_Commentcategory
        ? values.Vb_Commentcategory
        : null,
      Vb_Commentsubcategory: values?.Vb_Commentsubcategory
        ? values.Vb_Commentsubcategory
        : null,
      Comment: values?.Comment ?? "",
      Commentdate: now,

      Maker: isEdit ? (editingRow?.Maker ?? userId) : userId,
      Makedate: isEdit ? (editingRow?.Makedate ?? now) : now,

      Updateby: userId,
      Updatedate: now,

      Recstatus: true,
    };

    try {
      setLoading(true);

      if (isEdit) {
        await axios.put(
          `${process.env.LO_API_KEY}/api/ApplComment/${editingRow!.TACRECID}`,
          payload,
        );
        toast.success("Comment updated");
      } else {
        await axios.post(`${process.env.LO_API_KEY}/api/ApplComment`, payload);
        toast.success("Comment saved");
      }

      await fetchComments();
      setEditingRow(null);
      resetToEmpty();
    } catch (e) {
      console.error(e);
      toast.error(isEdit ? "Update failed" : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Grid Columns ----------------
  const columns: ColumnDef<CommentRow>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      { accessorKey: "TACRECID", header: "TACRECID" },
      { accessorKey: "APPID", header: "APPID" },

      { accessorKey: "COMMENTCATEGORY", header: "Comment Category" },
      { accessorKey: "COMMENTSUBCATEGORY", header: "Comment Sub Category" },
      { accessorKey: "COMMENTDATE", header: "Comment Date" },

      {
        accessorKey: "RECSTATUS",
        header: "Rec Status",
        // ✅ FIX: explicitly type the cell context so `row` is not implicit any
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
        ),
      },
    ],
    [],
  );

  const keyMappings = {
    TACRECID: "TACRECID",
    APPID: "App ID",
    COMMENTCATEGORY: "Comment Category",
    COMMENTSUBCATEGORY: "Comment Sub Category",
    COMMENTDATE: "Date",
    RECSTATUS: "Status",
  };

  // ✅ Don’t show missing immediately — only after we checked URL + localStorage
  if (appidChecked && !appidFromUrl) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
        APPID missing in URL. Example: <b>?appid=40236</b>
      </div>
    );
  }

  // optional: while checking, render nothing / small placeholder (kept minimal)
  if (!appidChecked) return null;

  return (
    <div className="space-y-4">
      {/* ✅ SAME FORM FOR ADD + EDIT (like screenshot) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-5 md:grid-cols-3 items-start"
          >
            {/* Category */}
            <FormField
              control={form.control}
              name="Vb_Commentcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-600">
                    Comment Category
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Comment Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(ddValues?.COMMENTCATEGORY ?? []).map((o) => (
                          <SelectItem
                            key={String(o.value)}
                            value={String(o.value)}
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Sub Category */}
            <FormField
              control={form.control}
              name="Vb_Commentsubcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-600">
                    Comment Sub Category
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Comment Sub Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(ddValues?.COMMENTSUBCATEGORY ?? []).map((o) => (
                          <SelectItem
                            key={String(o.value)}
                            value={String(o.value)}
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Comment + Buttons */}
            <div className="flex flex-col gap-3">
              <FormField
                control={form.control}
                name="Comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-slate-600">
                      Comments
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        disabled={loading}
                        placeholder="Comments"
                        className="resize-none"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-2">
                {editingRow ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="w-full md:w-40 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-55 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {loading
                    ? editingRow
                      ? "Updating..."
                      : "Saving..."
                    : editingRow
                      ? "Update"
                      : "Save"}
                </button>
              </div>

              {editingRow?.TACRECID ? (
                <p className="text-xs text-slate-500">
                  Editing TACRECID: <b>{editingRow.TACRECID}</b>
                </p>
              ) : null}
            </div>
          </form>
        </Form>
      </div>

      {/* ✅ GRID */}
      <ReusableDataTable<CommentRow>
        initialData={records}
        columns={columns}
        loading={loading}
        keyMappings={keyMappings}
        onUpdate={async (row) => {
          // ✅ edit in same form (no modal)
          handleStartEdit(row);
        }}
        onDelete={handleDelete}
        pageSizeOptions={[5, 10, 20]}
      />
    </div>
  );
}
