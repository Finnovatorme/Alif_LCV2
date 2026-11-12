"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";
import { toast } from "sonner";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { EditModal } from "@/components/ui/editmodal";
import { Button } from "@/components/ui/button";

import { targetScreenData, targetScreenState } from "@/lib/redux/slices/adminConfigSlice";
import { ddOptions, ddOptionsParams } from "@/lib/redux/slices/ddValuesSlice";
import { targetGetData } from "../HandlingApi";
import { fetchLCAllocationGroupOptions } from "@/utils/dropDownApis";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/utils/axios";
import { BooleanStatus } from "@/components/ui/BooleanStatus";
import { formatDateKSA, parseDateToISO } from "@/utils/helpers";

const page = () => {
  const router = useRouter();
  const hasFetched = useRef(false);
  const dispatch = useDispatch();
  
  const ddValues = useSelector(ddOptionsParams);
  const targetDataState = useSelector(targetScreenState);

  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<any[]>([]);
  const [editData, setEditData] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const handleAllocationOpen = (row: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedTargetForAllocation", JSON.stringify(row));
    }
    router.push(
      `/dashboard/admin/TargetScreen/AllocationGroup?tctRecid=${row.TCTRECID}&targetName=${encodeURIComponent(row.TARGETNAME1 || "")}`
    );
  };

  const tableColumns = [
    {
      id: "actions",
      header: "Actions",
    },
    {
      id: "LCALLOCATIONGROUP",
      accessorFn: () => "pin",
      header: "LC Allocation Group",
      cell: ({ row }: any) => (
        <div
          className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors flex justify-center group/pin"
          onClick={() => handleAllocationOpen(row.original)}
          title="Manage Allocation Groups"
        >
          <Pin className="w-5 h-5 group-hover/pin:scale-110 transition-transform" />
        </div>
      ),
    },
    {
      accessorKey: "TARGETNAME1",
      header: "Target Name",
    },
    {
      accessorKey: "MINTARGET",
      header: "Minimum Target",
    },
    {
      accessorKey: "TARGETSTARTDATE",
      header: "Target Start Date",
      cell: ({ row }: any) => formatDateKSA(row.original.TARGETSTARTDATE),
    },
    {
      accessorKey: "TARGETENDDATE",
      header: "Target End Date",
      cell: ({ row }: any) => formatDateKSA(row.original.TARGETENDDATE),
    },
    {
      accessorKey: "RECSTATUS",
      header: "Record Status",
      cell: ({ row }: any) => (
        <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
      ),
    },
  ];

  const fields = useMemo(() => {
    const targetDetailsFields: any[] = [
      { type: "input", name: "targetName1", label: "Target Name 1", required: true },
      { type: "input", name: "targetName2", label: "Target Name 2" },
      { type: "input", name: "targetName3", label: "Target Name 3" },
      {
        type: "number",
        name: "minTarget",
        label: "Minimum Target",
        placeholder: "0 - 100",
        min: 0,
        max: 100,
        rules: { min: 0, max: 100 },
      },
      { type: "date", name: "targetStartDate", label: "Target Start Date" },
      { type: "date", name: "targetEndDate", label: "Target End Date" },
    ];

    if (editData) {
      targetDetailsFields.push({ type: "switch", name: "targetStatus", label: "Record Status" });
    }

    return [
      {
        type: "section",
        title: "Target Details",
        fields: targetDetailsFields,
      },
      {
        type: "section",
        title: "Other Information",
        fields: [
          { type: "textarea", name: "othDesc1", label: "Other Description 1" },
          { type: "textarea", name: "othDesc2", label: "Other Description 2" },
          { type: "textarea", name: "othDesc3", label: "Other Description 3" },
        ],
      },
    ];
  }, [editData]);

  const keyMappings = {
    TCTRECID: "TCT Rec ID",
    TARGETNAME1: "Target Name in English",
    TARGETNAME2: "Target Name in Arabic",
    TARGETNAME3: "Target Name in Other Language",
    TARGETSTARTDATE: "Target Start Date",
    TARGETENDDATE: "Target End Date",
    MINTARGET: "Minimum Target",
    OTHDESC1: "Other Description 1",
    OTHDESC2: "Other Description 2",
    OTHDESC3: "Other Description 3",
    OTHDESC4: "Other Description 4",
    MAKER: "Maker",
    MAKEDATE: "Make Date",
    UPDATEBY: "Update By",
    UPDATEDATE: "Update Date",
    checker: "Checker",
    checkDate: "Check Date",
    RECSTATUS: "Record Status",
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const targetData = await targetGetData();
      const list = Array.isArray(targetData) ? targetData : [];
      setTableData([...list]);
      dispatch(targetScreenData([...list]));
    } catch (error) {
      console.error("Error in fetchData:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasFetchedData = useRef(false);

  useEffect(() => {
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    fetchData();
  }, []);

  // Sync if targetDataState changes externally
  useEffect(() => {
    if (targetDataState && Array.isArray(targetDataState) && targetDataState.length > 0) {
      setTableData(targetDataState);
    }
  }, [targetDataState]);

  const getLcAllocationOptions = async () => {
    const vbTypeOptions = await fetchLCAllocationGroupOptions();
    const vbToAdd = { LCALLOCATIONGROUPS: vbTypeOptions };
    dispatch(ddOptions(vbToAdd));
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    if (!ddValues?.LCALLOCATIONGROUPS) {
      getLcAllocationOptions();
    }
  }, [ddValues]);

  const deleteData = async (delData: any) => {
    try {
      const response = await axios.delete(
        `${process.env.HOST_API_KEY}/api/CnfgTargets/?TctRecid=${delData.TCTRECID}&UpdateBy=${user?.Userid}`
      );
      if (
        response.status === 200 ||
        response.status === 204 ||
        response.data?.succeeded !== false
      ) {
        // Optimistically update the record status to INACTIVE immediately
        setTableData((prev) =>
          prev.map((item) =>
            item.TCTRECID === delData.TCTRECID
              ? { ...item, RECSTATUS: false }
              : item
          )
        );
        toast.success("Target deleted successfully!");
        setTimeout(() => {
          fetchData();
        }, 400);
      }
    } catch (e: any) {
      console.error("Delete target error:", e);
      toast.error(
        e?.response?.data?.responsedescription ||
          e?.message ||
          "Failed to delete target"
      );
    }
  };

  const postApplicationData = async (dataToPost: any) => {
    const today = new Date().toISOString();
    const updateBy = user?.Userid || user?.userId || "1";

    let cleanMinTarget =
      dataToPost.minTarget !== null &&
      dataToPost.minTarget !== undefined &&
      dataToPost.minTarget !== ""
        ? Number(dataToPost.minTarget)
        : null;

    if (cleanMinTarget !== null && !isNaN(cleanMinTarget)) {
      if (cleanMinTarget < 0) cleanMinTarget = 0;
      if (cleanMinTarget > 100) cleanMinTarget = 100;
    }

    const payload = {
      ...dataToPost,
      minTarget: cleanMinTarget,
      MINTARGET: cleanMinTarget,
      targetStartDate: dataToPost.targetStartDate ? parseDateToISO(dataToPost.targetStartDate, dataToPost.targetStartDate) : null,
      targetEndDate: dataToPost.targetEndDate ? parseDateToISO(dataToPost.targetEndDate, dataToPost.targetEndDate) : null,
      UPDATEBY: updateBy,
      UPDATEDATE: today,
      RECSTATUS: editData ? (dataToPost.targetStatus !== undefined ? Boolean(dataToPost.targetStatus) : true) : true,
    };

    if (!editData) {
      payload.MAKER = updateBy;
      payload.MAKEDATE = today;
    }

    try {
      const response = editData
        ? await axios.put(
            `${process.env.HOST_API_KEY}/api/CnfgTargets/${selectedRecord?.TCTRECID}`,
            payload
          )
        : await axios.post(`${process.env.HOST_API_KEY}/api/CnfgTargets/add-CnfgTargets`, payload);

      if (
        response.status === 200 ||
        response.status === 201 ||
        response.data?.succeeded !== false
      ) {
        toast.success(editData ? "Target updated successfully!" : "Target added successfully!");
        setEditModalOpen(false);
        setSelectedRecord(null);
        await fetchData();
      }
    } catch (e: any) {
      console.error("Save target error:", e);
      toast.error(
        e?.response?.data?.responsedescription ||
          e?.message ||
          "Failed to save target"
      );
    }
  };

  // Map backend record to form structure
  const toForm = (row: any) => {
    return {
      TCTRECID: row.TCTRECID,
      targetName1: row.TARGETNAME1 || "",
      targetName2: row.TARGETNAME2 || "",
      targetName3: row.TARGETNAME3 || "",
      minTarget: row.MINTARGET || null,
      targetStartDate: row.TARGETSTARTDATE ? new Date(row.TARGETSTARTDATE).toISOString().slice(0, 10) : "",
      targetEndDate: row.TARGETENDDATE ? new Date(row.TARGETENDDATE).toISOString().slice(0, 10) : "",
      targetStatus: row.RECSTATUS !== undefined ? Boolean(row.RECSTATUS) : true,
      othDesc1: row.OTHDESC1 || "",
      othDesc2: row.OTHDESC2 || "",
      othDesc3: row.OTHDESC3 || "",
    };
  };

  const openAdd = () => {
    setSelectedRecord({
      targetName1: "",
      targetName2: "",
      targetName3: "",
      minTarget: null,
      targetStartDate: "",
      targetEndDate: "",
      targetStatus: true,
      othDesc1: "",
      othDesc2: "",
      othDesc3: "",
    });
    setEditData(false);
    setFormKey((k) => k + 1);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <ReusableDataTable
        title="Targets"
        headerActions={
          <Button onClick={openAdd} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
            Add Target
          </Button>
        }
        loading={loading}
        columns={tableColumns}
        initialData={tableData}
        keyMappings={keyMappings}
        onUpdate={(row: any) => {
           setEditData(true);
           setSelectedRecord(toForm(row));
           setFormKey((k) => k + 1);
           setEditModalOpen(true);
        }}
        onDelete={(row: any) => {
           deleteData(row);
        }}
      />

      <EditModal
        key={formKey}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        fields={fields as any}
        onSubmit={postApplicationData}
        title={editData ? "Edit Target" : "Add Target"}
        description="Fill the target fields and save."
      />
    </div>
  );
};

export default page;
