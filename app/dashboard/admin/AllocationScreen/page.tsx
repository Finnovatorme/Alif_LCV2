"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";
import { useAuth } from "@/hooks/useAuth";
import { vbValue, Option } from "@/utils/dropDownApis";
import axios from "@/utils/axios";
import { toast } from "sonner";
import { ExternalLink, HelpCircle, X, Search, UserCheck, Play, ArrowRightLeft, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// API Helpers
const fetchTargetOptions = async (language: number): Promise<Option[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY;
    const res = await axios.get(`${hostUrl}/api/CnfgTargets/get-CnfgTarget`, {
      params: { language },
    });
    if (Array.isArray(res.data)) {
      return res.data.map((item: any) => ({
        value: item.TCTRECID,
        label: item.TARGETNAME1 || `Target ${item.TCTRECID}`,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching target options:", error);
    return [];
  }
};

const fetchUnAssignedCustomerData = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY;
    const res = await axios.get(`${hostUrl}/api/Customer/get-UnassignedCustomer`, { params });
    if (Array.isArray(res.data)) {
      return res.data.map((item: any, index: number) => ({ ...item, id: item.CIFID || index + 1 }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching unassigned customer data:", error);
    return [];
  }
};

const fetchCollectorsCustomerData = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY;
    const res = await axios.get(`${hostUrl}/api/Collector/get-CollectorUsers`, { params });
    if (Array.isArray(res.data)) {
      return res.data.map((item: any, index: number) => ({ ...item, id: item.USERID || index + 1 }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching collectors data:", error);
    return [];
  }
};

const fetchRoleIdOptions = async (language: number): Promise<Option[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY;
    const response = await axios.get(
      `${hostUrl}/api/Collector/get-CollectorRoles`,
      {
        params: { language },
      }
    );
    const data = response.data;
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        value: item.ROLEID,
        label: item.ROLENAME,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching Collector Roles options:", error);
    return [];
  }
};

export default function AllocationScreenPage() {
  const selectedLanguage = useSelector(languageParams);
  const { user } = useAuth() as { user: any };
  const language = selectedLanguage === "ar" ? 2 : 1;

  // Options State
  const [allocationGroups, setAllocationGroups] = useState<Option[]>([]);
  const [collectorRoles, setCollectorRoles] = useState<Option[]>([]);
  const [targets, setTargets] = useState<Option[]>([]);

  // Selection & Form State
  const [selectedGroup, setSelectedGroup] = useState<string | number>("");
  const [selectedRole, setSelectedRole] = useState<string | number>("");
  const [selectedTarget, setSelectedTarget] = useState<string | number>("");

  // Table Data State
  const [collectors, setCollectors] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingCollectors, setLoadingCollectors] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Selected Rows for Allocation
  const [selectedCollectorIds, setSelectedCollectorIds] = useState<(string | number)[]>([]);
  const [selectedContractCifIds, setSelectedContractCifIds] = useState<(string | number)[]>([]);

  // Search Filter Form State
  const [searchFilters, setSearchFilters] = useState({
    CifId: "",
    LcAllocationGroup: "",
    IdNumber: "",
    LoanId: "",
    LoanReferenceNo: "",
    AppId: "",
    FromDpd: "",
    ToDpd: "",
    MobileNo: "",
  });

  // Modal State
  const [selectedCollectorDetails, setSelectedCollectorDetails] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>("");

  // Initial Dropdowns Load
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [groups, roles, targetOpts] = await Promise.all([
          vbValue("LCALLOCATIONGROUP", language === 2 ? "2" : "1"),
          fetchRoleIdOptions(language),
          fetchTargetOptions(language),
        ]);
        setAllocationGroups(groups);
        setCollectorRoles(roles);
        setTargets(targetOpts);
      } catch (err) {
        console.error("Error loading dropdown options:", err);
      }
    };
    loadDropdowns();
  }, [language]);

  // Load Unassigned Contracts
  const loadUnassignedContracts = async () => {
    setLoadingContracts(true);
    try {
      const activeFilters: Record<string, any> = { Language: language };
      Object.entries(searchFilters).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) {
          activeFilters[k] = v;
        }
      });
      const data = await fetchUnAssignedCustomerData({ params: activeFilters });
      setContracts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContracts(false);
    }
  };

  useEffect(() => {
    loadUnassignedContracts();
  }, [language]);

  // Load Collectors when Role changes
  useEffect(() => {
    if (!selectedRole) {
      setCollectors([]);
      return;
    }
    const loadCollectors = async () => {
      setLoadingCollectors(true);
      try {
        const data = await fetchCollectorsCustomerData({
          params: { RoleID: selectedRole, Language: language },
        });
        setCollectors(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCollectors(false);
      }
    };
    loadCollectors();
  }, [selectedRole, language]);

  // Handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUnassignedContracts();
  };

  const handleResetSearch = () => {
    setSearchFilters({
      CifId: "",
      LcAllocationGroup: "",
      IdNumber: "",
      LoanId: "",
      LoanReferenceNo: "",
      AppId: "",
      FromDpd: "",
      ToDpd: "",
      MobileNo: "",
    });
    loadUnassignedContracts();
  };

  const handleSelectAllCollectors = (checked: boolean) => {
    if (checked) {
      setSelectedCollectorIds(collectors.map((c) => c.USERID));
    } else {
      setSelectedCollectorIds([]);
    }
  };

  const handleToggleCollector = (id: string | number) => {
    setSelectedCollectorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllContracts = (checked: boolean) => {
    if (checked) {
      setSelectedContractCifIds(contracts.map((c) => c.CIFID));
    } else {
      setSelectedContractCifIds([]);
    }
  };

  const handleToggleContract = (id: string | number) => {
    setSelectedContractCifIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Perform Manual Allocation
  const handleAllocateSelectedCases = async () => {
    if (selectedContractCifIds.length === 0) {
      toast.error("Please select at least one Customer contract");
      return;
    }
    if (selectedCollectorIds.length === 0) {
      toast.error("Please select at least one Collector");
      return;
    }
    if (!selectedTarget) {
      toast.error("Please select a Target");
      return;
    }

    const currentUserId = user?.Userid || user?.id || "1";
    const payload = {
      cifIdList: selectedContractCifIds.join(","),
      financierId: 3,
      tctRecid: Number(selectedTarget),
      vb_LcAllocationGroup: Number(selectedGroup || 0),
      roleId: Number(selectedRole || 0),
      userId: selectedCollectorIds.join(","),
      maker: currentUserId,
      recStatus: true,
    };

    try {
      const hostUrl = process.env.HOST_API_KEY;
      const response = await axios.post(
        `${hostUrl}/api/Allocations/add-manual-CaseAllocation`,
        payload
      );
      if (response.status === 200 || response.status === 201) {
        toast.success("Cases allocated successfully!");
        setSelectedCollectorIds([]);
        setSelectedContractCifIds([]);
        loadUnassignedContracts();
      } else {
        toast.error("Allocation failed");
      }
    } catch (error) {
      console.error("Error performing allocation:", error);
      toast.error("Error submitting allocation request");
    }
  };

  const openConfirmation = (actionType: string) => {
    setConfirmAction(actionType);
    setConfirmModalOpen(true);
  };

  return (
    <div className="w-full min-w-0 space-y-6 p-4 md:p-6 font-sans">
      {/* Header Bar */}
      <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 md:p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Case Allocation</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Assign unallocated loan collection contracts to active collector teams.
            </p>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg self-start md:self-auto">
            Selected: <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedCollectorIds.length} Collectors</span> | <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedContractCifIds.length} Contracts</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Target:</span>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full sm:w-64 h-10 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Select Target --</option>
              {targets.map((opt) => (
                <option key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openConfirmation("Unassign All")}
              className="rounded-xl shadow-xs gap-1.5 h-10 text-xs font-medium"
            >
              <X className="w-4 h-4" /> Unassign All
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => openConfirmation("Execute System Allocation")}
              className="rounded-xl border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1.5 h-10 text-xs font-medium"
            >
              <Play className="w-4 h-4" /> System Allocation
            </Button>

            <Button
              size="sm"
              onClick={handleAllocateSelectedCases}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs gap-1.5 h-10 text-xs font-medium px-4"
            >
              <UserCheck className="w-4 h-4" /> Allocate Selected Cases
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full min-w-0 items-start">
        {/* Left Column: Search & Select Collector */}
        <div className="w-full min-w-0">
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden w-full">
            <CardHeader className="bg-gray-50/70 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 p-4 md:p-5">
              <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" /> Search Collector
                </span>
                <span className="text-xs font-normal text-gray-500">
                  {collectors.length} Collectors
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    LC Allocation Group
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">-- Select Group --</option>
                    {allocationGroups.map((opt) => (
                      <option key={String(opt.value)} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Collector Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={!selectedGroup}
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                  >
                    <option value="">-- Select Role --</option>
                    {collectorRoles.map((opt) => (
                      <option key={String(opt.value)} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table Container */}
              <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl mt-2">
                <table className="w-full min-w-[500px] text-left text-xs text-gray-900 dark:text-white border-collapse">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 font-semibold">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="p-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={collectors.length > 0 && selectedCollectorIds.length === collectors.length}
                          onChange={(e) => handleSelectAllCollectors(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">User ID</th>
                      <th className="p-3">User Name</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {loadingCollectors ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          <div className="inline-block animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                          Loading Collectors...
                        </td>
                      </tr>
                    ) : collectors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Select LC Allocation Group & Collector Role to view collectors.
                        </td>
                      </tr>
                    ) : (
                      collectors.map((c) => (
                        <tr
                          key={String(c.USERID)}
                          className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors ${selectedCollectorIds.includes(c.USERID) ? "bg-blue-50/80 dark:bg-blue-950/40" : ""
                            }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedCollectorIds.includes(c.USERID)}
                              onChange={() => handleToggleCollector(c.USERID)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-semibold text-gray-900 dark:text-white">{c.USERID || "-"}</td>
                          <td className="p-3">{c.USERNAME1 || c.USERNAME || "-"}</td>
                          <td className="p-3">{c.MOBILE || "-"}</td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCollectorDetails(c);
                                setDetailsModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 h-7 px-2 text-xs"
                            >
                              View <ExternalLink className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Search Unassigned Contract */}
        <div className="w-full min-w-0">
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden w-full">
            <CardHeader className="bg-gray-50/70 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 p-4 md:p-5">
              <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" /> Search Contract
                </span>
                <span className="text-xs font-normal text-gray-500">
                  {contracts.length} Unassigned Cases
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-5 space-y-4">
              {/* Responsive Filter Form */}
              <form onSubmit={handleSearchSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">CIF ID</label>
                    <Input
                      placeholder="CIF ID"
                      value={searchFilters.CifId}
                      onKeyDown={(e) => {
                        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (!/^\d+$/.test(pasted)) e.preventDefault();
                      }}
                      onChange={(e) => setSearchFilters({ ...searchFilters, CifId: e.target.value })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">LC Allocation Group</label>
                    <select
                      value={searchFilters.LcAllocationGroup}
                      onChange={(e) => setSearchFilters({ ...searchFilters, LcAllocationGroup: e.target.value })}
                      className="w-full h-9 px-3 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">-- Select Group --</option>
                      {allocationGroups.map((opt) => (
                        <option key={String(opt.value)} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">ID Number</label>
                    <Input
                      placeholder="ID Number"
                      value={searchFilters.IdNumber}
                      onKeyDown={(e) => {
                        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (!/^\d+$/.test(pasted)) e.preventDefault();
                      }}
                      onChange={(e) => setSearchFilters({ ...searchFilters, IdNumber: e.target.value })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">Loan ID</label>
                    <Input
                      placeholder="Loan ID"
                      value={searchFilters.LoanId}
                      onKeyDown={(e) => {
                        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (!/^\d+$/.test(pasted)) e.preventDefault();
                      }}
                      onChange={(e) => setSearchFilters({ ...searchFilters, LoanId: e.target.value })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">Loan Ref No</label>
                    <Input
                      placeholder="Loan Reference No"
                      value={searchFilters.LoanReferenceNo}
                      onKeyDown={(e) => {
                        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (!/^\d+$/.test(pasted)) e.preventDefault();
                      }}
                      onChange={(e) => setSearchFilters({ ...searchFilters, LoanReferenceNo: e.target.value })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">App ID</label>
                    <Input
                      placeholder="App ID"
                      value={searchFilters.AppId}
                      onKeyDown={(e) => {
                        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (!/^\d+$/.test(pasted)) e.preventDefault();
                      }}
                      onChange={(e) => setSearchFilters({ ...searchFilters, AppId: e.target.value })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">From DPD</label>
                    <Input
                      placeholder="From DPD"
                      value={searchFilters.FromDpd}
                      onKeyDown={(e) => {
                        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (!/^\d+$/.test(pasted)) e.preventDefault();
                      }}
                      onChange={(e) => setSearchFilters({ ...searchFilters, FromDpd: e.target.value })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">To DPD</label>
                    <Input
                      placeholder="To DPD"
                      value={searchFilters.ToDpd}
                      onKeyDown={(e) => {
                        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (!/^\d+$/.test(pasted)) e.preventDefault();
                      }}
                      onChange={(e) => setSearchFilters({ ...searchFilters, ToDpd: e.target.value })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-0.5 block">Mobile No</label>
                    <Input
                      placeholder="Mobile No"
                      value={searchFilters.MobileNo}
                      onKeyDown={(e) => {
                        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (!/^\d+$/.test(pasted)) e.preventDefault();
                      }}
                      onChange={(e) => setSearchFilters({ ...searchFilters, MobileNo: e.target.value })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetSearch}
                    className="rounded-xl h-9 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-xs font-semibold px-5"
                  >
                    <Search className="w-3.5 h-3.5 mr-1" /> Search
                  </Button>
                </div>
              </form>

              {/* Table Container */}
              <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full min-w-[550px] text-left text-xs text-gray-900 dark:text-white border-collapse">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 font-semibold">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="p-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={contracts.length > 0 && selectedContractCifIds.length === contracts.length}
                          onChange={(e) => handleSelectAllContracts(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">CIF ID</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Customer Type</th>
                      <th className="p-3">Nationality</th>
                      <th className="p-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {loadingContracts ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          <div className="inline-block animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                          Loading Contracts...
                        </td>
                      </tr>
                    ) : contracts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No unassigned contracts found.
                        </td>
                      </tr>
                    ) : (
                      contracts.map((item) => (
                        <tr
                          key={String(item.CIFID)}
                          className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors ${selectedContractCifIds.includes(item.CIFID) ? "bg-blue-50/80 dark:bg-blue-950/40" : ""
                            }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedContractCifIds.includes(item.CIFID)}
                              onChange={() => handleToggleContract(item.CIFID)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-semibold text-gray-900 dark:text-white">{item.CIFID || "-"}</td>
                          <td className="p-3 font-medium">{item.CUSTOMERNAME || "-"}</td>
                          <td className="p-3">{item.CUSTOMERTYPE || "-"}</td>
                          <td className="p-3">{item.NATIONALITY || "-"}</td>
                          <td className="p-3">{item.CUSTOMERCATEGORY || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Collector Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white border-b pb-3">
              Collector Details
            </DialogTitle>
          </DialogHeader>

          {selectedCollectorDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4 text-xs">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                <span className="text-gray-500 block text-[11px] mb-0.5">ID Number</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedCollectorDetails.IDNUMBER || "-"}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                <span className="text-gray-500 block text-[11px] mb-0.5">Collector Name</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedCollectorDetails.USERNAME1 || selectedCollectorDetails.USERNAME || "-"}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                <span className="text-gray-500 block text-[11px] mb-0.5">Mobile</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedCollectorDetails.MOBILE || "-"}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                <span className="text-gray-500 block text-[11px] mb-0.5">Email</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedCollectorDetails.EMAIL || "-"}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                <span className="text-gray-500 block text-[11px] mb-0.5">Branch Code</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedCollectorDetails.BRANCHCODE || "-"}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                <span className="text-gray-500 block text-[11px] mb-0.5">L1 Manager Name</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedCollectorDetails.L1MANAGERNAME || "-"}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                <span className="text-gray-500 block text-[11px] mb-0.5">L2 Manager Name</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedCollectorDetails.L2MANAGERNAME || "-"}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                <span className="text-gray-500 block text-[11px] mb-0.5">L3 Manager Name</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{selectedCollectorDetails.L3MANAGERNAME || "-"}</span>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-gray-500 text-xs">No details available.</p>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setDetailsModalOpen(false)} className="rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-gray-900 text-center">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Confirm Action
          </DialogTitle>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to proceed with <strong className="text-gray-900 dark:text-white">{confirmAction}</strong>?
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setConfirmModalOpen(false)} className="rounded-xl px-5 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success(`${confirmAction} executed successfully`);
                setConfirmModalOpen(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 text-xs"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}