import axios from "@/utils/axios";

export interface UserFollowUpItem {
  id?: number | string;
  TMCARECID?: number;
  TCTRECID?: number;
  CIFID?: string | number;
  CUSTOMERNAME?: string;
  USERID?: string;
  COLLECTORNAME?: string;
  LCALLOCATIONGROUP?: string;
  TOTALOVERDUEAMOUNT?: number | string;
  TOTALOSAMOUNT?: number | string;
  TOTALAMOUNTCOLLECTED?: number | string;
  ALLOCATIONDATE?: string;
  EXPIREDATE?: string;
  RECENTFOLLOWDATE?: string;
  FOLLOWUPDATE?: string;
  ISFOLLOWEDUP?: boolean;
  ISESCALATED?: boolean;
  ESCALATEDTO?: string;
  ESCALATIONDATE?: string;
  LCESCALATIONREASON?: string;
  REMARKS?: string;
  DPD?: number | string;
  APPID?: string | number;
  [key: string]: any;
}

export type FollowUpScreenType = "pending" | "completed" | "escalated";

export interface UserFollowUpQueryParams {
  UserId?: string;
  Language?: number;
  RecStatus?: boolean;
  CasesToReturn?: number;
}

export interface OwnershipCasesResult {
  allCases: UserFollowUpItem[];
  myCases: UserFollowUpItem[];
  subordinateCases: UserFollowUpItem[];
}

const getHostUrl = () => {
  return process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
};

const normalizeList = (raw: any): UserFollowUpItem[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.data && Array.isArray(raw.data)) return raw.data;
  if (raw.PENDING_FOLLOWUP && Array.isArray(raw.PENDING_FOLLOWUP)) return raw.PENDING_FOLLOWUP;
  if (raw.COMPLETE_FOLLOWUP && Array.isArray(raw.COMPLETE_FOLLOWUP)) return raw.COMPLETE_FOLLOWUP;
  if (raw.ESCALATED_CASES && Array.isArray(raw.ESCALATED_CASES)) return raw.ESCALATED_CASES;

  if (typeof raw === "object") {
    for (const key of Object.keys(raw)) {
      if (Array.isArray(raw[key])) {
        return raw[key];
      }
    }
  }
  return [];
};

/**
 * 1. Fetch Pending User Follow-Up cases
 * Endpoint: GET /api/UserFollowUp/getUserFollowUpPending
 * CasesToReturn: 1 = All Cases, 2 = My Cases, 3 = Subordinate Cases
 */
export const getUserFollowUpPending = async (
  params: UserFollowUpQueryParams
): Promise<UserFollowUpItem[]> => {
  try {
    const hostUrl = getHostUrl();
    const queryParams = {
      UserId: params.UserId,
      UserID: params.UserId,
      userId: params.UserId,
      Language: params.Language ?? 1,
      language: params.Language ?? 1,
      RecStatus: params.RecStatus ?? true,
      CasesToReturn: params.CasesToReturn ?? 1,
    };

    const response = await axios.get(
      `${hostUrl}/api/UserFollowUp/getUserFollowUpPending`,
      { params: queryParams }
    );
    return normalizeList(response.data);
  } catch (error: any) {
    console.error("Error fetching pending user follow-ups:", error);
    return [];
  }
};

/**
 * 2. Fetch Completed User Follow-Up cases
 * Endpoint: GET /api/UserFollowUp/getUserFollowUpCompleted
 * CasesToReturn: 1 = All Cases, 2 = My Cases, 3 = Subordinate Cases
 */
export const getUserFollowUpCompleted = async (
  params: UserFollowUpQueryParams
): Promise<UserFollowUpItem[]> => {
  try {
    const hostUrl = getHostUrl();
    const queryParams = {
      UserId: params.UserId,
      UserID: params.UserId,
      userId: params.UserId,
      Language: params.Language ?? 1,
      language: params.Language ?? 1,
      RecStatus: params.RecStatus ?? true,
      CasesToReturn: params.CasesToReturn ?? 1,
    };

    const response = await axios.get(
      `${hostUrl}/api/UserFollowUp/getUserFollowUpCompleted`,
      { params: queryParams }
    );
    return normalizeList(response.data);
  } catch (error: any) {
    console.error("Error fetching completed user follow-ups:", error);
    return [];
  }
};

/**
 * 3. Fetch Escalated User Follow-Up cases
 * Endpoint: GET /api/UserFollowUp/getUserFollowUpEscalated
 * CasesToReturn: 1 = All Cases, 2 = My Cases, 3 = Subordinate Cases
 */
export const getUserFollowUpEscalated = async (
  params: UserFollowUpQueryParams
): Promise<UserFollowUpItem[]> => {
  try {
    const hostUrl = getHostUrl();
    const queryParams = {
      UserId: params.UserId,
      UserID: params.UserId,
      userId: params.UserId,
      Language: params.Language ?? 1,
      language: params.Language ?? 1,
      RecStatus: params.RecStatus ?? true,
      CasesToReturn: params.CasesToReturn ?? 1,
    };

    const response = await axios.get(
      `${hostUrl}/api/UserFollowUp/getUserFollowUpEscalated`,
      { params: queryParams }
    );
    return normalizeList(response.data);
  } catch (error: any) {
    console.error("Error fetching escalated user follow-ups:", error);
    return [];
  }
};

/**
 * Fetch All Cases (1), My Cases (2), and Subordinate Cases (3)
 * for a single dedicated follow-up screen.
 */
export const getFollowUpOwnershipData = async (
  screenType: FollowUpScreenType,
  params: Omit<UserFollowUpQueryParams, "CasesToReturn">
): Promise<OwnershipCasesResult> => {
  const fetcher =
    screenType === "pending"
      ? getUserFollowUpPending
      : screenType === "completed"
      ? getUserFollowUpCompleted
      : getUserFollowUpEscalated;

  const [allCases, myCases, subordinateCases] = await Promise.all([
    fetcher({ ...params, CasesToReturn: 1 }),
    fetcher({ ...params, CasesToReturn: 2 }),
    fetcher({ ...params, CasesToReturn: 3 }),
  ]);

  return {
    allCases,
    myCases,
    subordinateCases,
  };
};
