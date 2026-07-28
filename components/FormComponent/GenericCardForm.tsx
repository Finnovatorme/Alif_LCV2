"use client";

import React, { useEffect, useState } from "react";
import { FileText, LucideIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "sonner";
import { formatDateKSA, isDateString } from "@/utils/helpers";

export type FieldConfig = {
  name: string;
  label: string;
  type: "input" | "number" | "textarea" | "select" | "switch";
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  required?: boolean;
  onChange?: (value: string | number | boolean) => void;
  value?: string | number | boolean;
  disabled?: boolean;
};

// ✅ key fix: prevent `{}` inference (which makes `name` become `never`)
type AnyFormValues = Record<string, any>;

interface GenericCardFormProps {
  title: string;
  icon?: LucideIcon;
  apiEndpoint: string;
  id: string | number;
  idParamName?: string;
  formFields: FieldConfig[];
  onDataLoaded?: (data: any) => void;
  onSaveSuccess?: (data: any) => void;
  transformRequest?: (values: any, baseRecord: any) => any;

  /**
   * ✅ TS FIX: allow external submit handler (like your DueDate PUT with TASDRECID)
   * If provided, GenericCardForm will call this instead of its internal PUT.
   */
  onSubmit?: (
    values: AnyFormValues,
    ctx: { baseRecord: any; id: string | number },
  ) => void | Promise<void>;
  Language?: number;
  isReadOnly?: boolean;
}

const API_BASE = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";

function extractRecord(resData: any) {
  return (
    resData?.data?.[0] ??
    resData?.data ??
    resData?.DATA?.[0] ??
    resData?.DATA ??
    resData?.result?.[0] ??
    resData?.result ??
    resData?.[0] ??
    resData ??
    null
  );
}

export default function GenericCardForm({
  title,
  icon: Icon = FileText,
  apiEndpoint,
  id,
  idParamName = "APPID",
  formFields,
  onDataLoaded,
  onSaveSuccess,
  transformRequest,
  onSubmit: onSubmitExternal, // ✅ added
  Language = 1,
  isReadOnly = false,
}: GenericCardFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [baseRecord, setBaseRecord] = useState<any>(null);

  const form = useForm<any>({ defaultValues: {}, mode: "onChange" });
  const { reset } = form;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE}${apiEndpoint}?${idParamName}=${id}&Language=${Language}`,
        );

        const record = extractRecord(res.data);
        if (!record) throw new Error("No record found");

        setBaseRecord(record);
        onDataLoaded?.(record);

        const normalized: AnyFormValues = {};
        formFields.forEach((f) => {
          let v = record?.[f.name];

          // Format ISO date strings (e.g., 1900-01-01T00:00:00)
          if (isDateString(v)) {
            v = formatDateKSA(v);
          }

          const isNullOrEmpty =
            v === null || v === undefined || String(v).trim() === "" || String(v) === "null";

          normalized[f.name] =
            f.type === "switch"
              ? v === 1 || v === true || v === "1"
              : isNullOrEmpty
                ? "-"
                : v;
        });

        reset(normalized);
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, Language]);

  const onSubmit = async (values: AnyFormValues): Promise<void> => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // ✅ If external handler is provided, use it and exit
      if (onSubmitExternal) {
        await onSubmitExternal(values, { baseRecord, id });
        toast.success("Saved successfully");
        setSuccess("Saved successfully");
        onSaveSuccess?.(values);
        return;
      }

      // ✅ fallback to old internal behavior
      let request: any = {
        ...(baseRecord ?? {}),
        ...values,
        [idParamName]: id,
        Language: Language,
      };

      formFields.forEach((f) => {
        if (f.type === "switch") {
          request[f.name] = !!values[f.name];
        }
        if (f.type === "number") {
          request[f.name] =
            values[f.name] === "" ? null : Number(values[f.name]);
        }
      });

      if (transformRequest) {
        request = transformRequest(request, baseRecord);
      }

      await axios.put(`${API_BASE}${apiEndpoint}/${id}`, request);

      toast.success("Saved successfully");
      setSuccess("Saved successfully");

      onSaveSuccess?.(request);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.data ||
        e?.message ||
        "Save failed";

      toast.error(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900">
        Loading...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <p className="text-xs text-slate-500">
            {idParamName}: {id}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 md:p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-4"
          >
            {formFields.map((cfg) => (
              <FormField<AnyFormValues>
                key={cfg.name}
                control={form.control}
                name={cfg.name}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-0.5">
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {cfg.label}
                    </FormLabel>

                    <div className="w-full">
                      <FormControl>
                        {cfg.type === "select" ? (
                          <Select
                            value={String(field.value ?? "")}
                            onValueChange={(val) => {
                              field.onChange(val);
                              cfg.onChange?.(val);
                            }}
                            disabled={saving || isReadOnly}
                          >
                            <SelectTrigger className={`h-9 text-sm w-full ${isReadOnly ? "disabled:opacity-100 disabled:text-slate-900 font-semibold dark:disabled:text-slate-50" : ""}`}>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {cfg.options?.map((o) => (
                                <SelectItem
                                  key={String(o.value)}
                                  value={String(o.value)}
                                >
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : cfg.type === "textarea" ? (
                          <Textarea
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              cfg.onChange?.(e.target.value);
                            }}
                            disabled={saving || isReadOnly}
                            placeholder={cfg.placeholder}
                            className={`min-h-17.5 resize-none text-sm ${isReadOnly ? "disabled:opacity-100 disabled:text-slate-900 font-semibold dark:disabled:text-slate-50" : ""}`}
                          />
                        ) : cfg.type === "switch" ? (
                          <div className="flex items-center h-9">
                            <Switch
                              checked={!!field.value}
                              onCheckedChange={(val) => {
                                field.onChange(val);
                                cfg.onChange?.(val);
                              }}
                              disabled={saving || isReadOnly}
                            />
                          </div>
                        ) : (
                          <Input
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              cfg.onChange?.(e.target.value);
                            }}
                            type={cfg.type === "number" ? "number" : "text"}
                            disabled={saving || isReadOnly}
                            placeholder={cfg.placeholder}
                            className={`h-9 text-sm ${isReadOnly ? "disabled:opacity-100 disabled:text-slate-900 font-semibold dark:disabled:text-slate-50" : ""}`}
                          />
                        )}
                      </FormControl>

                      <FormMessage className="mt-1 text-[11px]" />
                    </div>
                  </FormItem>
                )}
              />
            ))}

            {!isReadOnly && (
              <div className="col-span-full flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-cyan-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 transition-all duration-200 disabled:opacity-60 active:scale-95"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
