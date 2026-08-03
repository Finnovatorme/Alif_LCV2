"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import axios from "@/utils/axios";
import { hasDashabordParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { setSelectedUserId } from "@/lib/redux/slices/userTabSlice";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import FormComponent, { FormFieldConfig } from "@/components/FormComponent/FormComponent";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { vbValue, Option } from "@/utils/dropDownApis";

export interface ContractRow {
    id?: number | string;
    CIFID?: string | number;
    CUSTOMERTYPE?: string;
    CUSTOMERNAME?: string;
    NATIONALITY?: string;
    CUSTOMERCATEGORY?: string;
    BLACKLISTED?: string | boolean;
    APPID?: string | number;
    [key: string]: any;
}

export default function SearchContractsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const selectedLanguage = useSelector(languageParams);

    const [loading, setLoading] = useState(false);
    const [tableRows, setTableRows] = useState<ContractRow[]>([]);
    const [idTypeOptions, setIdTypeOptions] = useState<Option[]>([]);

    const hasFetched = useRef(false);

    const getVbValues = async (cat: string) => {
        const vbTypeOptions = await vbValue(cat, selectedLanguage);
        if (cat === "IDTYPE" && Array.isArray(vbTypeOptions)) {
            setIdTypeOptions(vbTypeOptions);
        }
    };

    useEffect(() => {
        hasFetched.current = false;
    }, [selectedLanguage]);

    useEffect(() => {
        const categories = ["IDTYPE"];
        if (!hasFetched.current) {
            categories.forEach((cat) => getVbValues(cat));
            hasFetched.current = true;
        }
    }, [selectedLanguage]);

    const searchFormFields: FormFieldConfig[] = [
        {
            name: "vb_IdType",
            label: "ID Type",
            type: "select",
            placeholder: "Select ID Type",
            options: idTypeOptions,
        },
        {
            name: "IdNumber",
            label: "ID Number",
            type: "text",
            placeholder: "ID Number",
        },
        {
            name: "CifId",
            label: "CIF ID",
            type: "text",
            placeholder: "CIF ID",
        },
        {
            name: "LoanId",
            label: "Loan ID",
            type: "text",
            placeholder: "Loan ID",
        },
        {
            name: "LoanReferenceNo",
            label: "Loan Reference Number",
            type: "text",
            placeholder: "Loan Reference Number",
        },
        {
            name: "AppId",
            label: "Application ID",
            type: "text",
            placeholder: "Application ID",
        },
        {
            name: "AssetRegNo",
            label: "Asset Registration Number",
            type: "text",
            placeholder: "Asset Registration Number",
        },
        {
            name: "AssetSerialNumber",
            label: "Asset Serial Number",
            type: "text",
            placeholder: "Asset Serial Number",
        },
        {
            name: "MobileNo",
            label: "Mobile",
            type: "text",
            placeholder: "Mobile",
        },
        {
            name: "Language",
            label: "Language",
            type: "select",
            placeholder: "Select Language",
            options: [
                { label: "English", value: 1 },
                { label: "Arabic", value: 2 },
            ],
        },
    ];

    const handleNavigateToDetails = (row: ContractRow) => {
        const cifId = row.CIFID || row.CifId || row.id || 1;
        const lang = selectedLanguage === "ar" ? 2 : 1;
        dispatch(hasDashabordParams({ ...row, CIFID: cifId, language: lang }));
        dispatch(setSelectedUserId(Number(cifId)));
        localStorage.setItem("searchContractParams", JSON.stringify({ CIFID: cifId, language: lang, ...row }));
        router.push("/dashboard/SmartView/SearchContracts/ContractDetails");
    };

    const tableColumns: ColumnDef<ContractRow>[] = [
        {
            accessorKey: "CIFID",
            header: "CIF ID",
            cell: ({ row }) => row.original.CIFID || "-",
        },
        {
            accessorKey: "CUSTOMERTYPE",
            header: "Customer Type",
            cell: ({ row }) => row.original.CUSTOMERTYPE || "Individual",
        },
        {
            accessorKey: "CUSTOMERNAME",
            header: "Customer Name",
            cell: ({ row }) => row.original.CUSTOMERNAME || "-",
        },
        {
            accessorKey: "NATIONALITY",
            header: "Nationality",
            cell: ({ row }) => row.original.NATIONALITY || "Saudi",
        },
        {
            accessorKey: "CUSTOMERCATEGORY",
            header: "Customer Category",
            cell: ({ row }) => row.original.CUSTOMERCATEGORY || "Standard",
        },
        {
            accessorKey: "BLACKLISTED",
            header: "Black Listed",
            cell: ({ row }) => {
                const val = row.original.BLACKLISTED;
                return val === true || val === "Yes" || val === "Y" ? (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Yes
                    </span>
                ) : (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        No
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <Button
                    size="sm"
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                    onClick={() => handleNavigateToDetails(row.original)}
                >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                </Button>
            ),
        },
    ];

    const handleSearch = async (formValues: Record<string, any>) => {
        setLoading(true);
        try {
            const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
            const params = Object.fromEntries(
                Object.entries(formValues).filter(([, v]) => v !== null && v !== undefined && v !== "")
            );

            if (!params.Language) {
                params.Language = selectedLanguage === "ar" ? 2 : 1;
            }

            const response = await axios.get(
                `${hostUrl}/api/Customer/get-SearchContract`,
                { params }
            );

            const data = response.data;
            if (Array.isArray(data)) {
                setTableRows(data);
                if (data.length > 0) {
                    toast.success("Data has been found successfully");
                } else {
                    toast.error("No data found for the given criteria.");
                }
            } else {
                setTableRows([]);
                toast.error("No data found for the given criteria.");
            }
        } catch (err) {
            console.error("Search contract error:", err);
            toast.error("Failed to fetch search results");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 min-h-screen font-sans">
            {/* Search Contract Form using FormComponent */}
            <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(15,142,221,0.15)]">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] p-6 lg:p-8 border border-white/40 dark:border-gray-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                    <FormComponent
                        formName="Search Contract"
                        numOfColumns={4}
                        formFields={searchFormFields}
                        hideAddNewButton={true}
                        submitButtonText="Search"
                        disableUntilFilled={true}
                        responseBody={handleSearch}
                    />
                </div>
            </div>

            {/* Results Data Table Container */}
            <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-800 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(15,142,221,0.15)]">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[23px] p-6 lg:p-8 border border-white/40 dark:border-gray-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                    <ReusableDataTable
                        initialData={tableRows}
                        columns={tableColumns}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
}