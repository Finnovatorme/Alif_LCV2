"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { clsx } from "clsx";
import { useDispatch } from "react-redux";
import { gridActionsRedux } from "@/lib/redux/slices/formComponentSlice";
import useLocales from "@/hooks/useLocals";
import { useAuth } from "@/hooks/useAuth";
import { FormFeilds } from "./FormFeilds";
import { Form, FormField, FormItem } from "@/components/ui/form";

type AnyObj = Record<string, any>;

type FieldOption = { label: string; value: any; depend?: any };

export type FormFieldConfig = {
  type:
  | "text"
  | "number"
  | "email"
  | "password"
  | "date"
  | "select"
  | "multiline"
  | "switch"
  | "id"
  | "amount"
  | "textarea";
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  options?: FieldOption[];
  dependent?: string;
  placeholder?: string;
  rules?: AnyObj;
  [k: string]: any;
};

type Props = {
  numOfColumns?: number | null;
  formFields?: FormFieldConfig[];
  formName?: string;
  viewForm?: boolean;
  prefilled?: any;
  responseBody?: (payload: any) => void | Promise<void>;
  editMode?: boolean;
  postByDefault?: string[];
  resetForm?: boolean;
  addedValues?: AnyObj;
  submitBtn?: boolean;
  submitButtonText?: string;
  hideAddNewButton?: boolean;
};

function formatDateInput(val: any) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  // prevent 1900 issue
  if (yyyy <= 1901) return "";
  return `${yyyy}-${mm}-${dd}`;
}

export default function FormComponent({
  numOfColumns = 1,
  formFields = [],
  formName = "",
  viewForm = false,
  prefilled,
  responseBody,
  editMode = false,
  postByDefault = [],
  resetForm = false,
  addedValues = {},
  submitBtn = true,
  submitButtonText = "Save",
  hideAddNewButton = false,
}: Props) {
  const dispatch = useDispatch();
  const { translate } = useLocales();
  const { user: authUser } = useAuth();

  const user = useMemo(
    () => ({
      id:
        authUser?.id ??
        authUser?.USERID ??
        authUser?.Userid ??
        authUser?.userId ??
        null,
      Userid:
        authUser?.Userid ??
        authUser?.USERID ??
        authUser?.userId ??
        authUser?.id ??
        null,
    }),
    [authUser],
  );

  // normalize names once
  const normalizedFields = useMemo(
    () =>
      (formFields ?? []).map((f) => ({
        ...f,
        name: String(f.name).toUpperCase(),
      })),
    [formFields],
  );

  // default values
  const defaultValues = useMemo(() => {
    const dv: AnyObj = {};
    normalizedFields.forEach((f) => {
      if (["number", "select", "id", "amount"].includes(f.type))
        dv[f.name] = null;
      else if (f.type === "switch") dv[f.name] = false;
      else dv[f.name] = "";
    });
    return dv;
  }, [normalizedFields]);

  const form = useForm({
    defaultValues,
    mode: "onChange",
  });
  const { control, handleSubmit, reset, setValue, watch } = form;

  // prefilled mapping
  useEffect(() => {
    if (!prefilled) return;

    const base = Array.isArray(prefilled) ? prefilled?.[0] : prefilled;
    if (!base || typeof base !== "object") return;

    reset(defaultValues);

    Object.entries(base).forEach(([k, v]) => {
      const key = String(k).toUpperCase();
      if (!(key in defaultValues)) return;

      if (key === "DOB") {
        setValue(key, formatDateInput(v));
      } else {
        setValue(key, v ?? null);
      }
    });
  }, [prefilled, reset, defaultValues, setValue]);

  useEffect(() => {
    if (!resetForm) return;
    dispatch(gridActionsRedux({ data: {}, type: "edit" }));
    reset(defaultValues);
  }, [resetForm, dispatch, reset, defaultValues]);

  const colsClass = clsx("grid gap-4", {
    "grid-cols-1": numOfColumns === 1,
    "grid-cols-2": numOfColumns === 2,
    "grid-cols-3": numOfColumns === 3,
    "grid-cols-4": numOfColumns === 4,
    "grid-cols-5": numOfColumns === 5,
  });

  const onSubmit = async (data: AnyObj) => {
    // postByDefault (your mapping)
    postByDefault.forEach((key) => {
      switch (key) {
        case "Updateby":
          data["UPDATEBY"] = user?.Userid;
          break;
        case "Updatedate":
          data["UPDATEDATE"] = new Date().toISOString();
          break;
        case "Checker":
          data["CHECKER"] = user?.Userid;
          break;
        case "Checkdate":
          data["CHECKDATE"] = new Date().toISOString();
          break;
        case "Recstatus":
          data["RECSTATUS"] = true;
          break;
        case "Maker":
          data["MAKER"] = user?.Userid;
          break;
        case "Makedate":
          data["MAKEDATE"] = new Date().toISOString();
          break;
        default:
          break;
      }
    });

    const payload = editMode ? data : { ...data, ...addedValues };
    await responseBody?.(payload);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold">{formName}</div>
        {!viewForm && !hideAddNewButton && (
          <button type="button" className="rounded-lg border px-4 py-2 text-sm">
            {translate("locale.global.add_new_records")}
          </button>
        )}
      </div>

      {/* Form */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-slate-950">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={colsClass}>
              {normalizedFields.map((cfg) => {
                // ✅ dependent select filtering here
                let options = cfg.options ?? [];
                if (cfg.type === "select" && cfg.dependent) {
                  const depVal = watch(cfg.dependent.toUpperCase());
                  options = options.filter((o: any) => o?.depend === depVal);
                }

                const finalCfg = {
                  ...cfg,
                  options,
                };

                return (
                  <div key={cfg.name} className="space-y-1">
                    <FormField
                      control={control}
                      name={cfg.name}
                      rules={{
                        required: cfg.required ? `${cfg.label || cfg.name} is required` : false,
                        ...cfg.rules,
                      }}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          {FormFeilds(
                            { ...finalCfg, error: fieldState.error?.message } as any,
                            field
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                );
              })}
            </div>

            {submitBtn && (
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
                >
                  {submitButtonText}
                </button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
