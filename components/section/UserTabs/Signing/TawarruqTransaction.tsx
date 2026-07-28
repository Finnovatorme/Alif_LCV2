"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { toast } from "sonner";
import { tawarruqTransactionGet } from "@/app/dashboard/UserTabScreen/HandlingTabsAPIs";
import { dashboardParams, languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

export type TawarruqTransactionApi = {
  TWTRECID?: number;
  APPID?: number;
  TRANSACTIONTYPE?: string;
  TRANSACTIONAMOUNT?: number;
  TRANSACTIONDATE?: string;
  REFERENCENUMBER?: string;
  RECSTATUS?: boolean;
  MAKER?: string;
  MAKEDATE?: string;
  [key: string]: any;
};

interface TawarruqTransactionRow extends TawarruqTransactionApi {
  id: number;
}

export default function TawarruqTransaction() {
  const router = useRouter();
  const appParams = useSelector(dashboardParams);
  const language = useSelector(languageParams);

  const [records, setRecords] = useState<TawarruqTransactionRow[]>([]);
  const [loading, setLoading] = useState(false);

  // safe number convert
  const toNum = (v: any, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fetchRecords = async () => {
    if (!appParams?.APPID) return;

    try {
      setLoading(true);

      const params = { APPID: appParams.APPID, language };
      const response = await tawarruqTransactionGet(params);

      console.log("TawarruqTransaction API:", response);

      const data = Array.isArray(response) ? response : [];

      const mapped: TawarruqTransactionRow[] = data.map((item: any) => ({
        ...item,
        id: toNum(item.TWTRECID),
        TRANSACTIONTYPE: item.TRANSACTIONTYPE ?? "-",
        REFERENCENUMBER: item.REFERENCENUMBER ?? "-",
        RECSTATUS: Boolean(item.RECSTATUS),
      }));

      setRecords(mapped);

      if (mapped.length > 0)
        toast.success("Tawarruq Transaction data fetched successfully");
      else toast.info("No Tawarruq Transaction data found");
    } catch (error) {
      console.error("Fetch error:", error);
      setRecords([]);
      toast.error("Failed to fetch Tawarruq Transaction data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appParams?.APPID) {
      fetchRecords();
    }
  }, [appParams?.APPID, language]);

  const columns: ColumnDef<TawarruqTransactionRow>[] = useMemo(
    () => [
      { id: "select", header: "Select" } as any,
      { id: "actions", header: "Actions" } as any,

      { accessorKey: "TOTTRECID", header: "Transaction Rec ID" },
      { accessorKey: "ASSETRECID", header: "Asset Rec ID" },
      { accessorKey: "PURCHASEASSETPRICE", header: "Purchase Asset Price" },
      { accessorKey: "UNITOFMEASURE", header: "Unit Of Measure" },
      {
        accessorKey: "PURCHASEASSETQUANTITY",
        header: "Purchase Asset Quantity",
      },
      {
        accessorKey: "PURCHASEASSETUNITPRICE",
        header: "Purchase Asset Unit Price",
      },
      { accessorKey: "SALESASSETPRICE", header: "Sales Asset Price" },
      { accessorKey: "SALESASSETQUANTITY", header: "Sales Asset Qantity" },

      {
        accessorKey: "RECSTATUS",
        header: "STATUS",
        // ✅ TS FIX: explicitly type the cell context
        cell: ({ row }: any) => (
          <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
        ),
      },
    ],
    [],
  );

  const keyMappings = {
    TOTTRECID: "Total Transaction Record ID",
    FINANCIERID: "Financier ID",
    APPID: "Application ID",
    SUPPLIERRECID: "Supplier Record ID",
    ASSETRECID: "Asset Record ID",
    PURCHASEASSETPRICE: "Purchase Asset Price",
    VB_UNITOFMEASURE: "Unit of Measure (VB)",
    UNITOFMEASURE: "Unit of Measure",
    PURCHASEASSETQUANTITY: "Purchase Asset Quantity",
    PURCHASEASSETUNITPRICE: "Purchase Asset Unit Price",
    SALESVENDORID: "Sales Vendor ID",
    SALESASSETPRICE: "Sales Asset Price",
    SALESASSETQUANTITY: "Sales Asset Quantity",
    SALESASSETUNITPRICE: "Sales Asset Unit Price",
    COMMODITYPURCHASEORDER: "Commodity Purchase Order",
    COMMODITYPURCHASEORDERDATE: "Commodity Purchase Order Date",
    PURCHASECONFIRMATION: "Purchase Confirmation",
    PURCHASECONFIRMATIONDATE: "Purchase Confirmation Date",
    COMMODITYSALEORDER: "Commodity Sale Order",
    COMMODITYSALEORDERDATE: "Commodity Sale Order Date",
    SALEORDERCONFIRMATION: "Sale Order Confirmation",
    SALEORDERCONFIRMATIONDATE: "Sale Order Confirmation Date",
    COMMODITYSOLD: "Commodity Sold",
    COMMODITYSOLDDATE: "Commodity Sold Date",
    AGENCYREFERENCENO: "Agency Reference Number",
    AGENCYUUID: "Agency UUID",
    TRANSACTIONREFERENCE: "Transaction Reference",
    BENEFICIARY: "Beneficiary",
    EXECUTIONDATE: "Execution Date",
    EXECUTIONTIME: "Execution Time",
    COMMISSION: "Commission",
    VB_CURRENCY_COMMISSION: "Commission Currency (VB)",
    CURRENCY_COMMISSION: "Commission Currency",
    SECRETTOKEN: "Secret Token",
    CERTIFICATENO: "Certificate Number",
    TRANFERSTATUSCODE: "Transfer Status Code",
    TRANSFERPROCESSID: "Transfer Process ID",
    SALESTATUS: "Sale Status",
    BUYORDERSTATUS: "Buy Order Status",
    BUYORDERDEALKEY: "Buy Order Deal Key",
    ALLOCATIONNUMBER: "Allocation Number",
    LOCATION: "Location",
    FEEAMOUNT: "Fee Amount",
    VB_CURRENCY_FEE: "Fee Currency (VB)",
    CURRENCY_FEE: "Fee Currency",
    OTHDESC1: "Other Description 1",
    OTHDESC2: "Other Description 2",
    OTHDESC3: "Other Description 3",
    OTHDESC4: "Other Description 4",
    UPDATEBY: "Updated By",
    UPDATEDATE: "Updated Date",
    RECSTATUS: "Record Status",
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Tawarruq Transaction</h1>
      </div>

      <ReusableDataTable<TawarruqTransactionRow>
        initialData={records}
        columns={columns}
        keyMappings={keyMappings}
        loading={loading}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </>
  );
}
