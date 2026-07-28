"use client";

import React, { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useForm, Controller } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ClearAllDialog } from "@/components/ui/clear-all-dialog";
import { FormFeilds } from "@/components/FormComponent/FormFeilds";

import { cn } from "@/lib/utils";
import type {
  AnyFieldConfig,
  FieldConfig,
  SectionFieldConfig,
} from "@/types/field.types";

type AnyFormValues = Record<string, any>;
type ModalFieldItem = AnyFieldConfig;

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  fields: ModalFieldItem[];
  onSubmit: (data: any) => void | Promise<void>;
  title?: string;
  description?: string;
}

/* ----------------------------- type guards ----------------------------- */
const isSection = (item: ModalFieldItem): item is SectionFieldConfig =>
  item?.type === "section" && Array.isArray((item as any).fields);

function getFormattedPageName(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const pageName = segments.length
    ? segments[segments.length - 1].replace(/-/g, " ")
    : "Page";
  return pageName.charAt(0).toUpperCase() + pageName.slice(1);
}

/** Try to find any reasonable id field for "edit" mode */
function getAnyId(data: any) {
  if (!data) return null;
  return (
    data?.APPCIFID ??
    data?.APPID ??
    data?.RECID ??
    data?.ID ??
    data?.id ??
    data?.TASORECID ??
    null
  );
}

/** Normalize default values so switches/checkboxes don’t break on reset */
function normalizeDefaultValues(
  fields: ModalFieldItem[],
  data: any,
): AnyFormValues {
  const out: AnyFormValues = {};

  const setForField = (f: FieldConfig) => {
    const v = data?.[f.name];

    if (f.type === "switch") {
      out[f.name] = v === true || v === 1 || v === "1";
      return;
    }

    // keep numbers as-is; empty -> ""
    if (f.type === "number") {
      out[f.name] = v ?? "";
      return;
    }

    out[f.name] = v ?? "";
  };

  for (const item of fields) {
    if (isSection(item)) {
      for (const f of item.fields as FieldConfig[]) setForField(f);
    } else {
      setForField(item as FieldConfig);
    }
  }

  return out;
}

export function EditModal({
  isOpen,
  onClose,
  data,
  fields,
  onSubmit,
  title,
  description,
}: EditModalProps) {
  const pathname = usePathname() || "/";
  const formattedPageName = getFormattedPageName(pathname);

  const anyId = useMemo(() => getAnyId(data), [data]);
  const isEdit = Boolean(anyId);

  const form = useForm<AnyFormValues>({
    defaultValues: {},
    mode: "onChange",
    shouldUnregister: false,
  });

  const { handleSubmit, control, reset, formState } = form;

  useEffect(() => {
    if (!isOpen) return;

    // ✅ reset with normalized values so switches work
    reset(normalizeDefaultValues(fields, data ?? {}));
  }, [isOpen, data, reset, fields]);

  const isLargeForm = useMemo(() => {
    let count = 0;
    fields.forEach((item) => {
      if (isSection(item)) count += item.fields.length;
      else count += 1;
    });
    return count > 12;
  }, [fields]);

  const formKey = useMemo(() => String(anyId ?? "new"), [anyId]);
  const formId = "edit-modal-form";

  const handleClearFields = () => {
    const emptyValues: AnyFormValues = {};

    const clearField = (f: FieldConfig) => {
      if (f.type === "switch") emptyValues[f.name] = false;
      else emptyValues[f.name] = "";
    };

    for (const item of fields) {
      if (isSection(item)) {
        (item.fields as FieldConfig[]).forEach(clearField);
      } else {
        clearField(item as FieldConfig);
      }
    }

    reset(emptyValues);
  };

  /** renders a single field using your existing FormFeilds renderer */
  const renderOneField = (fieldConfig: FieldConfig) => (
    <Controller
      key={fieldConfig.name}
      name={fieldConfig.name}
      control={control}
      rules={{
        validate: (value) => {
          if (!fieldConfig.required) return true;

          const empty =
            value === undefined ||
            value === null ||
            value === "" ||
            (typeof value === "number" && Number.isNaN(value));

          return empty ? `${fieldConfig.label} is required` : true;
        },
      }}
      render={({ field, fieldState }) => (
        <div className="min-w-0 space-y-1.5">
          {FormFeilds(
            {
              ...fieldConfig,
              error: fieldState.error?.message,
              disabled: !!fieldConfig.disabled || !!fieldConfig.readOnly,
              readOnly: !!fieldConfig.readOnly,
            } as any,
            field as any,
          )}
        </div>
      )}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "p-0 rounded-2xl bg-white dark:bg-gray-950 shadow-2xl flex flex-col overflow-hidden",
          isLargeForm
            ? "w-[98vw] h-[92vh] sm:max-w-[95vw] lg:max-w-[98vw]"
            : "w-full max-w-fit md:min-w-[750px] lg:min-w-[850px] min-h-[400px] h-fit max-h-[92vh]"
        )}
      >
        {/* Global gradient bar from DialogContent is at the top */}

        <div className="px-8 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {title ?? `${isEdit ? "Edit" : "Add"} ${formattedPageName}`}
          </DialogTitle>

          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description ??
              "Please fill in the details below. Required fields are marked with *."}
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-5 scrollbar-thin">
          <Form {...form} key={formKey}>
            <form id={formId} onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                {fields.map((item, index) => {
                  // ✅ SECTION
                  if (isSection(item)) {
                    return (
                      <div
                        key={`section-${item.title ?? index}`}
                        className="space-y-4"
                      >
                        {item.title && (
                          <h3
                            className="
                              text-base sm:text-lg font-bold
                              text-gray-900 dark:text-gray-200
                              pl-3 border-l-4 border-blue-500/70 dark:border-blue-600/60
                              mb-3
                            "
                          >
                            {item.title}
                          </h3>
                        )}

                        <div className={cn(
                          "grid gap-x-6 gap-y-4 sm:gap-y-5",
                          isLargeForm
                            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        )}>
                          {(item.fields as FieldConfig[]).map((f) =>
                            renderOneField(f),
                          )}
                        </div>
                      </div>
                    );
                  }

                  // ✅ SINGLE FIELD (non-section)
                  const f = item as FieldConfig;

                  return (
                    <div
                      key={`field-${f.name}-${index}`}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4"
                    >
                      {renderOneField(f)}
                    </div>
                  );
                })}
              </div>
            </form>
          </Form>
        </div>

        <div
          className="
            px-8 py-4 border-t border-gray-200 dark:border-gray-800
            flex justify-end gap-4 shrink-0
            bg-white dark:bg-gray-950
          "
        >
          <ClearAllDialog
            onConfirm={handleClearFields}
            title="Clear All Fields"
            description="Are you sure you want to clear all fields?"
            trigger={
              <Button
                type="button"
                variant="outline"
                className="text-red-600 border-red-400 hover:bg-red-50"
              >
                Clear All
              </Button>
            }
          />

          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            type="submit"
            form={formId}
            disabled={formState.isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-27.5"
          >
            {formState.isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// "use client";
// import React, { useEffect, useMemo } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { usePathname } from "next/navigation";
// import { useForm, Controller } from "react-hook-form";
// import { FormFeilds } from "@/components/FormComponent/FormFeilds";
// import { Form } from "@/components/ui/form";

// interface EditModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: any;
//   fields: any[];
//   onSubmit: (data: any) => void;
//   title?: string;
//   description?: string;
// }

// export function EditModal({
//   isOpen,
//   onClose,
//   data,
//   fields,
//   onSubmit,
//   title,
//   description,
// }: EditModalProps) {
//   const pathname = usePathname() || "/";
//   const segments = pathname.split("/").filter(Boolean);
//   const pageName = segments.length
//     ? segments[segments.length - 1].replace(/-/g, " ")
//     : "Page";
//   const formattedPageName =
//     pageName.charAt(0).toUpperCase() + pageName.slice(1);

//   const isEdit = Boolean(data?.APPCIFID || data?.id);

//   const form = useForm({
//     defaultValues: {},
//     mode: "onChange",
//     shouldUnregister: false,
//   });

//   const { handleSubmit, control, reset, formState } = form;

//   useEffect(() => {
//     if (!isOpen) return;
//     reset(data ?? {});
//   }, [isOpen, data, reset]);

//   const formKey = useMemo(
//     () => String(data?.APPCIFID ?? data?.id ?? "new"),
//     [data],
//   );

//   const formId = "edit-modal-form";

//   const handleClearAll = () => {
//     if (window.confirm("Are you sure you want to clear all fields?")) {
//       reset({});
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent
//         className={`
//           p-0 overflow-hidden
//           max-w-[95vw] sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl
//           rounded-2xl
//           border border-gray-200/70 dark:border-gray-800/60
//           bg-white dark:bg-gray-950
//           shadow-xl shadow-gray-400/20 dark:shadow-black/60
//         `}
//       >
//         {/* Top accent bar */}
//         <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-t-2xl" />

//         <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200/80 dark:border-gray-800/70">
//           <DialogTitle className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
//             {title ?? `${isEdit ? "Edit" : "Add"} ${formattedPageName}`}
//           </DialogTitle>
//           <DialogDescription className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
//             {description ??
//               "Fill in the details below. Required fields are marked."}
//           </DialogDescription>
//         </DialogHeader>

//         <Form {...form} key={formKey}>
//           <form id={formId} onSubmit={handleSubmit(onSubmit)}>
//             <div className="max-h-[74vh] overflow-y-auto px-5 sm:px-6 py-5 scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-gray-400/70 dark:scrollbar-thumb-gray-600/80 scrollbar-track-gray-100/50 dark:scrollbar-track-gray-900/30 scrollbar-thumb-hover:gray-500 dark:scrollbar-thumb-hover:gray-500 scrollbar-track-rounded-md scroll-smooth">
//               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
//                 {fields?.map((fieldConfig) => (
//                   <div
//                     key={fieldConfig.name}
//                     className={`
//                       rounded-xl border
//                       border-gray-200/60 dark:border-gray-800/50
//                       bg-white/80 dark:bg-gray-900/70
//                       p-4 shadow-sm
//                       transition-all duration-150
//                       hover:shadow-md hover:border-blue-400/30 dark:hover:border-blue-500/30
//                       focus-within:ring-1 focus-within:ring-blue-400/40 dark:focus-within:ring-blue-500/30
//                     `}
//                   >
//                     <Controller
//                       name={fieldConfig.name}
//                       control={control}
//                       render={({ field }) => (
//                         <div className="flex flex-col gap-1.5">
//                           {FormFeilds(
//                             {
//                               ...fieldConfig,
//                               disabled:
//                                 !!fieldConfig.disabled ||
//                                 !!fieldConfig.readOnly,
//                               readOnly: !!fieldConfig.readOnly,
//                             },
//                             field,
//                           )}
//                         </div>
//                       )}
//                     />

//                     {(fieldConfig.readOnly || fieldConfig.disabled) && (
//                       <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
//                         {fieldConfig.readOnly ? "Read-only" : "Disabled"}
//                       </p>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </form>
//         </Form>

//         <DialogFooter className="px-5 sm:px-6 py-4 border-t border-gray-200/80 dark:border-gray-800/70 bg-gray-50/70 dark:bg-gray-950/40 flex flex-wrap gap-3 justify-end items-center">
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={handleClearAll}
//             className="
//               border-red-200 text-red-700 hover:bg-red-50/80
//               dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30
//             "
//           >
//             Clear All
//           </Button>

//           <Button
//             type="button"
//             variant="outline"
//             onClick={onClose}
//             className="
//               border-gray-300 dark:border-gray-700
//               hover:bg-gray-100 dark:hover:bg-gray-800
//               text-gray-700 dark:text-gray-300
//             "
//           >
//             Cancel
//           </Button>

//           <Button
//             type="submit"
//             form={formId}
//             disabled={formState.isSubmitting}
//             className={`
//               min-w-[110px]
//               bg-gradient-to-r from-blue-600 to-indigo-600
//               hover:from-blue-700 hover:to-indigo-700
//               text-white shadow-md shadow-blue-600/25
//               transition-all duration-200
//               disabled:opacity-60
//             `}
//           >
//             {formState.isSubmitting ? (
//               <span className="flex items-center gap-2">
//                 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//                   />
//                 </svg>
//                 Saving...
//               </span>
//             ) : isEdit ? (
//               "Update"
//             ) : (
//               "Create"
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// "use client";

// import React, { useEffect, useMemo } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { usePathname } from "next/navigation";
// import { useForm, Controller } from "react-hook-form";
// import { FormFeilds } from "@/components/FormComponent/FormFeilds";
// import { Form } from "@/components/ui/form";

// interface EditModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: any;
//   fields: any[];
//   onSubmit: (data: any) => void;
//   title?: string;
//   description?: string;
// }

// export function EditModal({
//   isOpen,
//   onClose,
//   data,
//   fields,
//   onSubmit,
//   title,
//   description,
// }: EditModalProps) {
//   const pathname = usePathname() || "/";
//   const segments = pathname.split("/").filter(Boolean);

//   const pageName = segments.length
//     ? segments[segments.length - 1].replace(/-/g, " ")
//     : "Page";

//   const formattedPageName =
//     pageName.charAt(0).toUpperCase() + pageName.slice(1);

//   const isEdit = Boolean(data?.APPCIFID || data?.id);

//   const form = useForm({
//     defaultValues: {},
//     mode: "onChange",
//     shouldUnregister: false,
//   });

//   const { handleSubmit, control, reset, formState } = form;

//   useEffect(() => {
//     if (!isOpen) return;
//     reset(data ?? {});
//   }, [isOpen, data, reset]);

//   const formKey = useMemo(
//     () => String(data?.APPCIFID ?? data?.id ?? "new"),
//     [data],
//   );

//   const formId = "edit-modal-form";

//   // ✅ CLEAR ALL FUNCTION
//   const handleClearAll = () => {
//     const emptyValues = fields?.reduce((acc: any, field: any) => {
//       acc[field.name] = "";
//       return acc;
//     }, {});
//     reset(emptyValues);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent
//         className="
//         p-0
//         max-w-[95vw] sm:max-w-4xl lg:max-w-5xl
//         h-[85vh]
//         flex flex-col
//         rounded-2xl
//         border border-gray-200 dark:border-gray-800
//         bg-white dark:bg-gray-950
//         shadow-xl
//       "
//       >
//         {/* HEADER */}
//         <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 shrink-0">
//           <DialogTitle className="text-xl font-semibold">
//             {title ?? `${isEdit ? "Edit" : "Add"} ${formattedPageName}`}
//           </DialogTitle>
//           <DialogDescription className="text-sm text-gray-500 mt-1">
//             {description ?? "Fill in the details below."}
//           </DialogDescription>
//         </div>

//         {/* BODY (SCROLLABLE) */}
//         <div className="flex-1 overflow-y-auto">
//           <Form {...form} key={formKey}>
//             <form
//               id={formId}
//               onSubmit={handleSubmit(onSubmit)}
//               className="px-6 py-5"
//             >
//               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
//                 {fields?.map((fieldConfig) => (
//                   <div
//                     key={fieldConfig.name}
//                     className="rounded-lg border p-3 shadow-sm bg-white dark:bg-gray-900"
//                   >
//                     <Controller
//                       name={fieldConfig.name}
//                       control={control}
//                       render={({ field }) => (
//                         <div className="flex flex-col gap-2">
//                           {FormFeilds(
//                             {
//                               ...fieldConfig,
//                               disabled:
//                                 !!fieldConfig.disabled ||
//                                 !!fieldConfig.readOnly,
//                               readOnly: !!fieldConfig.readOnly,
//                             },
//                             field,
//                           )}
//                         </div>
//                       )}
//                     />
//                   </div>
//                 ))}
//               </div>
//             </form>
//           </Form>
//         </div>

//         {/* FOOTER */}
//         <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 shrink-0 flex justify-end gap-3">
//           <Button
//             type="button"
//             variant="ghost"
//             onClick={() => {
//               const emptyValues = fields?.reduce((acc: any, field: any) => {
//                 acc[field.name] = "";
//                 return acc;
//               }, {});
//               reset(emptyValues);
//             }}
//             className="text-red-600"
//           >
//             Clear All
//           </Button>

//           <Button type="button" variant="outline" onClick={onClose}>
//             Cancel
//           </Button>

//           <Button
//             type="submit"
//             form={formId}
//             disabled={formState.isSubmitting}
//             className="bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             {formState.isSubmitting ? "Saving..." : "Save"}
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
