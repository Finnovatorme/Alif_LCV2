import axios from "@/utils/axios";

export interface NotificationNameItem {
  NOTIFICATIONID: number;
  NOTIFICATIONNAME: string;
  [key: string]: any;
}

export interface GetNotificationTemplatePayload {
  notificationid: number;
  cifid?: number | null;
  appcifid?: number | null;
  appid?: number | null;
  idnumber?: string | null;
  language?: number | null;
}

export interface InsertFollowupNotificationPayload {
  notificationid: number;
  vB_NOTIFICATIONTYPE: number;
  notificationtext: string;
  cifid?: number | null;
  appid?: number | null;
  idnumber?: string | null;
  updateby?: string | null;
}

export interface AllNotificationItem {
  NOTIFICATIONID: number;
  NOTIFICATIONNAME?: string;
  NOTIFICATIONNAME1?: string;
  TEMPLATE?: string;
  TEMPLATE1?: string;
  TEMPLATE2?: string;
  TEMPLATE3?: string;
  VB_NOTIFICATIONTYPE?: number;
  NOTIFICATIONTYPE?: string;
  NOTIFICATIONTYPE_VBCODE?: string;
  [key: string]: any;
}

export interface MessageHistoryItem {
  TTMDRECID?: number;
  TMCARECID?: number;
  NOTIFICATIONID?: number;
  VB_NOTIFICATIONTYPE?: number;
  NOTIFICATIONTYPE?: string;
  CONTACTNUMBER?: string;
  CONTACTDATE?: string;
  USERID?: string;
  MESSAGETEXT?: string;
  MESSAGESTATUS?: string | null;
  UPDATEBY?: string;
  UPDATEDATE?: string;
  [key: string]: any;
}

/**
 * 1. Fetch Notification Names by NOTIFICATIONTYPE and LANGUAGE
 * Endpoint: GET /api/Notification/getnotificationnames
 */
export const getNotificationNames = async (params: {
  NOTIFICATIONTYPE?: number | string;
  LANGUAGE?: number | string;
}): Promise<NotificationNameItem[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(
      `${hostUrl}/api/Notification/getnotificationnames`,
      { params }
    );
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching notification names:", error);
    return [];
  }
};

/**
 * 2. Fetch Notification Template for a specific selected notification name
 * Endpoint: POST /api/Notification/getnotificationtemplate
 */
export const getNotificationTemplate = async (
  payload: GetNotificationTemplatePayload
): Promise<string | null> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.post(
      `${hostUrl}/api/Notification/getnotificationtemplate`,
      payload
    );

    const res = response.data;
    if (res?.responsestatus === false || res?.responsecode === "DATA_SELECT_ERROR") {
      console.warn("Backend getnotificationtemplate returned error:", res?.responsedescription);
      return null;
    }

    if (typeof res === "string" && res.trim()) return res;
    if (typeof res?.data === "string" && res.data.trim()) return res.data;
    if (Array.isArray(res?.data) && res.data.length > 0) {
      const first = res.data[0];
      if (first?.Column1 && String(first.Column1).includes("Invalid column")) {
        return null;
      }
      if (typeof first === "string") return first;
      return (
        first?.TEMPLATE ||
        first?.Template ||
        first?.template ||
        first?.MESSAGETEXT ||
        first?.messagetext ||
        null
      );
    }
    if (res?.TEMPLATE) return res.TEMPLATE;
    if (res?.messagetext) return res.messagetext;
    return null;
  } catch (error: any) {
    console.error("Error fetching notification template:", error);
    return null;
  }
};

/**
 * 3. Send / Insert Followup Notification on Send button click
 * Endpoint: POST /api/Notification/insertfollowupnotification
 */
export const insertFollowupNotification = async (
  payload: InsertFollowupNotificationPayload
) => {
  const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
  try {
    const res = await axios.post(
      `${hostUrl}/api/Notification/insertfollowupnotification`,
      payload
    );
    return res.data;
  } catch (error: any) {
    console.warn("insertfollowupnotification failed, trying add-TranMessageDetails backup:", error?.message);
    try {
      const res2 = await axios.post(
        `${hostUrl}/api/TranMessageDetails/add-TranMessageDetails`,
        {
          tmcaRecId: 9,
          notificationId: payload.notificationid,
          vb_NotificationType: payload.vB_NOTIFICATIONTYPE,
          contactNumber: "",
          contactDate: new Date().toISOString(),
          messagetext: payload.notificationtext,
          userId: payload.updateby,
          updateBy: payload.updateby,
          recStatus: true,
        }
      );
      return res2.data;
    } catch (err2: any) {
      console.error("Both notification insert endpoints failed:", err2);
      return { success: false, error: err2?.message || "Failed to send notification" };
    }
  }
};

/**
 * 4. Fetch All Notifications to get template bodies & details as fallback/enrichment
 * Endpoint: GET /api/MstScheduleNotification/get-All-Notification
 */
export const getAllNotifications = async (params?: {
  Language?: number | string;
  NotificationId?: number | string;
  Vb_NotificationType?: number | string;
}): Promise<AllNotificationItem[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(
      `${hostUrl}/api/MstScheduleNotification/get-All-Notification`,
      { params }
    );
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching all notifications:", error);
    return [];
  }
};

/**
 * 5. Fetch Message History for a customer CIF
 * Endpoint: GET /api/TranMessageDetails/get-All-MessageDetails
 */
export const getMessageHistory = async (params: {
  CifId?: number | string | null;
  Language?: number | string;
  UserId?: string;
}): Promise<MessageHistoryItem[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(
      `${hostUrl}/api/TranMessageDetails/get-All-MessageDetails`,
      { params }
    );
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching message history:", error);
    return [];
  }
};

/**
 * 6. Customer Details Get
 */
export const followupCustomerDetailsGet = async (params: Record<string, any>) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(
      `${hostUrl}/api/Customer/get-CustomerDetails`,
      { params }
    );
    const followupCustomerData = (response.data || []).map((item: any, index: number) => {
      return { ...item, id: index + 1 };
    });
    return followupCustomerData;
  } catch (error: any) {
    return { error: error?.message || "Error fetching customer details" };
  }
};

/**
 * 7. Followup Details Get
 */
export const followupDetailsGet = async (params: Record<string, any>) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(
      `${hostUrl}/api/TranFollowUpDetails/get-FollowUpDetails`,
      { params: params?.params ? params.params : params }
    );
    const followupData = (response.data || []).map((item: any, index: number) => {
      return { ...item, id: index + 1 };
    });
    return followupData;
  } catch (error: any) {
    return { error: error?.message || "Error fetching followup details" };
  }
};

/**
 * 8. Fetch customer contracts/loan data to get real APPID/LOANID
 * Endpoint: GET /api/Customer/get-CustomerContractsList
 */
export const getCustomerContractsList = async (params: {
  CIFID: number | string;
  language?: number | string;
}) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
    const response = await axios.get(
      `${hostUrl}/api/Customer/get-CustomerContractsList`,
      { params }
    );
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching customer contracts:", error);
    return [];
  }
};
