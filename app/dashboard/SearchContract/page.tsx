"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { X, Search, Check, ChevronsUpDown, Menu } from "lucide-react";

import axios from "@/utils/axios";
import {
  fetchAppIdOptions,
  fetchProductOptions,
  fetchSubProductOptions,
  vbValue,
  type Option,
} from "@/utils/dropDownApis";
import { ddOptions } from "@/lib/redux/slices/ddValuesSlice";
import { hasDashabordParams } from "@/lib/redux/slices/dashboardApplSlice";
import { setSelectedUserId } from "@/lib/redux/slices/userTabSlice";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// ─── Combobox (matches FormFeilds.tsx select pattern) ────────────────────────

interface ComboboxProps {
  label: string;
  options?: Option[];
  value: Option | null;
  onChange: (value: Option | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

function Combobox({
  label,
  options = [],
  value,
  onChange,
  disabled = false,
  placeholder = "Select...",
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-black dark:text-gray-400">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between pl-3 h-9 text-sm font-normal"
          >
            <div className="flex items-center gap-2 truncate">
              <Menu className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate text-left">
                {value ? (
                  value.label
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="text-muted-foreground italic">
                  -- Clear --
                </span>
              </CommandItem>
              {options.map((opt) => (
                <CommandItem
                  key={String(opt.value)}
                  value={String(opt.label)}
                  onSelect={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type RootState = {
  ddValues: { data: Record<string, Option[]> };
  dashboardAppl: { language: number };
};

type AppDispatch = ReturnType<typeof useDispatch>;

interface SearchRow {
  id: number;
  APPID?: string | number;
  APPLICATIONTYPE?: string;
  CIFID?: string | number;
  CUSTOMERNAME?: string;
  IDNUMBER?: string | number;
  PRODUCTNAME?: string;
  [key: string]: unknown;
}

interface SearchQueries {
  appId: string | number | null;
  fromDate: string | null;
  toDate: string | null;
  vb_ApplicationType: string | number | null;
  productCode: string | number | null;
  subProductCode: string | number | null;
  idNumber: string | null;
  customerName: string | null;
  vb_ApplicationStatus: string | number | null;
  branchId: number | null;
  stageName: string | null;
  vb_FinancePurpose: string | number | null;
  vb_SalesChannel: string | number | null;
  vb_SalesDivision: string | number | null;
  vb_SourceEntity: string | number | null;
  salesPersonUserId: string | null;
  referenceUserId: string | null;
  promoCode: string | null;
  referalCode: string | null;
  pendingWithUserId: string | null;
}

const DISALLOW_REGEX_MAP: Record<string, RegExp> = {
  special: /[^\p{L}\p{N}\s]/gu,
  spaces: /\s/g,
  letters: /\p{L}/gu,
  numbers: /\p{N}/gu,
};

function getRegisterRules(props: { disallow?: string | string[] }) {
  const disallowList = Array.isArray(props.disallow)
    ? props.disallow
    : props.disallow
      ? [props.disallow]
      : [];

  const regexes = disallowList
    .map((k) => DISALLOW_REGEX_MAP[k])
    .filter(Boolean);

  return {
    validate: regexes.length
      ? (value: string) =>
          regexes.every((r) => {
            r.lastIndex = 0;
            return !r.test(value);
          }) || "Invalid characters entered"
      : undefined,
  };
}

const tableColumns: ColumnDef<SearchRow>[] = [
  { id: "select", header: "Select" },
  { id: "actions", header: "Actions" },
  { accessorKey: "APPID", header: "App ID" },
  { accessorKey: "APPLICATIONTYPE", header: "Application Type" },
  { accessorKey: "CIFID", header: "CIF ID" },
  { accessorKey: "CUSTOMERNAME", header: "Customer Name" },
  { accessorKey: "IDNUMBER", header: "ID Number" },
  { accessorKey: "PRODUCTNAME", header: "Product Name" },
];

const defaultSearchQueries: SearchQueries = {
  appId: null,
  fromDate: null,
  toDate: null,
  vb_ApplicationType: null,
  productCode: null,
  subProductCode: null,
  idNumber: null,
  customerName: null,
  vb_ApplicationStatus: null,
  branchId: null,
  stageName: null,
  vb_FinancePurpose: null,
  vb_SalesChannel: null,
  vb_SalesDivision: null,
  vb_SourceEntity: null,
  salesPersonUserId: null,
  referenceUserId: null,
  promoCode: null,
  referalCode: null,
  pendingWithUserId: null,
};

export default function Page() {
  const hasFetched = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const language = useSelector(
    (state: RootState) => state.dashboardAppl.language,
  );
  const ddValues = useSelector((state: RootState) => state.ddValues.data);

  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [tableRows, setTableRows] = useState<SearchRow[]>([]);
  const [searchQueries, setSearchQueries] =
    useState<SearchQueries>(defaultSearchQueries);

  // Dropdown selected values
  const [selectedAppId, setSelectedAppId] = useState<Option | null>(null);
  const [selectedAppType, setSelectedAppType] = useState<Option | null>(null);
  const [selectedApplicationStatus, setSelectedApplicationStatus] =
    useState<Option | null>(null);
  const [selectedProductCode, setSelectedProductCode] = useState<Option | null>(
    null,
  );
  const [selectedSubproductCode, setSelectedSubproductCode] =
    useState<Option | null>(null);
  const [selectedFinancePurpose, setSelectedFinancePurpose] =
    useState<Option | null>(null);
  const [selectedSalesChannel, setSelectedSalesChannel] =
    useState<Option | null>(null);
  const [selectedSalesDivision, setSelectedSalesDivision] =
    useState<Option | null>(null);
  const [selectedSourceEntity, setSelectedSourceEntity] =
    useState<Option | null>(null);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, string>>();

  const getVbValues = async (cat: string) => {
    const opts = await vbValue(cat);
    dispatch(ddOptions({ [cat]: opts }));
  };

  const getApplicationIdValues = async () => {
    setFieldsLoading(true);
    const opts = await fetchAppIdOptions();
    dispatch(ddOptions({ APPID: opts }));
    setFieldsLoading(false);
  };

  const getProductValues = async () => {
    setFieldsLoading(true);
    const opts = await fetchProductOptions();
    dispatch(ddOptions({ PRODUCT: opts }));
    setFieldsLoading(false);
  };

  const getSubProductValues = async () => {
    setFieldsLoading(true);
    const opts = await fetchSubProductOptions();
    dispatch(ddOptions({ SUBPRODUCT: opts }));
    setFieldsLoading(false);
  };

  useEffect(() => {
    if (hasFetched.current) return;

    const categories = [
      "APPLICATIONTYPE",
      "APPLICATIONSTATUS",
      "FINANCEPURPOSE",
      "SALESCHANNEL",
      "SALESDIVISION",
      "SOURCEENTITY",
    ];

    categories.forEach((cat) => {
      if (!ddValues?.[cat]) getVbValues(cat);
    });
    if (!ddValues?.APPID) getApplicationIdValues();
    if (!ddValues?.PRODUCT) getProductValues();
    if (!ddValues?.SUBPRODUCT) getSubProductValues();

    hasFetched.current = true;
  }, []);

  const handleNavigateToAppGrid = (row: SearchRow) => {
    const appId = Number(row.APPID);
    dispatch(setSelectedUserId(appId));
    dispatch(hasDashabordParams({ ...row, hideButton: false }));
    localStorage.setItem("selectedAppId", String(appId));
    router.push("/dashboard/UserTabScreen");
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      const filteredBody = Object.fromEntries(
        Object.entries(searchQueries).filter(([, v]) => v !== null && v !== ""),
      );

      setTableRows([]);

      const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
      const response = await axios.post(
        `${baseUrl}/api/GetSmartViewApplications`,
        {
          ...filteredBody,
          Language: language,
        },
      );

      const rows: SearchRow[] = (
        response.data as Record<string, unknown>[]
      ).map((item, index) => ({ ...item, id: index + 1 }) as SearchRow);

      setTableRows(rows);

      if (rows.length > 0) {
        toast.success("Data has been found successfully");
      } else {
        toast.error("No data found for the given criteria.");
      }
    } catch (error) {
      console.error("Error during search:", error);
      toast.error("Error fetching search results. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const clearSearchQueries = () => {
    setSelectedAppId(null);
    setSelectedAppType(null);
    setSelectedApplicationStatus(null);
    setSelectedProductCode(null);
    setSelectedSubproductCode(null);
    setSelectedFinancePurpose(null);
    setSelectedSalesChannel(null);
    setSelectedSalesDivision(null);
    setSelectedSourceEntity(null);
    setSearchQueries(defaultSearchQueries);
    setTableRows([]);
    reset();
  };
  const filteredSubProducts: Option[] = (ddValues?.SUBPRODUCT ?? []).filter(
    (item) => selectedProductCode?.value === item.depend,
  );
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Page Title */}
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
        Search Contract
      </h1>

      {/* Filter Card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl"
      >
        {/* Gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        <div className="p-6 md:p-8 pt-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* App ID */}
            <Combobox
              label="Application ID"
              options={ddValues?.APPID}
              value={selectedAppId}
              disabled={fieldsLoading}
              onChange={(val) => {
                setSelectedAppId(val);
                setSearchQueries((q) => ({ ...q, appId: val?.value ?? null }));
              }}
            />

            <Combobox
              label="Application Type"
              options={ddValues?.APPLICATIONTYPE}
              value={selectedAppType}
              disabled={fieldsLoading}
              onChange={(val) => {
                setSelectedAppType(val);
                setSearchQueries((q) => ({
                  ...q,
                  vb_ApplicationType: val?.value ?? null,
                }));
              }}
            />

            {/* Application Status */}
            <Combobox
              label="Application Status"
              options={ddValues?.APPLICATIONSTATUS}
              value={selectedApplicationStatus}
              disabled={fieldsLoading}
              onChange={(val) => {
                setSelectedApplicationStatus(val);
                setSearchQueries((q) => ({
                  ...q,
                  vb_ApplicationStatus: val?.value ?? null,
                }));
              }}
            />

            {/* ID Number */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                ID Number
              </label>
              <Input
                size={undefined}
                disabled={fieldsLoading}
                placeholder="ID Number"
                {...register(
                  "idNumber",
                  getRegisterRules({
                    disallow: ["special", "letters", "spaces"],
                  }),
                )}
                onChange={(e) => {
                  setValue("idNumber", e.target.value, {
                    shouldValidate: true,
                  });
                  setSearchQueries((q) => ({ ...q, idNumber: e.target.value }));
                }}
                value={searchQueries.idNumber ?? ""}
              />
              {errors?.idNumber && (
                <span className="text-xs text-red-500">
                  {errors.idNumber.message}
                </span>
              )}
            </div>

            {/* Customer Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                Customer Name
              </label>
              <Input
                size={undefined}
                disabled={fieldsLoading}
                placeholder="Customer Name"
                {...register(
                  "customerName",
                  getRegisterRules({ disallow: ["special", "numbers"] }),
                )}
                onChange={(e) => {
                  setValue("customerName", e.target.value, {
                    shouldValidate: true,
                  });
                  setSearchQueries((q) => ({
                    ...q,
                    customerName: e.target.value,
                  }));
                }}
                value={searchQueries.customerName ?? ""}
              />
              {errors?.customerName && (
                <span className="text-xs text-red-500">
                  {errors.customerName.message}
                </span>
              )}
            </div>

            {/* From Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                From Date
              </label>
              <Input
                size={undefined}
                type="date"
                disabled={fieldsLoading}
                onChange={(e) =>
                  setSearchQueries((q) => ({
                    ...q,
                    fromDate: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  }))
                }
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                To Date
              </label>
              <Input
                size={undefined}
                type="date"
                disabled={fieldsLoading}
                onChange={(e) =>
                  setSearchQueries((q) => ({
                    ...q,
                    toDate: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  }))
                }
              />
            </div>

            {/* Product Code */}
            <Combobox
              label="Product Code"
              options={ddValues?.PRODUCT}
              value={selectedProductCode}
              disabled={fieldsLoading}
              onChange={(val) => {
                setSelectedProductCode(val);
                setSelectedSubproductCode(null);
                setSearchQueries((q) => ({
                  ...q,
                  productCode: val?.value ?? null,
                  subProductCode: null,
                }));
              }}
            />

            {/* Sub Product Code */}
            <Combobox
              label="Sub Product Code"
              options={filteredSubProducts}
              value={selectedSubproductCode}
              disabled={fieldsLoading || !selectedProductCode}
              onChange={(val) => {
                setSelectedSubproductCode(val);
                setSearchQueries((q) => ({
                  ...q,
                  subProductCode: val?.value ?? null,
                }));
              }}
            />

            {/* Branch ID */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                Branch ID
              </label>
              <Input
                size={undefined}
                type="number"
                disabled={fieldsLoading}
                placeholder="Branch ID"
                onChange={(e) =>
                  setSearchQueries((q) => ({
                    ...q,
                    branchId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                value={searchQueries.branchId ?? ""}
              />
            </div>

            {/* Stage Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                Stage Name
              </label>
              <Input
                size={undefined}
                disabled={fieldsLoading}
                placeholder="Stage Name"
                {...register(
                  "stageName",
                  getRegisterRules({ disallow: ["special"] }),
                )}
                onChange={(e) => {
                  setValue("stageName", e.target.value, {
                    shouldValidate: true,
                  });
                  setSearchQueries((q) => ({
                    ...q,
                    stageName: e.target.value,
                  }));
                }}
                value={searchQueries.stageName ?? ""}
              />
              {errors?.stageName && (
                <span className="text-xs text-red-500">
                  {errors.stageName.message}
                </span>
              )}
            </div>

            {/* Reference User ID */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                Reference User ID
              </label>
              <Input
                size={undefined}
                disabled={fieldsLoading}
                placeholder="Reference User ID"
                {...register(
                  "referenceUserId",
                  getRegisterRules({ disallow: ["special", "spaces"] }),
                )}
                onChange={(e) => {
                  setValue("referenceUserId", e.target.value, {
                    shouldValidate: true,
                  });
                  setSearchQueries((q) => ({
                    ...q,
                    referenceUserId: e.target.value,
                  }));
                }}
                value={searchQueries.referenceUserId ?? ""}
              />
              {errors?.referenceUserId && (
                <span className="text-xs text-red-500">
                  {errors.referenceUserId.message}
                </span>
              )}
            </div>

            {/* Pending With User ID */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                Pending With User ID
              </label>
              <Input
                size={undefined}
                disabled={fieldsLoading}
                placeholder="Pending With User ID"
                {...register(
                  "pendingWithUserId",
                  getRegisterRules({
                    disallow: ["special", "letters", "spaces"],
                  }),
                )}
                onChange={(e) => {
                  setValue("pendingWithUserId", e.target.value, {
                    shouldValidate: true,
                  });
                  setSearchQueries((q) => ({
                    ...q,
                    pendingWithUserId: e.target.value,
                  }));
                }}
                value={searchQueries.pendingWithUserId ?? ""}
              />
              {errors?.pendingWithUserId && (
                <span className="text-xs text-red-500">
                  {errors.pendingWithUserId.message}
                </span>
              )}
            </div>

            {/* Finance Purpose */}
            <Combobox
              label="Finance Purpose"
              options={ddValues?.FINANCEPURPOSE}
              value={selectedFinancePurpose}
              disabled={fieldsLoading}
              onChange={(val) => {
                setSelectedFinancePurpose(val);
                setSearchQueries((q) => ({
                  ...q,
                  vb_FinancePurpose: val?.value ?? null,
                }));
              }}
            />

            {/* Sales Channel */}
            <Combobox
              label="Sales Channel"
              options={ddValues?.SALESCHANNEL}
              value={selectedSalesChannel}
              disabled={fieldsLoading}
              onChange={(val) => {
                setSelectedSalesChannel(val);
                setSearchQueries((q) => ({
                  ...q,
                  vb_SalesChannel: val?.value ?? null,
                }));
              }}
            />

            {/* Sales Division */}
            <Combobox
              label="Sales Division"
              options={ddValues?.SALESDIVISION}
              value={selectedSalesDivision}
              disabled={fieldsLoading}
              onChange={(val) => {
                setSelectedSalesDivision(val);
                setSearchQueries((q) => ({
                  ...q,
                  vb_SalesDivision: val?.value ?? null,
                }));
              }}
            />

            {/* Source Entity */}
            <Combobox
              label="Source Entity"
              options={ddValues?.SOURCEENTITY}
              value={selectedSourceEntity}
              disabled={fieldsLoading}
              onChange={(val) => {
                setSelectedSourceEntity(val);
                setSearchQueries((q) => ({
                  ...q,
                  vb_SourceEntity: val?.value ?? null,
                }));
              }}
            />

            {/* Sales Person User ID */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                Sales Person User ID
              </label>
              <Input
                size={undefined}
                disabled={fieldsLoading}
                placeholder="Sales Person User ID"
                {...register(
                  "salesPersonUserId",
                  getRegisterRules({ disallow: ["special"] }),
                )}
                onChange={(e) => {
                  setValue("salesPersonUserId", e.target.value, {
                    shouldValidate: true,
                  });
                  setSearchQueries((q) => ({
                    ...q,
                    salesPersonUserId: e.target.value,
                  }));
                }}
                value={searchQueries.salesPersonUserId ?? ""}
              />
              {errors?.salesPersonUserId && (
                <span className="text-xs text-red-500">
                  {errors.salesPersonUserId.message}
                </span>
              )}
            </div>

            {/* Promo Code */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                Promo Code
              </label>
              <Input
                size={undefined}
                disabled={fieldsLoading}
                placeholder="Promo Code"
                {...register(
                  "promoCode",
                  getRegisterRules({ disallow: ["spaces"] }),
                )}
                onChange={(e) => {
                  setValue("promoCode", e.target.value, {
                    shouldValidate: true,
                  });
                  setSearchQueries((q) => ({
                    ...q,
                    promoCode: e.target.value,
                  }));
                }}
                value={searchQueries.promoCode ?? ""}
              />
              {errors?.promoCode && (
                <span className="text-xs text-red-500">
                  {errors.promoCode.message}
                </span>
              )}
            </div>

            {/* Referral Code */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-black dark:text-gray-400">
                Referral Code
              </label>
              <Input
                size={undefined}
                disabled={fieldsLoading}
                placeholder="Referral Code"
                {...register(
                  "referalCode",
                  getRegisterRules({ disallow: ["spaces"] }),
                )}
                onChange={(e) => {
                  setValue("referalCode", e.target.value, {
                    shouldValidate: true,
                  });
                  setSearchQueries((q) => ({
                    ...q,
                    referalCode: e.target.value,
                  }));
                }}
                value={searchQueries.referalCode ?? ""}
              />
              {errors?.referalCode && (
                <span className="text-xs text-red-500">
                  {errors.referalCode.message}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={clearSearchQueries}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
            <Button
              type="submit"
              disabled={fieldsLoading || loading}
              className="flex items-center gap-2 bg-linear-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 shadow-md"
            >
              <Search className="w-4 h-4" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
      </form>

      {/* Results Table */}
      <ReusableDataTable<SearchRow>
        title="Search Results"
        initialData={tableRows}
        columns={tableColumns}
        loading={loading}
        showAccumulate
        onAccumulate={(row) => handleNavigateToAppGrid(row)}
        keyMappings={{
          APPID: "App ID",
          APPLICATIONTYPE: "Application Type",
          CIFID: "CIF ID",
          CUSTOMERNAME: "Customer Name",
          IDNUMBER: "ID Number",
          PRODUCTNAME: "Product Name",
        }}
      />
    </div>
  );
}
