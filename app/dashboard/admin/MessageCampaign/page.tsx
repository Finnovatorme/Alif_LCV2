"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ReusableDataTable } from "@/components/FormComponent/DataGrid";
import { EditModal } from "@/components/ui/editmodal";
import { Button } from "@/components/ui/button";
import { BooleanStatus } from "@/components/ui/BooleanStatus";
import { vbValue, Option } from "@/utils/dropDownApis";
import { useAuth } from "@/hooks/useAuth";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import axios from "@/utils/axios";
import { toast } from "sonner";

export default function MessageCampaignPage() {
    const selectedLanguage = useSelector(languageParams);
    const { user } = useAuth() as { user: any };

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<any[]>([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [formKey, setFormKey] = useState(0);

    const [dropdowns, setDropdowns] = useState<{
        NOTIFICATIONTYPE: Option[];
        UICHANNEL: Option[];
        LCALLOCATIONGROUP: Option[];
        SCHEDULETYPE: Option[];
        SCHEDULEFREQUENCY: Option[];
        SCHEDULEPERIOD: Option[];
        DAYOFWEEK: Option[];
        DAYOFMONTH: Option[];
    }>({
        NOTIFICATIONTYPE: [],
        UICHANNEL: [],
        LCALLOCATIONGROUP: [],
        SCHEDULETYPE: [],
        SCHEDULEFREQUENCY: [],
        SCHEDULEPERIOD: [],
        DAYOFWEEK: [],
        DAYOFMONTH: [],
    });

    const language = selectedLanguage === "ar" ? 2 : 1;

    // Fetch dropdown options without Redux
    useEffect(() => {
        const fetchAllDropdowns = async () => {
            const categories = [
                "NOTIFICATIONTYPE",
                "UICHANNEL",
                "LCALLOCATIONGROUP",
                "SCHEDULETYPE",
                "SCHEDULEFREQUENCY",
                "SCHEDULEPERIOD",
                "DAYOFWEEK",
                "DAYOFMONTH",
            ];

            const results = await Promise.all(
                categories.map(async (cat) => {
                    try {
                        const opts = await vbValue(cat, language === 2 ? "2" : "1");
                        return { cat, opts };
                    } catch (e) {
                        console.error(`Error fetching ${cat} options:`, e);
                        return { cat, opts: [] };
                    }
                })
            );

            const newDd: any = {};
            results.forEach(({ cat, opts }) => {
                newDd[cat] = opts;
            });

            setDropdowns((prev) => ({ ...prev, ...newDd }));
        };

        fetchAllDropdowns();
    }, [language]);

    // Fetch Schedule Notification Grid Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const hostUrl = process.env.HOST_API_KEY;
            const response = await axios.get(
                `${hostUrl}/api/MstScheduleNotification/get-ScheduleNotification`,
                {
                    params: { language },
                }
            );

            if (Array.isArray(response.data?.data)) {
                setRows(response.data?.data?.map((item: any, index: number) => ({ ...item, id: index + 1 })));
            } else {
                setRows([]);
            }
        } catch (error) {
            console.error("Error fetching schedule notification data:", error);
            toast.error("Failed to fetch records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [language]);

    // Table Columns
    const tableColumns = [
        {
            id: "actions",
            header: "Actions",
        },
        {
            accessorKey: "LCALLOCATIONGROUP",
            header: "LC Allocation Group",
            cell: ({ row }: any) => row.original.LCALLOCATIONGROUP || "-",
        },
        {
            accessorKey: "SCHEDULEPERIOD",
            header: "Schedule Period",
            cell: ({ row }: any) => row.original.SCHEDULEPERIOD || "-",
        },
        {
            accessorKey: "SCHEDULESTARTDATE",
            header: "Schedule Start Date",
            cell: ({ row }: any) => {
                const val = row.original.SCHEDULESTARTDATE;
                if (!val) return "-";
                const date = new Date(val);
                return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
            },
        },
        {
            accessorKey: "SCHEDULEENDDATE",
            header: "Schedule End Date",
            cell: ({ row }: any) => {
                const val = row.original.SCHEDULEENDDATE;
                if (!val) return "-";
                const date = new Date(val);
                return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
            },
        },
        {
            accessorKey: "SCHEDULETIME",
            header: "Schedule Time",
            cell: ({ row }: any) => {
                const scheduleTime = row.original.SCHEDULETIME;
                if (!scheduleTime) return "-";
                try {
                    const validTime = new Date(scheduleTime);
                    if (isNaN(validTime.getTime())) return String(scheduleTime);
                    return new Intl.DateTimeFormat("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    }).format(validTime);
                } catch (e) {
                    return String(scheduleTime);
                }
            },
        },
    ];

    const keyMappings = {
        TMSNRECID: "TMSN REC ID",
        NOTIFICATIONID: "Notification ID",
        NOTIFICATIONTYPE: "Notification Type",
        LCALLOCATIONGROUP: "LC Allocation Group",
        SCHEDULETYPE: "Schedule Type",
        SCHEDULEFREQUENCY: "Schedule Frequency",
        SCHEDULEPERIOD: "Schedule Period",
        SCHEDULESTARTDATE: "Schedule Start Date",
        SCHEDULEENDDATE: "Schedule End Date",
        SCHEDULETIME: "Schedule Time",
        SCHEDULESTARTTIME: "Schedule Start Time",
        SCHEDULEENDTIME: "Schedule End Time",
        DAYOFWEEK_EXCLUDE1: "Day of Week Exclude 1",
        DAYOFWEEK_EXCLUDE2: "Day of Week Exclude 2",
        DAYOFWEEK_EXCLUDE3: "Day of Week Exclude 3",
        DAYOFMONTH_EXCLUDE1: "Day of Month Exclude 1",
        DAYOFMONTH_EXCLUDE2: "Day of Month Exclude 2",
        DAYOFMONTH_EXCLUDE3: "Day of Month Exclude 3",
        RULEID: "Rule ID",
        MAKER: "Maker",
        MAKEDATE: "Make Date",
        UPDATEBY: "Update By",
        UPDATEDATE: "Update Date",
    };

    // Form Fields Configuration
    const fields = useMemo(
        () => [
            {
                type: "section",
                title: "Notification Details",
                fields: [
                    {
                        type: "select",
                        name: "RULEID",
                        label: "Rule ID",
                        options: dropdowns.UICHANNEL,
                    },
                    {
                        type: "select",
                        name: "NOTIFICATIONID",
                        label: "Notification ID",
                        required: true,
                        options: dropdowns.NOTIFICATIONTYPE,
                    },
                    {
                        type: "select",
                        name: "VB_LCALLOCATIONGROUP",
                        label: "LC Allocation Group",
                        required: true,
                        options: dropdowns.LCALLOCATIONGROUP,
                    },
                ],
            },
            {
                type: "section",
                title: "Schedule Configuration",
                fields: [
                    {
                        type: "select",
                        name: "VB_SCHEDULETYPE",
                        label: "Schedule Type",
                        required: true,
                        options: dropdowns.SCHEDULETYPE,
                    },
                    {
                        type: "select",
                        name: "VB_SCHEDULEFREQUENCY",
                        label: "Schedule Frequency",
                        required: true,
                        options: dropdowns.SCHEDULEFREQUENCY,
                    },
                    {
                        type: "select",
                        name: "VB_SCHEDULEPERIOD",
                        label: "Schedule Period",
                        required: true,
                        options: dropdowns.SCHEDULEPERIOD,
                    },
                    {
                        type: "date",
                        name: "SCHEDULESTARTDATE",
                        label: "Schedule Start Date",
                        required: true,
                    },
                    {
                        type: "date",
                        name: "SCHEDULEENDDATE",
                        label: "Schedule End Date",
                    },
                    {
                        type: "time",
                        name: "SCHEDULESTARTTIME",
                        label: "Schedule Start Time",
                        required: true,
                    },
                    {
                        type: "time",
                        name: "SCHEDULETIME",
                        label: "Schedule Time",
                        required: true,
                    },
                    {
                        type: "time",
                        name: "SCHEDULEENDTIME",
                        label: "Schedule End Time",
                    },
                ],
            },
            {
                type: "section",
                title: "Exclusion & Status Filters",
                fields: [
                    {
                        type: "select",
                        name: "VB_DAYOFWEEK_EXCLUDE1",
                        label: "Day of Week Exclude 1",
                        options: dropdowns.DAYOFWEEK,
                    },
                    {
                        type: "select",
                        name: "VB_DAYOFWEEK_EXCLUDE2",
                        label: "Day of Week Exclude 2",
                        options: dropdowns.DAYOFWEEK,
                    },
                    {
                        type: "select",
                        name: "VB_DAYOFWEEK_EXCLUDE3",
                        label: "Day of Week Exclude 3",
                        options: dropdowns.DAYOFWEEK,
                    },
                    {
                        type: "select",
                        name: "VB_DAYOFMONTH_EXCLUDE1",
                        label: "Day of Month Exclude 1",
                        options: dropdowns.DAYOFMONTH,
                    },
                    {
                        type: "select",
                        name: "VB_DAYOFMONTH_EXCLUDE2",
                        label: "Day of Month Exclude 2",
                        options: dropdowns.DAYOFMONTH,
                    },
                    {
                        type: "select",
                        name: "VB_DAYOFMONTH_EXCLUDE3",
                        label: "Day of Month Exclude 3",
                        options: dropdowns.DAYOFMONTH,
                    },
                ],
            },
        ],
        [dropdowns]
    );

    const formatTimeToISO = (timeStr: any) => {
        if (!timeStr) return "";
        const str = String(timeStr).trim();
        if (str.includes(":")) {
            const parts = str.split(":");
            const hours = Number(parts[0]) || 0;
            const minutes = Number(parts[1]) || 0;
            const d = new Date();
            d.setHours(hours, minutes, 0, 0);
            return d.toISOString();
        }
        const d = new Date(str);
        return !isNaN(d.getTime()) ? d.toISOString() : str;
    };

    const formatTimeToHHMM = (val: any) => {
        if (!val) return "";
        const str = String(val).trim();
        if (str.includes("T")) {
            const d = new Date(str);
            if (!isNaN(d.getTime())) {
                const hours = String(d.getHours()).padStart(2, "0");
                const minutes = String(d.getMinutes()).padStart(2, "0");
                return `${hours}:${minutes}`;
            }
        }
        if (str.includes(":")) {
            const parts = str.split(":");
            const hours = parts[0].padStart(2, "0");
            const minutes = parts[1].padStart(2, "0");
            return `${hours}:${minutes}`;
        }
        return str;
    };

    const handleSubmit = async (formData: any) => {
        const currentUserId = String(user?.Userid || user?.id || "1");
        const nowIso = new Date().toISOString();

        const startDateIso = formData.SCHEDULESTARTDATE
            ? new Date(formData.SCHEDULESTARTDATE).toISOString()
            : nowIso;

        const endDateIso = formData.SCHEDULEENDDATE
            ? new Date(formData.SCHEDULEENDDATE).toISOString()
            : startDateIso;

        const formattedScheduleStartTime = formatTimeToISO(formData.SCHEDULESTARTTIME);
        const formattedScheduleTime = formatTimeToISO(formData.SCHEDULETIME);
        const formattedScheduleEndTime = formatTimeToISO(formData.SCHEDULEENDTIME);

        const payload = {
            tmsnRecid: isEditMode && selectedRecord?.TMSNRECID ? Number(selectedRecord.TMSNRECID) : 0,
            notificationId: Number(formData.NOTIFICATIONID || 0),
            vb_NotificationType: Number(formData.VB_NOTIFICATIONTYPE || formData.NOTIFICATIONID || 0),
            vb_LcAllocationGroup: Number(formData.VB_LCALLOCATIONGROUP || 0),
            ruleId: Number(formData.RULEID || 0),
            vbScheduleType: Number(formData.VB_SCHEDULETYPE || 0),
            vbScheduleFrequency: Number(formData.VB_SCHEDULEFREQUENCY || 0),
            vbSchedulePeriod: Number(formData.VB_SCHEDULEPERIOD || 0),
            scheduleStartDate: startDateIso,
            scheduleEndDate: endDateIso,
            scheduleTime: formattedScheduleTime,
            scheduleStartTime: formattedScheduleStartTime,
            scheduleEndTime: formattedScheduleEndTime,
            vb_DayOfWeekExclude1: Number(formData.VB_DAYOFWEEK_EXCLUDE1 || 0),
            vb_DayOfWeekExclude2: Number(formData.VB_DAYOFWEEK_EXCLUDE2 || 0),
            vb_DayOfWeekExclude3: Number(formData.VB_DAYOFWEEK_EXCLUDE3 || 0),
            vb_DayOfMonthExclude1: Number(formData.VB_DAYOFMONTH_EXCLUDE1 || 0),
            vb_DayOfMonthExclude2: Number(formData.VB_DAYOFMONTH_EXCLUDE2 || 0),
            vb_DayOfMonthExclude3: Number(formData.VB_DAYOFMONTH_EXCLUDE3 || 0),
            remarks: String(formData.REMARKS || ""),
            othDesc1: String(formData.OTHDESC1 || ""),
            othDesc2: String(formData.OTHDESC2 || ""),
            othDesc3: String(formData.OTHDESC3 || ""),
            othDesc4: String(formData.OTHDESC4 || ""),
            maker: currentUserId,
            makeDate: nowIso,
            checker: currentUserId,
            checkDate: nowIso,
            updateBy: currentUserId,
            updateDate: nowIso,
            recStatus: true,
        };

        const hostUrl = process.env.HOST_API_KEY;
        try {
            if (isEditMode && selectedRecord?.TMSNRECID) {
                await axios.put(
                    `${hostUrl}/api/MstScheduleNotification/${selectedRecord.TMSNRECID}`,
                    payload
                );
                toast.success("Schedule notification updated successfully");
            } else {
                await axios.post(
                    `${hostUrl}/api/MstScheduleNotification/add-ScheduleNotification`,
                    payload
                );
                toast.success("Schedule notification added successfully");
            }
            fetchData();
            setEditModalOpen(false);
            setSelectedRecord(null);
        } catch (error) {
            console.error("Error saving schedule notification:", error);
            toast.error("Failed to save record");
        }
    };

    const handleDelete = async (row: any) => {
        const currentUserId = user?.Userid || user?.id || "1";
        try {
            const hostUrl = process.env.HOST_API_KEY;
            const response = await axios.delete(
                `${hostUrl}/api/MstScheduleNotification?TmsnRecid=${row.TMSNRECID}&UpdateBy=${currentUserId}`
            );
            if (response.status === 200) {
                toast.success("Record deleted successfully");
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting data:", error);
            toast.error("Failed to delete record");
        }
    };

    const toForm = (row: any) => {
        return {
            TMSNRECID: row.TMSNRECID,
            RULEID: row.RULEID || null,
            NOTIFICATIONID: row.NOTIFICATIONID || null,
            VB_LCALLOCATIONGROUP: row.VB_LCALLOCATIONGROUP || row.LCALLOCATIONGROUP || null,
            VB_SCHEDULETYPE: row.VB_SCHEDULETYPE || row.SCHEDULETYPE || null,
            VB_SCHEDULEFREQUENCY: row.VB_SCHEDULEFREQUENCY || row.SCHEDULEFREQUENCY || null,
            VB_SCHEDULEPERIOD: row.VB_SCHEDULEPERIOD || row.SCHEDULEPERIOD || null,
            VB_DAYOFWEEK_EXCLUDE1: row.VB_DAYOFWEEK_EXCLUDE1 || row.DAYOFWEEK_EXCLUDE1 || null,
            VB_DAYOFWEEK_EXCLUDE2: row.VB_DAYOFWEEK_EXCLUDE2 || row.DAYOFWEEK_EXCLUDE2 || null,
            VB_DAYOFWEEK_EXCLUDE3: row.VB_DAYOFWEEK_EXCLUDE3 || row.DAYOFWEEK_EXCLUDE3 || null,
            VB_DAYOFMONTH_EXCLUDE1: row.VB_DAYOFMONTH_EXCLUDE1 || row.DAYOFMONTH_EXCLUDE1 || null,
            VB_DAYOFMONTH_EXCLUDE2: row.VB_DAYOFMONTH_EXCLUDE2 || row.DAYOFMONTH_EXCLUDE2 || null,
            VB_DAYOFMONTH_EXCLUDE3: row.VB_DAYOFMONTH_EXCLUDE3 || row.DAYOFMONTH_EXCLUDE3 || null,
            SCHEDULESTARTDATE: row.SCHEDULESTARTDATE ? new Date(row.SCHEDULESTARTDATE).toISOString().slice(0, 10) : "",
            SCHEDULEENDDATE: row.SCHEDULEENDDATE ? new Date(row.SCHEDULEENDDATE).toISOString().slice(0, 10) : "",
            SCHEDULESTARTTIME: formatTimeToHHMM(row.SCHEDULESTARTTIME || row.SCHEDULETIME),
            SCHEDULETIME: formatTimeToHHMM(row.SCHEDULETIME),
            SCHEDULEENDTIME: formatTimeToHHMM(row.SCHEDULEENDTIME),
            RECSTATUS: row.RECSTATUS !== undefined ? Boolean(row.RECSTATUS) : true,
        };
    };

    const openAdd = () => {
        setSelectedRecord({
            RULEID: null,
            NOTIFICATIONID: null,
            VB_LCALLOCATIONGROUP: null,
            VB_SCHEDULETYPE: null,
            VB_SCHEDULEFREQUENCY: null,
            VB_SCHEDULEPERIOD: null,
            VB_DAYOFWEEK_EXCLUDE1: null,
            VB_DAYOFWEEK_EXCLUDE2: null,
            VB_DAYOFWEEK_EXCLUDE3: null,
            VB_DAYOFMONTH_EXCLUDE1: null,
            VB_DAYOFMONTH_EXCLUDE2: null,
            VB_DAYOFMONTH_EXCLUDE3: null,
            SCHEDULESTARTDATE: new Date().toISOString().slice(0, 10),
            SCHEDULEENDDATE: new Date().toISOString().slice(0, 10),
            SCHEDULESTARTTIME: "",
            SCHEDULETIME: "",
            SCHEDULEENDTIME: "",
            RECSTATUS: true,
        });
        setIsEditMode(false);
        setFormKey((k) => k + 1);
        setEditModalOpen(true);
    };

    return (
        <div className="space-y-6 font-sans">
            <ReusableDataTable
                title="Message Campaign"
                headerActions={
                    <Button onClick={openAdd} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                        Add New Record
                    </Button>
                }
                loading={loading}
                columns={tableColumns}
                initialData={rows}
                keyMappings={keyMappings}
                onUpdate={(row: any) => {
                    setIsEditMode(true);
                    setSelectedRecord(toForm(row));
                    setFormKey((k) => k + 1);
                    setEditModalOpen(true);
                }}
                onDelete={(row: any) => {
                    handleDelete(row);
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
                onSubmit={handleSubmit}
                title={isEditMode ? "Edit Message Campaign Schedule" : "Add Message Campaign Schedule"}
                description="Fill out the campaign parameters and submit."
            />
        </div>
    );
}