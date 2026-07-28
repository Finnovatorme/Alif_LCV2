"use client";
import React, { useEffect, useState } from "react";
import { FormFeilds } from "@/components/FormComponent/FormFeilds";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import axios from "@/utils/axios";
import { ColumnDef } from "@tanstack/react-table";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Form, useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormProvider } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import z from "zod";
import { FieldConfig } from "@/types/field.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "@/components/ui/field";

interface SchemeDueDay {
  id: number;
  schemeId: number;
  schemeName: string;
  ruleId: number | null;
  ruleName: string | null;
  dueDayCode: string;
  dueDay: string;
  cutoffDays: number;
  status: string;
  RECID: number;
  DUEDAY: number;
  DUEDAYCUTOFFDAYS: number;
  Othdesc1: string;
  Othdesc2: string;
  Othdesc3: string;
}

const page = () => {
  const { t } = useTranslation("SchemeDueDay");
  const [records, setRecords] = useState<SchemeDueDay[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SchemeDueDay | null>(
    null
  );
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const fileSchema = z
    .instanceof(File)
    .refine((f) => f.size <= 5_000_000, "Max 5MB")
    .refine(
      (f) => ["image/png", "image/jpeg"].includes(f.type),
      "Only PNG/JPG"
    );

  const formSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(8, { message: "Password needs 8+ chars" }),
    age: z.number().nullable(),
    price: z.number().nullable(),
    bio: z.string().optional(),
    gender: z.enum(["male", "female"]),
    department: z.string(),
    agree: z.boolean().refine(Boolean),
    isActive: z.boolean(),
    dob: z.string(),
    dob1: z.date(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      age: null,
      price: null,
      bio: "",
      gender: "female",
      department: "",
      agree: false,
      isActive: false,
      dob: "",
      dob1: new Date(),
    },
  });

  const fetchRecords = async () => {
    try {
      const response = await axios.get(
        `${process.env.BS_API_KEY}/api/CnfgSchmeDueDay`
      );

      const mapped =
        response.data?.map((item: any) => ({
          id: item.RECID,
          RECID: item.RECID,
          schemeId: item.SCHEMEID,
          schemeName: item.SCHEMENAME,
          ruleId: item.RULEID,
          ruleName: item.RULENAME,
          dueDayCode: item.DUEDAY_VBCODE,
          dueDay: item.DUEDAY,
          cutoffDays: item.DUEDAYCUTOFFDAYS,
          status: item.RECSTATUS ? "Active" : "Inactive",
          DUEDAY: item.DUEDAY,
          DUEDAYCUTOFFDAYS: item.DUEDAYCUTOFFDAYS,
          Othdesc1: item.Othdesc1,
          Othdesc2: item.Othdesc2,
          Othdesc3: item.Othdesc3,
        })) || [];

      setRecords(mapped);
    } catch (error) {
      console.error("API Error:", error);
      setRecords([]);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const columns: ColumnDef<SchemeDueDay>[] = [
    { id: "actions", header: "Actions" },
    { accessorKey: "schemeName", header: "Scheme Name" },
    { accessorKey: "dueDay", header: "Due Day" },
    { accessorKey: "dueDayCode", header: "Due Code" },
    { accessorKey: "cutoffDays", header: "Cutoff Days" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const value = row.original.status;

        return (
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full 
            ${
              value === "Active"
                ? "bg-green-500 text-white border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }
          `}
          >
            {value}
          </span>
        );
      },
    },
  ];

  const fields: FieldConfig[] = [
    {
      name: "username",
      label: "Username",
      type: "input",
    },
    { name: "password", label: "Password", type: "password" },
    { name: "age", label: "Age", type: "number" },
    { name: "price", label: "Price", type: "number" },
    { name: "bio", label: "Bio", type: "textarea" },

    {
      name: "gender",
      label: "Gender",
      type: "radio",
      options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ],
    },

    {
      name: "department",
      label: "Department",
      type: "select",
      placeholder: "Please select",
      options: [
        { label: "Engineering", value: "eng" },
        { label: "Design", value: "design" },
      ],
    },

    { name: "agree", label: "Agree to terms", type: "checkbox" },
    { name: "isActive", label: "Active", type: "switch" },
    { name: "dob", label: "Date of Birth", type: "date" },
    { name: "dob1", label: "Date of Birth", type: "calender" },
  ];

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("values: ", values);
      form.reset();
    } catch (e) {}
  };

  return (
    <div>
      <div className="bg-[#fcfcfc] dark:bg-[#111] m-4 p-4 rounded-lg">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="gap-6 m-4 p-6 bg-white dark:bg-[#111] rounded-xl shadow-lg transition-colors">
              <div className={"grid gap-4 grid-cols-3"}>
                {fields.map((f, index) => (
                  <Field key={f.name}>
                    <FormField
                      key={f.name}
                      control={form.control}
                      name={f.name as keyof FormValues}
                      render={({ field }) => (
                        <FormItem>
                          {FormFeilds(f, field)}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Field>
                ))}
              </div>
              <div className="flex justify-end">
                <Button size="sm">Submit</Button>
              </div>
            </Card>
          </form>
        </FormProvider>

        <ReusableDataTable<SchemeDueDay>
          initialData={records}
          columns={columns}
          onUpdate={async (row) => {
            setSelectedRecord(row);
          }}
          onDelete={async (row) => {
            if (confirm(`Delete record "${row.schemeName}"?`)) {
              await axios.delete(`/api/CnfgSchmeDueDay/${row.id}`);
              fetchRecords();
            }
          }}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>
    </div>
  );
};

export default page;
