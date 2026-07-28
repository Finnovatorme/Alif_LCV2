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

// ✅ shadcn form (same as Comments)
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

type NotificationRowApi = {
  TANRECID?: number;
  APPID?: number;
  Appid?: number;

  VB_NOTIFICATIONTYPE?: number | string;
  VB_NOTIFICATIONRECEPIENT?: number | string;

  Vb_Notificationtype?: number | string;
  Vb_Notificationrecepient?: number | string;

  NOTIFICATIONTYPE?: string;
  NOTIFICATIONRECEPIENT?: string;

  Notificationtype?: string;
  Notificationrecepient?: string;

  NOTIFICATION?: string;
  Notification?: string;

  NOTIFICATIONDATE?: string;
  Notificationdate?: string;

  FROMUSER?: string;
  Fromuser?: string;

  STAGENAME?: string;
  Stagename?: string;

  RECSTATUS?: boolean;
  Recstatus?: boolean;

  Maker?: string;
  Makedate?: string;
  Updateby?: string;
  Updatedate?: string;

  [key: string]: any;
};

type NotificationRow = NotificationRowApi & { id: number };

const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const pick = <T,>(...vals: T[]) =>
  vals.find((v) => v !== undefined && v !== null);

type FormValues = {
  Vb_Notificationtype: string;
  Vb_Notificationrecepient: string;
  Notification: string;
};

export default function Notifications() {
  const dispatch = useDispatch();
  const language = useSelector(languageParams);
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // ✅ APPID resolver (URL first, otherwise localStorage)
  const [appidFromUrl, setAppidFromUrl] = useState<number | null>(null);
  const [appidChecked, setAppidChecked] = useState(false);

  useEffect(() => {
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

    // ✅ fallback to localStorage if URL missing/invalid
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

  const [records, setRecords] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ edit in same top form
  const [editingRow, setEditingRow] = useState<NotificationRow | null>(null);

  // ✅ dd values locally
  const [ddValues, setDdValues] = useState<Record<string, Option[]>>({});
  const hasFetchedDD = useRef(false);

  // ✅ prevent duplicate GET in Next dev strict mode
  const hasFetchedList = useRef(false);

  const form = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      Vb_Notificationtype: "",
      Vb_Notificationrecepient: "",
      Notification: "",
    },
  });

  const resetToEmpty = () => {
    form.reset({
      Vb_Notificationtype: "",
      Vb_Notificationrecepient: "",
      Notification: "",
    });
  };

  // ---------------- Dropdowns ----------------
  const getVbValues = async (cat: string) => {
    try {
      const options = (await vbValue(cat)) as Option[];
      setDdValues((prev) => ({ ...prev, [cat]: options }));
      dispatch(ddOptions({ [cat]: options }));
      return options;
    } catch (e) {
      console.error(`Failed to fetch ${cat}`, e);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      await getVbValues("NOTIFICATIONTYPE");
      await getVbValues("NOTIFICATIONRECEPIENT");
    })();
  }, []);

  // ---------------- Fetch Notifications ----------------
  const fetchNotifications = async () => {
    if (!appidFromUrl) return;

    try {
      setLoading(true);
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const res = await axios.get(
        `${baseUrl}/api/ApplNotification?Appid=${appidFromUrl}&Language=${language}`,
      );
      const data = Array.isArray(res.data) ? res.data : [];

      const mapped: NotificationRow[] = data.map((item: any, index: number) => {
        const tan = toNum(item.TANRECID, -1);
        return {
          ...item,
          id: tan > 0 ? tan : index + 1000000,
        };
      });

      setRecords(mapped);
    } catch (e) {
      console.error(e);
      setRecords([]);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!appidFromUrl) return;
    fetchNotifications();
  }, [appidFromUrl, language]);

  useEffect(() => {
    hasFetchedList.current = false;
  }, [appidFromUrl]);

  // ---------------- Delete ----------------
  const handleDelete = async (row: NotificationRow) => {
    if (!appidFromUrl) return toast.error("APPID missing in URL");

    try {
      setLoading(true);
      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      await axios.delete(
        `${baseUrl}/api/ApplNotification?Tanrecid=${row.TANRECID}&Appid=${appidFromUrl}&Updateby=${userId}`,
      );

      if (editingRow?.TANRECID && editingRow.TANRECID === row.TANRECID) {
        setEditingRow(null);
        resetToEmpty();
      }

      toast.success("Deleted");
      await fetchNotifications();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Start Edit (fill SAME form) ----------------
  const handleStartEdit = (row: NotificationRow) => {
    setEditingRow(row);

    form.reset({
      Vb_Notificationtype: String(
        pick(row.Vb_Notificationtype, row.VB_NOTIFICATIONTYPE, "") ?? "",
      ),
      Vb_Notificationrecepient: String(
        pick(row.Vb_Notificationrecepient, row.VB_NOTIFICATIONRECEPIENT, "") ??
        "",
      ),
      Notification: String(pick(row.Notification, row.NOTIFICATION, "") ?? ""),
    });

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
    const isEdit = Boolean(editingRow?.TANRECID);

    const payload = {
      Appid: appidFromUrl,

      Vb_Notificationtype: values?.Vb_Notificationtype
        ? values.Vb_Notificationtype
        : null,
      Vb_Notificationrecepient: values?.Vb_Notificationrecepient
        ? values.Vb_Notificationrecepient
        : null,
      Notification: values?.Notification ?? "",

      Notificationdate: now,

      // keep existing Maker/Makedate if edit
      Maker: isEdit ? (editingRow?.Maker ?? userId) : userId,
      Makedate: isEdit ? (editingRow?.Makedate ?? now) : now,

      Updateby: userId,
      Updatedate: now,

      Recstatus: true,
    };

    try {
      setLoading(true);

      if (isEdit) {
        const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
        await axios.put(
          `${baseUrl}/api/ApplNotification/${editingRow!.TANRECID}`,
          payload,
        );
        toast.success("Notification updated");
      } else {
        const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
        await axios.post(`${baseUrl}/api/ApplNotification`, payload);
        toast.success("Notification saved");
      }

      await fetchNotifications();
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
  const columns: ColumnDef<NotificationRow>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      { accessorKey: "TANRECID", header: "TANRECID" },
      { accessorKey: "APPID", header: "App ID" },

      { accessorKey: "STAGENAME", header: "Stage Name" },
      { accessorKey: "NOTIFICATIONTYPE", header: "Notification Type" },
      { accessorKey: "NOTIFICATIONRECEPIENT", header: "Recipient" },
      { accessorKey: "FROMUSER", header: "From User" },

      {
        accessorKey: "RECSTATUS",
        header: "Rec Status",
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
        ),
      },
    ],
    [],
  );

  const keyMappings = {
    TANRECID: "Tan Record ID",
    APPID: "Application ID",
    NOTIFICATIONTYPE: "Notification Type",
    NOTIFICATIONRECEPIENT: "Notification Recipient",
    NOTIFICATION: "Notification",
    NOTIFICATIONDATE: "Notification Date",
    FROMUSER: "From User",
    STAGENAME: "Stage Name",
    DELIVERYSTATUS: "Delivery Status",
    DELIVERYDATE: "Delivery Date",
    READSTATUS: "Read Status",
    READDATE: "Read Date",
    OTHDESC1: "Description in English",
    OTHDESC2: "Description in Arabic",
    OTHDESC3: "Description in Other Language",
    MAKEDATE: "Make Date",
    UPDATEBY: "Update By",
    UPDATEDATE: "Update Date",
    RECSTATUS: "Record Status",
  };

  // ✅ only show missing message after URL + localStorage checks are complete
  if (appidChecked && !appidFromUrl) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
        APPID missing in URL. Example: <b>?appid=40236</b>
      </div>
    );
  }

  // optional: while checking, render nothing (minimal, no UI changes)
  if (!appidChecked) return null;

  return (
    <div className="space-y-4">
      {/* ✅ SAME TOP FORM FOR ADD + EDIT */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-5 md:grid-cols-3 items-start"
          >
            {/* Type */}
            <FormField
              control={form.control}
              name="Vb_Notificationtype"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-600">
                    Notification Type
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Notification Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(ddValues?.NOTIFICATIONTYPE ?? []).map((o) => (
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

            {/* Recipient */}
            <FormField
              control={form.control}
              name="Vb_Notificationrecepient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-600">
                    Notification Recipient
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Notification Recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {(ddValues?.NOTIFICATIONRECEPIENT ?? []).map((o) => (
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

            {/* Notification + Buttons */}
            <div className="flex flex-col gap-3">
              <FormField
                control={form.control}
                name="Notification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-slate-600">
                      Notifications
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        disabled={loading}
                        placeholder="Notifications"
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

              {editingRow?.TANRECID ? (
                <p className="text-xs text-slate-500">
                  Editing TANRECID: <b>{editingRow.TANRECID}</b>
                </p>
              ) : null}
            </div>
          </form>
        </Form>
      </div>

      {/* ✅ GRID */}
      <ReusableDataTable<NotificationRow>
        initialData={records}
        columns={columns}
        loading={loading}
        keyMappings={keyMappings}
        onUpdate={async (row) => {
          handleStartEdit(row);
        }}
        onDelete={handleDelete}
        pageSizeOptions={[5, 10, 20]}
      />
    </div>
  );
}
