import axios from "@/utils/axios";

export interface LegalCaseRecord {
  TLLCRECID: number;
  TMCARECID: number;
  CIFID: number;
  LOANID: number;
  VB_LEGALCASETYPE?: number | null;
  LEGALCASETYPE?: string | null;
  VB_LEGALCASECLASSIFICATION?: number | null;
  LEGALCASECLASSIFICATION?: string | null;
  CREATIONDATE?: string | null;
  ISAPPROVED?: boolean | null;
  APPROVEDBY?: string | null;
  APPROVEDDATE?: string | null;
  [key: string]: any;
}

export const DEFAULT_LEGAL_CASE: LegalCaseRecord = {
  TLLCRECID: 1,
  TMCARECID: 1,
  CIFID: 246,
  LOANID: 10284,
  VB_LEGALCASETYPE: null,
  LEGALCASETYPE: "Commercial Debt Recovery",
  VB_LEGALCASECLASSIFICATION: null,
  LEGALCASECLASSIFICATION: "Article 46 Judicial Claim",
  CREATIONDATE: "2026-11-18T16:24:06.673",
  ISAPPROVED: true,
  APPROVEDBY: "aadna",
  APPROVEDDATE: null,
};

/**
 * Fetch Legal Case Record
 * Endpoint: GET https://demo.finnovator.com.sa:8015/api/Legal/getLegalCase
 */
export const getLegalCase = async (params?: {
  CIFID?: number | string;
  LOANID?: number | string;
  TLLCRECID?: number | string;
  [key: string]: any;
}): Promise<LegalCaseRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalCase`, {
      params,
    });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw;
    }
    if (raw && typeof raw === "object" && (raw.TLLCRECID || raw.CIFID)) {
      return [raw];
    }
    return [DEFAULT_LEGAL_CASE];
  } catch (error: any) {
    console.error("Error fetching Legal Case API (falling back to default):", error);
    return [DEFAULT_LEGAL_CASE];
  }
};

/* ====================================================================
 * LEGAL NOTICE MODELS & APIS
 * Swagger Endpoints:
 * - POST   /api/Legal/addLegalNotice
 * - PUT    /api/Legal/updateLegalNotice/{id}
 * - DELETE /api/Legal/deleteLegalNotice/{id}
 * - GET    /api/Legal/getLegalNotice
 * ==================================================================== */

export interface LegalNoticeRecord {
  tllnRecId?: number;
  TLLNRECID?: number;
  tllcRecId: number;
  TLLCRECID?: number;
  cifId: number;
  CIFID?: number;
  loanId: number;
  LOANID?: number;
  noticeRequired: boolean;
  NOTICEREQUIRED?: boolean;
  vbLegalNoticeReason: number;
  VB_LEGALNOTICEREASON?: number;
  legalNoticeReason?: string;
  LEGALNOTICEREASON?: string;
  vbLegalNoticeChannel: number;
  VB_LEGALNOTICECHANNEL?: number;
  legalNoticeChannel?: string;
  LEGALNOTICECHANNEL?: string;
  noticeDate: string;
  NOTICEDATE?: string;
  deliveryDate: string;
  DELIVERYDATE?: string;
  noticePeriodInDays: number;
  NOTICEPERIODINDAYS?: number;
  noticeDetails: string;
  NOTICEDETAILS?: string;
  noticeExpiryDate: string;
  NOTICEEXPIRYDATE?: string;
  updateDate?: string;
  UPDATEDATE?: string;
  updateBy?: string;
  UPDATEBY?: string;
  [key: string]: any;
}

export interface AddLegalNoticePayload {
  tllcRecId: number;
  cifId: number;
  loanId: number;
  noticeRequired: boolean;
  vbLegalNoticeReason: number;
  vbLegalNoticeChannel: number;
  noticeDate: string;
  deliveryDate: string;
  noticePeriodInDays: number;
  noticeDetails: string;
  noticeExpiryDate: string;
  updateDate: string;
  updateBy: string;
}

export interface UpdateLegalNoticePayload extends AddLegalNoticePayload {
  tllnRecId?: number;
}

export const NOTICE_CHANNELS: Record<number, string> = {
  1: "SMS",
  2: "WhatsApp",
  3: "Postal Registered Mail",
  4: "Najiz Electronic Portal",
  5: "Email / Registered Communication",
};

export const NOTICE_REASONS: Record<number, string> = {
  1: "30-Day Overdue Delinquency",
  2: "Final Legal Demand Notice",
  3: "Article 34 Enforcement Warning",
  4: "Breach of Islamic Financing Contract",
  5: "Acceleration & Judicial Summons",
};

export const DEFAULT_LEGAL_NOTICES: LegalNoticeRecord[] = [

];

/**
 * 1. Fetch Legal Notices
 * Endpoint: GET /api/Legal/getLegalNotice
 * Query params: TllnRecId, TllcRecId, CifId, LoanId, Language
 */
export const getLegalNotice = async (params?: {
  TllnRecId?: number | string;
  TllcRecId?: number | string;
  CifId?: number | string;
  LoanId?: number | string;
  Language?: number | string;
  [key: string]: any;
}): Promise<LegalNoticeRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalNotice`, {
      params,
    });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === "object" && (raw.TLLNRECID || raw.tllnRecId)) {
      return [raw];
    }
    return DEFAULT_LEGAL_NOTICES;
  } catch (error: any) {
    console.error("Error fetching Legal Notices API (using initial records):", error);
    return DEFAULT_LEGAL_NOTICES;
  }
};


export const addLegalNotice = async (
  payload: AddLegalNoticePayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(`${hostUrl}/api/Legal/addLegalNotice`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200 ||
      response.status === 201;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message: resData?.responsedescription || resData?.message || "Notice added successfully",
    };
  } catch (error: any) {
    console.error("Error adding Legal Notice:", error);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to add legal notice",
    };
  }
};

export const updateLegalNotice = async (
  id: number | string,
  payload: AddLegalNoticePayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.put(`${hostUrl}/api/Legal/updateLegalNotice/${id}`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message: resData?.responsedescription || resData?.message || "Notice updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating Legal Notice:", error);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to update legal notice",
    };
  }
};

/**
 * 4. Delete Legal Notice
 * Endpoint: DELETE /api/Legal/deleteLegalNotice/{id}
 * Query params: updateBy (string)
 */
export const deleteLegalNotice = async (
  id: number | string,
  updateBy?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.delete(`${hostUrl}/api/Legal/deleteLegalNotice/${id}`, {
      params: updateBy ? { updateBy } : undefined,
    });
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      message: resData?.responsedescription || resData?.message || "Notice deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting Legal Notice:", error);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to delete legal notice",
    };
  }
};


/* ====================================================================
 * NAJIZ PORTAL & COURT ORDERS MODELS & APIS
 * Swagger Endpoints (8 APIs):
 * - POST   /api/Legal/addLegalNajizCase
 * - PUT    /api/Legal/updateLegalNajizCase/{id}
 * - DELETE /api/Legal/deleteLegalNajizCase/{id}
 * - GET    /api/Legal/getLegalNajizCase
 * - POST   /api/Legal/addLegalNajizCourtOrder
 * - PUT    /api/Legal/updateLegalNajizCourtOrder/{id}
 * - DELETE /api/Legal/deleteLegalNajizCourtOrder/{id}
 * - GET    /api/Legal/getLegalNajizCourtOrder
 * ==================================================================== */

export interface LegalNajizCaseRecord {
  tlncRecId?: number;
  TLNCRECID?: number;
  tllcRecId: number;
  TLLCRECID?: number;
  cifId: number;
  CIFID?: number;
  loanId: number;
  LOANID?: number;
  najizReference: string;
  NAJIZREFERENCE?: string;
  vbNajizApplicationType: number;
  VB_NAJIZAPPLICATIONTYPE?: number;
  executionCourt: string;
  EXECUTIONCOURT?: string;
  fillingDate: string;
  FILLINGDATE?: string;
  fillingAmount: number;
  FILLINGAMOUNT?: number;
  fillingDescription: string;
  FILLINGDESCRIPTION?: string;
  vbNajizInstrumentType: number;
  VB_NAJIZINSTRUMENTTYPE?: number;
  instrumentNumber: string;
  INSTRUMENTNUMBER?: string;
  vbLegalDebtorType: number;
  VB_LEGALDEBTORTYPE?: number;
  debtorIdNumber: string;
  DEBTORIDNUMBER?: string;
  vbNajizSubmissionStatus: number;
  VB_NAJIZSUBMISSIONSTATUS?: number;
  submissionRemarks: string;
  SUBMISSIONREMARKS?: string;
  submitBy?: string;
  SUBMITBY?: string;
  updateBy?: string;
  UPDATEBY?: string;
  updateDate?: string;
  UPDATEDATE?: string;
  [key: string]: any;
}

export interface AddLegalNajizCasePayload {
  tllcRecId: number;
  cifId: number;
  loanId: number;
  najizReference: string;
  vbNajizApplicationType: number;
  executionCourt: string;
  fillingDate: string;
  fillingAmount: number;
  fillingDescription: string;
  vbNajizInstrumentType: number;
  instrumentNumber: string;
  vbLegalDebtorType: number;
  debtorIdNumber: string;
  vbNajizSubmissionStatus: number;
  submissionRemarks: string;
  submitBy: string;
  updateBy: string;
  updateDate: string;
}

export interface LegalNajizCourtOrderRecord {
  tlncoRecId?: number;
  TLNCORECID?: number;
  id?: number;
  tlncRecId: number;
  TLNCRECID?: number;
  tllcRecId: number;
  TLLCRECID?: number;
  cifId: number;
  CIFID?: number;
  loanId: number;
  LOANID?: number;
  najizReference: string;
  NAJIZREFERENCE?: string;
  courtOrderReference: string;
  COURTORDERREFERENCE?: string;
  vbLegalCourtOrderType: number;
  VB_LEGALCOURTORDERTYPE?: number;
  orderDate: string;
  ORDERDATE?: string;
  notificationDate: string;
  NOTIFICATIONDATE?: string;
  vbLegalDebtorNoticeStatus: number;
  VB_LEGALDEBTORNOTICESTATUS?: number;
  vbCourtOrderStatus: number;
  VB_COURTORDERSTATUS?: number;
  updateBy?: string;
  UPDATEBY?: string;
  updateDate?: string;
  UPDATEDATE?: string;
  [key: string]: any;
}

export interface AddLegalNajizCourtOrderPayload {
  tlncRecId: number;
  tllcRecId: number;
  cifId: number;
  loanId: number;
  najizReference: string;
  courtOrderReference: string;
  vbLegalCourtOrderType: number;
  orderDate: string;
  notificationDate: string;
  vbLegalDebtorNoticeStatus: number;
  vbCourtOrderStatus: number;
  updateBy: string;
  updateDate: string;
}

/**
 * Utility to strip bilingual English/Arabic concatenations and return strictly one language.
 * E.g. "Salary Deduction (خصم من الراتب)" -> "Salary Deduction" (lang=1) or "خصم من الراتب" (lang=2)
 * "Resolved / منتهي" -> "Resolved" (lang=1) or "منتهي" (lang=2)
 */
export function formatUnilingualText(str?: string | null, lang: number = 1): string {
  if (!str) return "";
  const isAr = lang === 2;
  const trimmed = str.trim();

  // Pattern 1: "English Text (النص العربي)"
  const parenMatch = trimmed.match(/^(.*?)\s*\(([\u0600-\u06FF\s0-9\-\.\,\/]+)\)$/);
  if (parenMatch) {
    return isAr ? parenMatch[2].trim() : parenMatch[1].trim();
  }

  // Pattern 2: "النص العربي (English Text)"
  const parenMatchRev = trimmed.match(/^([\u0600-\u06FF\s0-9\-\.\,\/]+)\s*\(([a-zA-Z0-9\s\-\.\,\/]+)\)$/);
  if (parenMatchRev) {
    return isAr ? parenMatchRev[1].trim() : parenMatchRev[2].trim();
  }

  // Pattern 3: "English / عربي" or "عربي / English"
  const slashMatch = trimmed.match(/^(.*?)\s*[\/|\\]\s*(.*?)$/);
  if (slashMatch) {
    const p1 = slashMatch[1].trim();
    const p2 = slashMatch[2].trim();
    const p1IsAr = /[\u0600-\u06FF]/.test(p1);
    const p2IsAr = /[\u0600-\u06FF]/.test(p2);
    if (p1IsAr && !p2IsAr) return isAr ? p1 : p2;
    if (!p1IsAr && p2IsAr) return isAr ? p2 : p1;
  }

  return trimmed;
}

export const NAJIZ_APPLICATION_TYPES: Record<number, string> = {
  1: "Judicial Commercial Enforcement Claim",
  2: "Electronic Sanad Li Amr Execution",
  3: "Financial Execution Direct Claim",
  4: "Article 34 Preliminary Order",
};

export const NAJIZ_APPLICATION_TYPES_AR: Record<number, string> = {
  1: "دعوى تنفيذ مالي",
  2: "تنفيذ سند لأمر إلكتروني",
  3: "طلب تنفيذ تجاري مباشر",
  4: "أمر تنفيذ قضائي أولي",
};

export const NAJIZ_INSTRUMENT_TYPES: Record<number, string> = {
  1: "Nafith Electronic Promissory Note",
  2: "Final Court Judgment Deed",
  3: "Notarized Commercial Contract",
  4: "Commercial Paper / Cheque",
};

export const NAJIZ_INSTRUMENT_TYPES_AR: Record<number, string> = {
  1: "سند لأمر نافذ",
  2: "صك حكم قضائي نهائي",
  3: "عقد تجاري موثق",
  4: "ورقة تجارية",
};

export const LEGAL_DEBTOR_TYPES: Record<number, string> = {
  1: "Individual Applicant",
  2: "Sole Proprietorship",
  3: "Corporate / LLC",
};

export const LEGAL_DEBTOR_TYPES_AR: Record<number, string> = {
  1: "فرد",
  2: "مؤسسة فردية",
  3: "شركة",
};

export const NAJIZ_SUBMISSION_STATUSES: Record<number, string> = {
  1: "Draft",
  2: "Submitted to MOJ",
  3: "Approved & Certified",
  4: "Summons Period Active",
  5: "Execution in Progress",
  6: "Settled & Closed",
};

export const COURT_ORDER_TYPES: Record<number, string> = {
  1: "Article 34 (5-Day Mandatory Notice)",
  2: "Article 46 (Compulsory Execution & Asset Freeze)",
  3: "Article 46 - Bank Accounts Freeze",
  4: "Article 46 - Travel Ban & Vehicle Impound",
  5: "Salary / Wage Withholding Order",
};

export const COURT_ORDER_TYPES_AR: Record<number, string> = {
  1: "إخطار مادة 34 (مهلة 5 أيام)",
  2: "قرار مادة 46 (تنفيذ جبري وحجز)",
  3: "إيقاف وتجميد الحسابات البنكية",
  4: "منع سفر وحجز مركبات",
  5: "حسم مستحقات مالية وراتب",
};

export const DEBTOR_NOTICE_STATUSES: Record<number, string> = {
  1: "Pending Dispatch",
  2: "Absher Verified & Served",
  3: "Notice Grace Period Active",
  4: "Notice Period Expired",
};

export const COURT_ORDER_STATUSES: Record<number, string> = {
  1: "Issued by Judge",
  2: "Active Enforcement",
  3: "Temporarily Suspended",
  4: "Revoked / Settled",
};

export const DEFAULT_NAJIZ_CASES: LegalNajizCaseRecord[] = [];

export const DEFAULT_COURT_ORDERS: LegalNajizCourtOrderRecord[] = [];

/**
 * 1. Fetch Najiz Cases
 * Endpoint: GET /api/Legal/getLegalNajizCase
 */
export const getLegalNajizCase = async (params?: {
  TllcRecId?: number | string;
  CifId?: number | string;
  LoanId?: number | string;
  TlncRecId?: number | string;
  Language?: number | string;
  [key: string]: any;
}): Promise<LegalNajizCaseRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalNajizCase`, { params });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && (raw.TLNCRECID || raw.tlncRecId)) return [raw];
    return [];
  } catch (error: any) {
    console.error("Error fetching Najiz Cases:", error);
    return [];
  }
};

/**
 * 2. Add Najiz Case
 * Endpoint: POST /api/Legal/addLegalNajizCase
 */
export const addLegalNajizCase = async (
  payload: AddLegalNajizCasePayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(`${hostUrl}/api/Legal/addLegalNajizCase`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200 ||
      response.status === 201;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message: resData?.responsedescription || resData?.message || "Najiz Case added successfully",
    };
  } catch (error: any) {
    console.error("Error adding Najiz Case:", error);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to add Najiz Case",
    };
  }
};

/**
 * 3. Update Najiz Case
 * Endpoint: PUT /api/Legal/updateLegalNajizCase/{id}
 */
export const updateLegalNajizCase = async (
  id: number | string,
  payload: AddLegalNajizCasePayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.put(`${hostUrl}/api/Legal/updateLegalNajizCase/${id}`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message: resData?.responsedescription || resData?.message || "Najiz Case updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating Najiz Case:", error);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to update Najiz Case",
    };
  }
};

/**
 * 4. Delete Najiz Case
 * Endpoint: DELETE /api/Legal/deleteLegalNajizCase/{id}
 */
export const deleteLegalNajizCase = async (
  id: number | string,
  updateBy?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.delete(`${hostUrl}/api/Legal/deleteLegalNajizCase/${id}`, {
      params: updateBy ? { updateBy } : undefined,
    });
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      message: resData?.responsedescription || resData?.message || "Najiz Case deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting Najiz Case:", error);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to delete Najiz Case",
    };
  }
};

/**
 * 5. Fetch Najiz Court Orders
 * Endpoint: GET /api/Legal/getLegalNajizCourtOrder
 */
export const getLegalNajizCourtOrder = async (params?: {
  TlncRecId?: number | string;
  TllcRecId?: number | string;
  CifId?: number | string;
  LoanId?: number | string;
  Language?: number | string;
  [key: string]: any;
}): Promise<LegalNajizCourtOrderRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalNajizCourtOrder`, { params });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && (raw.TLNCORECID || raw.tlncoRecId)) return [raw];
    return [];
  } catch (error: any) {
    console.error("Error fetching Najiz Court Orders:", error);
    return [];
  }
};

/**
 * 6. Add Najiz Court Order
 * Endpoint: POST /api/Legal/addLegalNajizCourtOrder
 */
export const addLegalNajizCourtOrder = async (
  payload: AddLegalNajizCourtOrderPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(`${hostUrl}/api/Legal/addLegalNajizCourtOrder`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200 ||
      response.status === 201;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Najiz Court Order added successfully",
    };
  } catch (error: any) {
    console.error("Error adding Najiz Court Order:", error);
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || "Failed to add Najiz Court Order",
    };
  }
};

/**
 * 7. Update Najiz Court Order
 * Endpoint: PUT /api/Legal/updateLegalNajizCourtOrder/{id}
 */
export const updateLegalNajizCourtOrder = async (
  id: number | string,
  payload: AddLegalNajizCourtOrderPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.put(`${hostUrl}/api/Legal/updateLegalNajizCourtOrder/${id}`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Najiz Court Order updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating Najiz Court Order:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message || error?.message || "Failed to update Najiz Court Order",
    };
  }
};

/**
 * 8. Delete Najiz Court Order
 * Endpoint: DELETE /api/Legal/deleteLegalNajizCourtOrder/{id}
 */
export const deleteLegalNajizCourtOrder = async (
  id: number | string,
  updateBy?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.delete(`${hostUrl}/api/Legal/deleteLegalNajizCourtOrder/${id}`, {
      params: updateBy ? { updateBy } : undefined,
    });
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      message:
        resData?.responsedescription || resData?.message || "Najiz Court Order deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting Najiz Court Order:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message || error?.message || "Failed to delete Najiz Court Order",
    };
  }
};

/* ====================================================================
 * LEGAL CASE ENFORCEMENT MODELS & APIS
 * Swagger Endpoints:
 * - POST   /api/Legal/addLegalCaseEnforcement
 * - PUT    /api/Legal/updateLegalCaseEnforcement/{id}
 * - DELETE /api/Legal/deleteLegalCaseEnforcement/{id}
 * - GET    /api/Legal/getLegalCaseEnforcement
 * ==================================================================== */

export interface LegalCaseEnforcementRecord {
  tlceRecId?: number;
  TLCE_RECID?: number;
  TLCERECID?: number;
  id?: number;
  tllcRecId: number;
  TLLCRECID?: number;
  cifId: number;
  CIFID?: number;
  loanId?: number;
  LOANID?: number;
  vbLegalEnforcementType?: number | string;
  VB_LEGALENFORCEMENTTYPE?: number | string;
  legalEnforcementType?: string;
  LEGALENFORCEMENTTYPE?: string;
  enforcementReference?: string;
  ENFORCEMENTREFERENCE?: string;
  courtName?: string;
  COURTNAME?: string;
  enforcementDate?: string;
  ENFORCEMENTDATE?: string;
  effectiveDate?: string;
  EFFECTIVEDATE?: string;
  deadlineDate?: string;
  DEADLINEDATE?: string;
  enforcementDetails?: string;
  ENFORCEMENTDETAILS?: string;
  vbLegalEnforcementAction?: number | string;
  VB_LEGALENFORCEMENTACTION?: number | string;
  legalEnforcementAction?: string;
  LEGALENFORCEMENTACTION?: string;
  enforcedAmount?: number | string;
  ENFORCEDAMOUNT?: number | string;
  updateDate?: string;
  UPDATEDATE?: string;
  updateBy?: string;
  UPDATEBY?: string;
  [key: string]: any;
}

export interface AddLegalCaseEnforcementPayload {
  tllcRecId: number;
  cifId: number;
  loanId?: number;
  vbLegalEnforcementType?: number | string;
  enforcementReference?: string;
  courtName?: string;
  enforcementDate?: string;
  effectiveDate?: string;
  deadlineDate?: string;
  enforcementDetails?: string;
  vbLegalEnforcementAction?: number | string;
  enforcedAmount?: number | string;
  updateDate?: string;
  updateBy?: string;
}

export const ENFORCEMENT_TYPES: Record<number, string> = {
  1: "Article 34 Execution Warning",
  2: "Article 46 Compulsory Asset Execution",
  3: "Direct Financial Claim Execution",
  4: "Executive Title Execution",
  5: "Bank Account & Salary Attachment",
  6: "Asset & Property Judicial Seizure",
};

export const ENFORCEMENT_TYPES_AR: Record<number, string> = {
  1: "إخطار تنفيذ مادة 34",
  2: "إجراءات مادة 46 - حجز وتنفيذ",
  3: "تنفيذ مطالبة مالية مباشرة",
  4: "تنفيذ سند لأمر قضائي",
  5: "حجز مصرفي وحسم راتب",
  6: "حجز أصول وعقارات",
};

export const ENFORCEMENT_ACTIONS: Record<number, string> = {
  1: "Bank Account Freeze",
  2: "Travel Ban Enforced",
  3: "Government Services Suspension",
  4: "Commercial Register Freeze",
  5: "Salary Deduction",
  6: "Seizure & Auction",
  7: "Execution Notice Dispatched",
};

export const ENFORCEMENT_ACTIONS_AR: Record<number, string> = {
  1: "تجميد الحسابات البنكية",
  2: "منع من السفر",
  3: "إيقاف الخدمات الحكومية",
  4: "إيقاف السجل التجاري",
  5: "حسم من الراتب",
  6: "حجز ومزاد علني",
  7: "تبليغ أمر التنفيذ",
};

export const getEnforcementTypeText = (code: number | string, lang: number = 1): string => {
  const num = Number(code);
  return lang === 2 ? (ENFORCEMENT_TYPES_AR[num] || `نوع #${code}`) : (ENFORCEMENT_TYPES[num] || `Type #${code}`);
};

export const getEnforcementActionText = (code: number | string, lang: number = 1): string => {
  const num = Number(code);
  return lang === 2 ? (ENFORCEMENT_ACTIONS_AR[num] || `إجراء #${code}`) : (ENFORCEMENT_ACTIONS[num] || `Action #${code}`);
};

/**
 * 1. Fetch Legal Case Enforcements
 * Endpoint: GET /api/Legal/getLegalCaseEnforcement
 * Params: TlceRecId, TllcRecId, CifId, LoanId, Language
 */
export const getLegalCaseEnforcement = async (params?: {
  TlceRecId?: number | string;
  TllcRecId?: number | string;
  CifId?: number | string;
  LoanId?: number | string;
  Language?: number | string;
  [key: string]: any;
}): Promise<LegalCaseEnforcementRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalCaseEnforcement`, {
      params,
    });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === "object" && (raw.TLCERECID || raw.tlceRecId || raw.CIFID)) {
      return [raw];
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching Legal Case Enforcement:", error);
    return [];
  }
};

/**
 * 2. Add Legal Case Enforcement
 * Endpoint: POST /api/Legal/addLegalCaseEnforcement
 */
export const addLegalCaseEnforcement = async (
  payload: AddLegalCaseEnforcementPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(`${hostUrl}/api/Legal/addLegalCaseEnforcement`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Legal Enforcement added successfully",
    };
  } catch (error: any) {
    console.error("Error adding Legal Case Enforcement:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to add Legal Case Enforcement",
    };
  }
};

/**
 * 3. Update Legal Case Enforcement
 * Endpoint: PUT /api/Legal/updateLegalCaseEnforcement/{id}
 */
export const updateLegalCaseEnforcement = async (
  id: number | string,
  payload: AddLegalCaseEnforcementPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.put(`${hostUrl}/api/Legal/updateLegalCaseEnforcement/${id}`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Legal Enforcement updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating Legal Case Enforcement:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to update Legal Case Enforcement",
    };
  }
};

/**
 * 4. Delete Legal Case Enforcement
 * Endpoint: DELETE /api/Legal/deleteLegalCaseEnforcement/{id}
 * Query param: updateBy
 */
export const deleteLegalCaseEnforcement = async (
  id: number | string,
  updateBy?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.delete(`${hostUrl}/api/Legal/deleteLegalCaseEnforcement/${id}`, {
      params: updateBy ? { updateBy } : undefined,
    });
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      message:
        resData?.responsedescription || resData?.message || "Legal Enforcement deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting Legal Case Enforcement:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to delete Legal Case Enforcement",
    };
  }
};

/* ====================================================================
 * LEGAL COURT DECISION MODELS & APIS
 * Swagger Endpoints:
 * - POST   /api/Legal/addLegalCourtDecision
 * - PUT    /api/Legal/updateLegalCourtDecision/{id}
 * - DELETE /api/Legal/deleteLegalCourtDecision/{id}
 * - GET    /api/Legal/getLegalCourtDecision
 * ==================================================================== */

export interface LegalCourtDecisionRecord {
  tlcdRecId?: number;
  TLCD_RECID?: number;
  TLCDRECID?: number;
  id?: number;
  tlchRecId?: number;
  TLCHRECID?: number;
  tllcRecId: number;
  TLLCRECID?: number;
  cifId: number;
  CIFID?: number;
  loanId?: number;
  LOANID?: number;
  vbLegalDecisionType?: number | string;
  VB_LEGALDECISIONTYPE?: number | string;
  legalDecisionType?: string;
  LEGALDECISIONTYPE?: string;
  decisionReference?: string;
  DECISIONREFERENCE?: string;
  courtName?: string;
  COURTNAME?: string;
  decisionDate?: string;
  DECISIONDATE?: string;
  decisionDetails?: string;
  DECISIONDETAILS?: string;
  vbLegalDecisionResult?: number | string;
  VB_LEGALDECISIONRESULT?: number | string;
  legalDecisionResult?: string;
  LEGALDECISIONRESULT?: string;
  appealAllowed?: boolean;
  APPEALALLOWED?: boolean;
  appealExpireDate?: string;
  APPEALEXPIREDATE?: string;
  updateDate?: string;
  UPDATEDATE?: string;
  updateBy?: string;
  UPDATEBY?: string;
  [key: string]: any;
}

export interface AddLegalCourtDecisionPayload {
  tlchRecId?: number;
  tllcRecId: number;
  cifId: number;
  loanId?: number;
  vbLegalDecisionType?: number | string;
  decisionReference?: string;
  courtName?: string;
  decisionDate?: string;
  decisionDetails?: string;
  vbLegalDecisionResult?: number | string;
  appealAllowed?: boolean;
  appealExpireDate?: string;
  updateDate?: string;
  updateBy?: string;
}

export const DECISION_TYPES: Record<number, string> = {
  1: "Final Judgment",
  2: "Summary Obligation Ruling",
  3: "Preliminary Injunction",
  4: "Enforcement Warrant",
  5: "Interlocutory Decision",
};

export const DECISION_TYPES_AR: Record<number, string> = {
  1: "حكم قطعي واجب النفاذ",
  2: "حكم سداد عاجل",
  3: "قرار وقتي / تحفظي",
  4: "أمر تنفيذ قضائي",
  5: "قرار قضائي فرعي",
};

export const DECISION_RESULTS: Record<number, string> = {
  1: "In Favor of Plaintiff",
  2: "Partially Accepted",
  3: "Rejected / Dismissed",
  4: "Settlement Judicial Deed",
  5: "Under Appeal Review",
};

export const DECISION_RESULTS_AR: Record<number, string> = {
  1: "لصالح المدعي - قبول الدعوى",
  2: "قبول جزئي للمطالبة",
  3: "رد الدعوى",
  4: "إثبات صلح قضائي",
  5: "قيد النظر الاستئنافي",
};

export const getDecisionTypeText = (code: number | string, lang: number = 1): string => {
  const num = Number(code);
  return lang === 2 ? (DECISION_TYPES_AR[num] || `نوع #${code}`) : (DECISION_TYPES[num] || `Type #${code}`);
};

export const getDecisionResultText = (code: number | string, lang: number = 1): string => {
  const num = Number(code);
  return lang === 2 ? (DECISION_RESULTS_AR[num] || `نتيجة #${code}`) : (DECISION_RESULTS[num] || `Result #${code}`);
};

/**
 * Fetch Legal Court Decisions
 * Endpoint: GET /api/Legal/getLegalCourtDecision
 */
export const getLegalCourtDecision = async (params?: {
  TlcdRecId?: number | string;
  TlchRecId?: number | string;
  TllcRecId?: number | string;
  CifId?: number | string;
  LoanId?: number | string;
  Language?: number | string;
  [key: string]: any;
}): Promise<LegalCourtDecisionRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalCourtDecision`, {
      params,
    });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === "object" && (raw.TLCDRECID || raw.tlcdRecId || raw.CIFID)) {
      return [raw];
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching Legal Court Decisions:", error);
    return [];
  }
};

/**
 * Add Legal Court Decision
 * Endpoint: POST /api/Legal/addLegalCourtDecision
 */
export const addLegalCourtDecision = async (
  payload: AddLegalCourtDecisionPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(`${hostUrl}/api/Legal/addLegalCourtDecision`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Court Decision added successfully",
    };
  } catch (error: any) {
    console.error("Error adding Court Decision:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to add Court Decision",
    };
  }
};

/**
 * Update Legal Court Decision
 * Endpoint: PUT /api/Legal/updateLegalCourtDecision/{id}
 */
export const updateLegalCourtDecision = async (
  id: number | string,
  payload: AddLegalCourtDecisionPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.put(`${hostUrl}/api/Legal/updateLegalCourtDecision/${id}`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Court Decision updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating Court Decision:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to update Court Decision",
    };
  }
};

/**
 * Delete Legal Court Decision
 * Endpoint: DELETE /api/Legal/deleteLegalCourtDecision/{id}
 */
export const deleteLegalCourtDecision = async (
  id: number | string,
  updateBy?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.delete(`${hostUrl}/api/Legal/deleteLegalCourtDecision/${id}`, {
      params: updateBy ? { updateBy } : undefined,
    });
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      message:
        resData?.responsedescription || resData?.message || "Court Decision deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting Court Decision:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to delete Court Decision",
    };
  }
};

/* ====================================================================
 * LEGAL COURT HEARING MODELS & APIS
 * Swagger Endpoints:
 * - POST   /api/Legal/addLegalCourtHearing
 * - PUT    /api/Legal/updateLegalCourtHearing/{id}
 * - DELETE /api/Legal/deleteLegalCourtHearing/{id}
 * - GET    /api/Legal/getLegalCourtHearing
 * ==================================================================== */

export interface LegalCourtHearingRecord {
  tlchRecId?: number;
  TLCH_RECID?: number;
  TLCHRECID?: number;
  id?: number;
  tllcRecId: number;
  TLLCRECID?: number;
  cifId: number;
  CIFID?: number;
  loanId?: number;
  LOANID?: number;
  vbLegalCourtEvent?: number | string;
  VB_LEGALCOURTEVENT?: number | string;
  legalCourtEvent?: string;
  LEGALCOURTEVENT?: string;
  hearingReference?: string;
  HEARINGREFERENCE?: string;
  courtName?: string;
  COURTNAME?: string;
  hearingDate?: string;
  HEARINGDATE?: string;
  hearingDetails?: string;
  HEARINGDETAILS?: string;
  attendedBy?: string;
  ATTENDEDBY?: string;
  nextHearingDate?: string;
  NEXTHEARINGDATE?: string;
  updateDate?: string;
  UPDATEDATE?: string;
  updateBy?: string;
  UPDATEBY?: string;
  [key: string]: any;
}

export interface AddLegalCourtHearingPayload {
  tllcRecId: number;
  cifId: number;
  loanId?: number;
  vbLegalCourtEvent?: number | string;
  hearingReference?: string;
  courtName?: string;
  hearingDate?: string;
  hearingDetails?: string;
  attendedBy?: string;
  nextHearingDate?: string;
  updateDate?: string;
  updateBy?: string;
}

export const COURT_EVENTS: Record<number, string> = {
  1: "Preliminary Hearing",
  2: "Pleading & Evidence Session",
  3: "Judicial Verification Session",
  4: "Expert Consultation",
  5: "Pronouncement of Judgment",
  6: "Post-Judgment / Appeal Hearing",
};

export const COURT_EVENTS_AR: Record<number, string> = {
  1: "جلسة تمهيدية",
  2: "جلسة مرافعة وتقديم بينات",
  3: "جلسة تدقيق ومطابقة",
  4: "جلسة خبرة قضائية",
  5: "جلسة نطق بالحكم",
  6: "جلسة استئناف / مراجعة",
};

export const getCourtEventText = (code: number | string, lang: number = 1): string => {
  const num = Number(code);
  return lang === 2 ? (COURT_EVENTS_AR[num] || `جلسة #${code}`) : (COURT_EVENTS[num] || `Session #${code}`);
};

/**
 * Fetch Legal Court Hearings
 * Endpoint: GET /api/Legal/getLegalCourtHearing
 */
export const getLegalCourtHearing = async (params?: {
  TlchRecId?: number | string;
  TllcRecId?: number | string;
  CifId?: number | string;
  LoanId?: number | string;
  Language?: number | string;
  [key: string]: any;
}): Promise<LegalCourtHearingRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalCourtHearing`, {
      params,
    });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === "object" && (raw.TLCHRECID || raw.tlchRecId || raw.CIFID)) {
      return [raw];
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching Legal Court Hearings:", error);
    return [];
  }
};

/**
 * Add Legal Court Hearing
 * Endpoint: POST /api/Legal/addLegalCourtHearing
 */
export const addLegalCourtHearing = async (
  payload: AddLegalCourtHearingPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(`${hostUrl}/api/Legal/addLegalCourtHearing`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Court Hearing added successfully",
    };
  } catch (error: any) {
    console.error("Error adding Court Hearing:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to add Court Hearing",
    };
  }
};

/**
 * Update Legal Court Hearing
 * Endpoint: PUT /api/Legal/updateLegalCourtHearing/{id}
 */
export const updateLegalCourtHearing = async (
  id: number | string,
  payload: AddLegalCourtHearingPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.put(`${hostUrl}/api/Legal/updateLegalCourtHearing/${id}`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Court Hearing updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating Court Hearing:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to update Court Hearing",
    };
  }
};

/**
 * Delete Legal Court Hearing
 * Endpoint: DELETE /api/Legal/deleteLegalCourtHearing/{id}
 */
export const deleteLegalCourtHearing = async (
  id: number | string,
  updateBy?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.delete(`${hostUrl}/api/Legal/deleteLegalCourtHearing/${id}`, {
      params: updateBy ? { updateBy } : undefined,
    });
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      message:
        resData?.responsedescription || resData?.message || "Court Hearing deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting Court Hearing:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to delete Court Hearing",
    };
  }
};

/* ====================================================================
 * LEGAL CUSTOMER OBJECTION MODELS & APIS
 * Swagger Endpoints:
 * - POST   /api/Legal/addLegalCustObjection
 * - PUT    /api/Legal/updateLegalCustObjection/{id}
 * - DELETE /api/Legal/deleteLegalCustObjection/{id}
 * - GET    /api/Legal/getLegalCustObjection
 * ==================================================================== */

export interface LegalCustObjectionRecord {
  tlcoRecId?: number;
  TLCORECID?: number;
  tllcRecId: number;
  TLLCRECID?: number;
  cifId: number;
  CIFID?: number;
  loanId: number;
  LOANID?: number;
  vbLegalObjectionType: number | string;
  VB_LEGALOBJECTIONTYPE?: number;
  legalObjectionType?: string;
  LEGALOBJECTIONTYPE?: string;
  objectionReference: string;
  OBJECTIONREFERENCE?: string;
  objectionDate: string;
  OBJECTIONDATE?: string;
  objectionDetails: string;
  OBJECTIONDETAILS?: string;
  vbLegalObjectionStatus: number | string;
  VB_LEGALOBJECTIONSTATUS?: number;
  legalObjectionStatus?: string;
  LEGALOBJECTIONSTATUS?: string;
  statusDate: string;
  STATUSDATE?: string;
  statusDetails?: string;
  STATUSDETAILS?: string;
  isResolved?: boolean;
  ISRESOLVED?: boolean;
  updateDate?: string;
  UPDATEDATE?: string;
  updateBy?: string;
  UPDATEBY?: string;
  [key: string]: any;
}

export interface AddLegalCustObjectionPayload {
  tllcRecId: number;
  cifId: number;
  loanId: number;
  vbLegalObjectionType: number;
  objectionReference: string;
  objectionDate: string;
  objectionDetails: string;
  vbLegalObjectionStatus: number;
  statusDate: string;
  statusDetails: string;
  isResolved: boolean;
  updateDate: string;
  updateBy: string;
}

export const OBJECTION_TYPES: Record<number, string> = {
  1: "Procedural Dispute",
  2: "Substantive Debt Contest",
  3: "Sanction Suspension Plea",
  4: "Prior Settlement / Discharge",
  5: "Jurisdiction Contest",
};

export const OBJECTION_TYPES_AR: Record<number, string> = {
  1: "منازعة شكلية / إجرائية",
  2: "منازعة موضوعية في أصل الحق",
  3: "طلب وقف تدابير المادة 46",
  4: "الدفع بالسداد أو إبراء الذمة",
  5: "الدفع بعدم الاختصاص الولائي",
};

export const OBJECTION_STATUSES: Record<number, string> = {
  1: "Under Review",
  2: "Hearing Scheduled",
  3: "Suspension Granted",
  4: "Rejected / Overruled",
  5: "Settled & Closed",
};

export const OBJECTION_STATUSES_AR: Record<number, string> = {
  1: "قيد المراجعة والدراسة",
  2: "محدد له جلسة استماع",
  3: "مقبول مع وقف التنفيذ مؤقتاً",
  4: "مرفوض / تأييد صحة السند",
  5: "منتهي بالتسوية أو الإغلاق",
};

export const getObjectionTypeText = (code: number | string, lang: number = 1): string => {
  const num = Number(code);
  return lang === 2 ? (OBJECTION_TYPES_AR[num] || `نوع #${code}`) : (OBJECTION_TYPES[num] || `Type #${code}`);
};

export const getObjectionStatusText = (code: number | string, lang: number = 1): string => {
  const num = Number(code);
  return lang === 2 ? (OBJECTION_STATUSES_AR[num] || `حالة #${code}`) : (OBJECTION_STATUSES[num] || `Status #${code}`);
};

/**
 * 1. Get Legal Customer Objections
 * Endpoint: GET /api/Legal/getLegalCustObjection
 */
export const getLegalCustObjection = async (params?: {
  TllcRecId?: number | string;
  CifId?: number | string;
  LoanId?: number | string;
  Language?: number;
  [key: string]: any;
}): Promise<LegalCustObjectionRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalCustObjection`, {
      params,
    });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === "object" && (raw.TLCORECID || raw.tlcoRecId || raw.CIFID || raw.OBJECTIONREFERENCE)) {
      return [raw];
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching Legal Customer Objections:", error);
    return [];
  }
};

/**
 * 2. Add Legal Customer Objection
 * Endpoint: POST /api/Legal/addLegalCustObjection
 */
export const addLegalCustObjection = async (
  payload: AddLegalCustObjectionPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(`${hostUrl}/api/Legal/addLegalCustObjection`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Customer Objection added successfully",
    };
  } catch (error: any) {
    console.error("Error adding Legal Customer Objection:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to add Customer Objection",
    };
  }
};

/**
 * 3. Update Legal Customer Objection
 * Endpoint: PUT /api/Legal/updateLegalCustObjection/{id}
 */
export const updateLegalCustObjection = async (
  id: number | string,
  payload: AddLegalCustObjectionPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.put(`${hostUrl}/api/Legal/updateLegalCustObjection/${id}`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Customer Objection updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating Legal Customer Objection:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to update Customer Objection",
    };
  }
};

/**
 * 4. Delete Legal Customer Objection
 * Endpoint: DELETE /api/Legal/deleteLegalCustObjection/{id}
 */
export const deleteLegalCustObjection = async (
  id: number | string,
  updateBy?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.delete(`${hostUrl}/api/Legal/deleteLegalCustObjection/${id}`, {
      params: updateBy ? { updateBy } : undefined,
    });
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      message:
        resData?.responsedescription || resData?.message || "Customer Objection deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting Legal Customer Objection:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to delete Customer Objection",
    };
  }
};

/* ====================================================================
 * 8. LEGAL CASE SETTLEMENT & RESTRUCTURING APIS
 * - POST   /api/Legal/addLegalCaseSettlement
 * - PUT    /api/Legal/updateLegalCaseSettlement/{id}
 * - DELETE /api/Legal/deleteLegalCaseSettlement/{id}
 * - GET    /api/Legal/getLegalCaseSettlement
 * ==================================================================== */

export interface LegalCaseSettlementRecord {
  tlcsRecId?: number;
  TLCSRECID?: number;
  tlsRecId?: number;
  TLSRECID?: number;
  tlscRecId?: number;
  TLSCRECID?: number;
  tllcsRecId?: number;
  TLLCSRECID?: number;
  id?: number | string;
  ID?: number | string;
  tllcRecId: number;
  TLLCRECID?: number;
  cifId: number;
  CIFID?: number;
  loanId: number;
  LOANID?: number;
  vbLegalSettlementType: number | string;
  VB_LEGALSETTLEMENTTYPE?: number;
  legalSettlementType?: string;
  LEGALSETTLEMENTTYPE?: string;
  settlementReference: string;
  SETTLEMENTREFERENCE?: string;
  settlementDate: string;
  SETTLEMENTDATE?: string;
  settlementDetails: string;
  SETTLEMENTDETAILS?: string;
  claimAmount?: number;
  CLAIMAMOUNT?: number;
  proposedAmount?: number;
  PROPOSEDAMOUNT?: number;
  approvedAmount?: number;
  APPROVEDAMOUNT?: number;
  downPaymentAmount?: number;
  DOWNPAYMENTAMOUNT?: number;
  downPaymentDate?: string;
  DOWNPAYMENTDATE?: string;
  noOfInstallments?: number;
  NOOFINSTALLMENTS?: number;
  firstInstallmentAmount?: number;
  FIRSTINSTALLMENTAMOUNT?: number;
  firstInstallmentDate?: string;
  FIRSTINSTALLMENTDATE?: string;
  isApproved?: boolean;
  ISAPPROVED?: boolean;
  approvalDetails?: string;
  APPROVALDETAILS?: string;
  updateDate?: string;
  UPDATEDATE?: string;
  updateBy?: string;
  UPDATEBY?: string;
  [key: string]: any;
}

export interface AddLegalCaseSettlementPayload {
  tlcsRecId?: number;
  TLCSRECID?: number;
  tllcRecId: number;
  cifId: number;
  loanId: number;
  vbLegalSettlementType: number;
  settlementReference: string;
  settlementDate: string;
  settlementDetails: string;
  claimAmount: number;
  proposedAmount: number;
  approvedAmount: number;
  downPaymentAmount: number;
  downPaymentDate: string;
  noOfInstallments: number;
  firstInstallmentAmount: number;
  firstInstallmentDate: string;
  isApproved: boolean;
  approvalDetails: string;
  updateDate: string;
  updateBy: string;
  [key: string]: any;
}

export const SETTLEMENT_TYPES: Record<number, string> = {
  1: "Lump Sum Settlement",
  2: "Installment Restructuring",
  3: "Partial Debt Waiver",
  4: "Judicial Settlement Deed",
  5: "Pre-Litigation Reconciliation",
};

export const SETTLEMENT_TYPES_AR: Record<number, string> = {
  1: "تسوية سداد دفعة واحدة",
  2: "إعادة جدولة وتقسيط",
  3: "إعفاء جزئي وتنازل",
  4: "محضر صلح قضائي",
  5: "مصالحة ودية قبل التقاضي",
};

export const getSettlementTypeText = (code: number | string, lang: number = 1): string => {
  const num = Number(code);
  return lang === 2 ? (SETTLEMENT_TYPES_AR[num] || `تسوية #${code}`) : (SETTLEMENT_TYPES[num] || `Settlement #${code}`);
};

/**
 * 1. Get Legal Case Settlements
 * Endpoint: GET /api/Legal/getLegalCaseSettlement
 */
export const getLegalCaseSettlement = async (params?: {
  TllcRecId?: number | string;
  CifId?: number | string;
  LoanId?: number | string;
  Language?: number;
  [key: string]: any;
}): Promise<LegalCaseSettlementRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalCaseSettlement`, {
      params,
    });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (
      raw &&
      typeof raw === "object" &&
      (raw.TLCSRECID || raw.tlcsRecId || raw.TLSRECID || raw.tlsRecId || raw.TLSCRECID || raw.tlscRecId || raw.SETTLEMENTREFERENCE || raw.CIFID)
    ) {
      return [raw];
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching Legal Case Settlements:", error);
    return [];
  }
};

/**
 * 2. Add Legal Case Settlement
 * Endpoint: POST /api/Legal/addLegalCaseSettlement
 */
export const addLegalCaseSettlement = async (
  payload: AddLegalCaseSettlementPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(`${hostUrl}/api/Legal/addLegalCaseSettlement`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Settlement record added successfully",
    };
  } catch (error: any) {
    console.error("Error adding Legal Case Settlement:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to add Legal Case Settlement",
    };
  }
};

/**
 * 3. Update Legal Case Settlement
 * Endpoint: PUT /api/Legal/updateLegalCaseSettlement/{id}
 */
export const updateLegalCaseSettlement = async (
  id: number | string,
  payload: AddLegalCaseSettlementPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.put(`${hostUrl}/api/Legal/updateLegalCaseSettlement/${id}`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Settlement record updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating Legal Case Settlement:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to update Legal Case Settlement",
    };
  }
};

/**
 * 4. Delete Legal Case Settlement
 * Endpoint: DELETE /api/Legal/deleteLegalCaseSettlement/{id}
 */
export const deleteLegalCaseSettlement = async (
  id: number | string,
  updateBy?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.delete(`${hostUrl}/api/Legal/deleteLegalCaseSettlement/${id}`, {
      params: updateBy ? { updateBy } : undefined,
    });
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      message:
        resData?.responsedescription || resData?.message || "Settlement record deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting Legal Case Settlement:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to delete Legal Case Settlement",
    };
  }
};

/* ====================================================================
 * LEGAL REQUIRED DOCUMENT MODELS & APIS
 * Swagger Endpoints:
 * - POST   /api/Legal/addLegalRequiredDocument
 * - DELETE /api/Legal/deleteLegalRequiredDocument/{id}
 * - GET    /api/Legal/getLegalRequiredDocument
 * ==================================================================== */

export interface LegalRequiredDocumentRecord {
  tlrdRecId?: number;
  TLRDRECID?: number;
  tlldRecId?: number;
  TLLDRECID?: number;
  tldRecId?: number;
  TLDRECID?: number;
  tadRecId?: number;
  TADRECID?: number;
  id?: number | string;
  ID?: number | string;
  tllcRecId: number;
  TLLCRECID?: number;
  cifId: number;
  CIFID?: number;
  loanId: number;
  LOANID?: number;
  documentId: number;
  DOCUMENTID?: number;
  vbRequiredValidation: number;
  VBREQUIREDVALIDATION?: number;
  VB_REQUIREDVALIDATION?: number;
  dmsDocId?: number | null;
  DMSDOCID?: number | null;
  fileName?: string | null;
  FILENAME?: string | null;
  documentFormat?: string | null;
  DOCUMENTFORMAT?: string | null;
  uploadDate?: string | null;
  UPLOADDATE?: string | null;
  uploadBy?: string | null;
  UPLOADBY?: string | null;
  stageName?: string | null;
  STAGENAME?: string | null;
  othDesc1?: string | null;
  othDesc2?: string | null;
  othDesc3?: string | null;
  othDesc4?: string | null;
  maker?: string | null;
  MAKER?: string | null;
  makeDate?: string | null;
  MAKEDATE?: string | null;
  updateBy?: string | null;
  UPDATEBY?: string | null;
  updateDate?: string | null;
  UPDATEDATE?: string | null;
  recStatus?: boolean;
  RECSTATUS?: boolean;
  DOCUMENTNAME?: string;
  documentName?: string;
  DOCUMENTTITLE?: string;
  DOCUMENTDESC?: string;
  DOCUMENTTYPE?: string;
  [key: string]: any;
}

export interface AddLegalRequiredDocumentPayload {
  tllcRecId: number;
  cifId: number;
  loanId: number;
  documentId: number;
  vbRequiredValidation: number;
  dmsDocId?: number | null;
  fileName?: string | null;
  documentFormat?: string | null;
  uploadDate?: string | null;
  uploadBy?: string | null;
  stageName?: string | null;
  othDesc1?: string | null;
  othDesc2?: string | null;
  othDesc3?: string | null;
  othDesc4?: string | null;
  maker?: string | null;
  makeDate?: string | null;
  updateBy?: string | null;
  updateDate?: string | null;
  recStatus?: boolean;
}

/**
 * Robust helper to resolve Legal Required Document Primary Key ID
 */
export const getDocumentRecordId = (item: any): number | string => {
  if (!item || typeof item !== "object") return 0;
  const directId =
    item.TLRDRECID ??
    item.tlrdRecId ??
    item.TLLDRECID ??
    item.tlldRecId ??
    item.TLDRECID ??
    item.tldRecId ??
    item.TADRECID ??
    item.tadRecId ??
    item.DOCRECID ??
    item.docRecId ??
    item.DOCUMENTRECID ??
    item.ID ??
    item.id;

  if (directId !== undefined && directId !== null && directId !== "") {
    return directId;
  }

  for (const [key, val] of Object.entries(item)) {
    const upper = key.toUpperCase();
    if (
      upper.endsWith("RECID") &&
      !upper.includes("TLLC") &&
      !upper.includes("TMCA") &&
      !upper.includes("CIF") &&
      !upper.includes("LOAN") &&
      !upper.includes("DMS")
    ) {
      if (val !== undefined && val !== null && val !== "") return val as any;
    }
  }

  return item.id || 0;
};

/**
 * 1. Fetch Legal Required Documents
 * Endpoint: GET /api/Legal/getLegalRequiredDocument
 */
export const getLegalRequiredDocument = async (params?: {
  tllcRecId?: number | string;
  TLLCRECID?: number | string;
  cifId?: number | string;
  CIFID?: number | string;
  loanId?: number | string;
  LOANID?: number | string;
  [key: string]: any;
}): Promise<LegalRequiredDocumentRecord[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(`${hostUrl}/api/Legal/getLegalRequiredDocument`, {
      params,
    });
    const raw = response.data?.data ?? response.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === "object") {
      return [raw];
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching Legal Required Documents:", error);
    return [];
  }
};

/**
 * 2. Add Legal Required Document
 * Endpoint: POST /api/Legal/addLegalRequiredDocument
 */
export const addLegalRequiredDocument = async (
  payload: AddLegalRequiredDocumentPayload
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(`${hostUrl}/api/Legal/addLegalRequiredDocument`, payload);
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200 ||
      response.status === 201;

    return {
      success: isSuccess,
      data: resData?.data ?? resData,
      message:
        resData?.responsedescription || resData?.message || "Required document added successfully",
    };
  } catch (error: any) {
    console.error("Error adding Legal Required Document:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to add Legal Required Document",
    };
  }
};

/**
 * 3. Delete Legal Required Document
 * Endpoint: DELETE /api/Legal/deleteLegalRequiredDocument/{id}
 */
export const deleteLegalRequiredDocument = async (
  id: number | string,
  updateBy?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.delete(
      `${hostUrl}/api/Legal/deleteLegalRequiredDocument/${id}`,
      {
        params: updateBy ? { updateBy } : undefined,
      }
    );
    const resData = response.data;
    const isSuccess =
      resData?.succeeded === true ||
      resData?.statuscode === 200 ||
      resData?.responsestatus === true ||
      response.status === 200;

    return {
      success: isSuccess,
      message:
        resData?.responsedescription ||
        resData?.message ||
        "Required document deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting Legal Required Document:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.responsedescription ||
        error?.message ||
        "Failed to delete Legal Required Document",
    };
  }
};

/**
 * 4. Get Master Workflow Documents for Dropdown
 * Endpoint: GET /api/WfMasterDocuments/GetWfMasterDocument
 */
export const getWfMasterDocuments = async (): Promise<any[]> => {
  try {
    const baseUrl = process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
    const response = await axios.get(`${baseUrl}/api/WfMasterDocuments/GetWfMasterDocument`);
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw) ? raw : [];
  } catch (error: any) {
    console.error("Error fetching WfMasterDocuments:", error);
    return [];
  }
};

/**
 * 5. Workflow Transaction Checklist Interfaces & APIs
 * Endpoints:
 *   GET /api/WfTransactionChecklistUpdate
 *   PUT /api/WfTransactionChecklistUpdate
 */
export interface WfTransactionChecklistItem {
  TWTCRECID: number;
  TWTRECID?: number;
  CHECKLISTID?: number | null;
  VB_REQUIREDVALIDATION?: number;
  REQUIREDVALIDATION?: string;
  CHECKLISTSTATUS: boolean;
  OTHDESC1?: string | null;
  OTHDESC2?: string | null;
  OTHDESC3?: string | null;
  OTHDESC4?: string | null;
  MAKEDATE?: string;
  UPDATEDATE?: string | null;
  RECSTATUS?: boolean;
  [key: string]: any;
}

export interface UpdateChecklistStatusPayload {
  twtcrecid: number;
  checkliststatus: boolean;
}

export const getWfTransactionChecklists = async (params?: {
  twtrecid?: number | string;
}): Promise<WfTransactionChecklistItem[]> => {
  try {
    const baseUrl = process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
    const response = await axios.get(`${baseUrl}/api/WfTransactionChecklistUpdate`, {
      params: params?.twtrecid ? { twtrecid: params.twtrecid } : undefined,
    });
    const resData = response.data;
    if (resData?.data && Array.isArray(resData.data)) {
      return resData.data;
    }
    if (Array.isArray(resData)) {
      return resData;
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching WfTransactionChecklists:", error);
    return [];
  }
};

export const updateWfTransactionChecklistStatus = async (
  payload: UpdateChecklistStatusPayload
) => {
  try {
    const baseUrl = process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
    const response = await axios.put(`${baseUrl}/api/WfTransactionChecklistUpdate`, {
      twtcrecid: Number(payload.twtcrecid),
      checkliststatus: Boolean(payload.checkliststatus),
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating WfTransactionChecklistStatus:", error);
    throw error;
  }
};


