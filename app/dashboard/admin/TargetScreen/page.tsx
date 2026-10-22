"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Pin } from "lucide-react";

import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditModal } from "@/components/ui/editmodal";
import { Button } from "@/components/ui/button";
import DropZone from "./DropZone";

import { targetScreenData, targetScreenState } from "@/lib/redux/slices/adminConfigSlice";
import { ddOptions, ddOptionsParams } from "@/lib/redux/slices/ddValuesSlice";
import { targetGetData } from "../HandlingApi";
import { fetchLCAllocationGroupOptions } from "@/utils/dropDownApis";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/utils/axios";
import { BooleanStatus } from "@/components/ui/BooleanStatus";

const page = () => {
  const hasFetched = useRef(false);
  const dispatch = useDispatch();
  
  const ddValues = useSelector(ddOptionsParams);
  const targetDataState = useSelector(targetScreenState);

  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedRow, setSelectedRow] = useState<any>({});
  const [selectedGroup, setSelectedGroup] = useState<any[]>([]);

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
          className="cursor-pointer text-blue-600 flex justify-center"
          onClick={() => handleAllocationOpen(row.original)}
        >
          <Pin className="w-5 h-5" />
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
      cell: ({ row }: any) => {
        const val = row.original.TARGETSTARTDATE;
        if (!val) return "-";
        const date = new Date(val);
        return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
      },
    },
    {
      accessorKey: "TARGETENDDATE",
      header: "Target End Date",
      cell: ({ row }: any) => {
        const val = row.original.TARGETENDDATE;
        if (!val) return "-";
        const date = new Date(val);
        return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
      },
    },
    {
      accessorKey: "RECSTATUS",
      header: "Record Status",
      cell: ({ row }: any) => (
        <BooleanStatus value={row.original.RECSTATUS} trueText="Active" falseText="Inactive" />
      ),
    },
  ];

  const fields = useMemo(() => [
    {
      type: "section",
      title: "Target Details",
      fields: [
        { type: "input", name: "targetName1", label: "Target Name 1", required: true },
        { type: "input", name: "targetName2", label: "Target Name 2" },
        { type: "input", name: "targetName3", label: "Target Name 3" },
        { type: "number", name: "minTarget", label: "Minimum Target", rules: { max: 100 } },
        { type: "date", name: "targetStartDate", label: "Target Start Date" },
        { type: "date", name: "targetEndDate", label: "Target End Date" },
        { type: "switch", name: "targetStatus", label: "Record Status" },
      ]
    },
    {
      type: "section",
      title: "Other Information",
      fields: [
        { type: "textarea", name: "othDesc1", label: "Other Description 1" },
        { type: "textarea", name: "othDesc2", label: "Other Description 2" },
        { type: "textarea", name: "othDesc3", label: "Other Description 3" },
      ]
    }
  ], []);

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
    const targetData = await targetGetData(); 
    if (targetData && targetData.length > 0) {
      dispatch(targetScreenData(targetData));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getLcAllocationOptions = async () => {
    setLoading(true);
    const vbTypeOptions = await fetchLCAllocationGroupOptions();
    const vbToAdd = { LCALLOCATIONGROUPS: vbTypeOptions };
    dispatch(ddOptions(vbToAdd));
    setLoading(false);
  };

  useEffect(() => {
    dispatch(ddOptions({}));
    hasFetched.current = false;
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    const categories = ["LCALLOCATIONGROUPS"];
    categories.forEach((cat) => {
      if (!ddValues?.LCALLOCATIONGROUPS) {
        getLcAllocationOptions();
      }
    });

    hasFetched.current = true;
  }, [ddValues]);

  const deleteData = async (delData: any) => {
    try {
      const response = await axios.delete(
        `${process.env.HOST_API_KEY}/api/CnfgTargets/?TctRecid=${delData.TCTRECID}&UpdateBy=${user?.Userid}`
      );
      if (response.status === 200) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAllocationOpen = (rowId: any) => {
    getAllocatedGroups(rowId);
    setAllocationModalOpen(true);
    setSelectedRow(rowId);
  };

  const getAllocatedGroups = async (Id: any) => {
    try {
      const response = await axios.get(
        `${process.env.HOST_API_KEY}/api/CnfgTargetsGroup/get-CnfgTargetGroup`,
        {
          params: {
            TctRecid: Id.TCTRECID,
          },
        }
      );

      const { data } = response;

      const options = data.map((item: any) => ({
        id: item.VB_LCALLOCATIONGROUP.toString(),
        tctgrecid: item?.TCTGRECID,
        name: item.LCALLOCATIONGROUP,
        containerId: "Selected Group",
      }));

      const reducedArr = ddValues?.LCALLOCATIONGROUPS?.filter((curr: any) => {
        return !options.some((item: any) => item.id === curr.id);
      }) || [];

      setSelectedGroup([...reducedArr, ...options]);
    } catch (error) {
      console.error("Error fetching allocated groups:", error);
    }
  };

  const postApplicationData = async (dataToPost: any) => {
    // Add default tracking fields
    const today = new Date().toISOString();
    const updateBy = user?.Userid || "";

    const payload = {
      ...dataToPost,
      UPDATEBY: updateBy,
      UPDATEDATE: today,
      RECSTATUS: dataToPost.targetStatus !== undefined ? dataToPost.targetStatus : true,
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
      if (response.status === 200) {
        fetchData();
        setEditModalOpen(false);
        setSelectedRecord(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGroupSave = async (data: any) => {
    const optionData = {
      recStatus: true,
      tctRecid: data?.TCTRECID,
      updateBy: user?.Userid,
      updateDate: new Date().toISOString(),
      vb_LcAllocationGroup: data?.id,
    };

    const recId = selectedGroup?.filter((item: any) => {
      if (item?.tctgrecid !== undefined) return item;
    })[0];

    try {
      const response =
        recId?.tctgrecid !== undefined
          ? await axios.put(
              `${process.env.HOST_API_KEY}/api/CnfgTargetsGroup/${recId.tctgrecid}`,
              optionData
            )
          : await axios.post(
              `${process.env.HOST_API_KEY}/api/CnfgTargetsGroup/add-CnfgTargetsGroup`,
              optionData
            );
      if (response.status === 200) {
        fetchData();
        handleAllocationModalClose();
      }
    } catch (error) {
      console.error("Error saving group data:", error);
    }
  };

  const handleAllocationModalClose = () => {
    setAllocationModalOpen(false);
    setSelectedGroup([]);
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
            Add New Record
          </Button>
        }
        loading={loading}
        columns={tableColumns}
        initialData={targetDataState || []}
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

      <Dialog open={allocationModalOpen} onOpenChange={handleAllocationModalClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Allocate Group</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <DropZone
              dropDownValues={
                selectedGroup.length > 0
                  ? selectedGroup
                  : ddValues?.LCALLOCATIONGROUPS?.length > 0
                    ? ddValues?.LCALLOCATIONGROUPS
                    : []
              }
              handleSave={handleGroupSave}
              selectedRow={selectedRow}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default page;
