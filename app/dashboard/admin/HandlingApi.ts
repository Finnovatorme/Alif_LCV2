import axios from "@/utils/axios";

export const targetGetData = async (language?: string) => {
  try {
    const response = await axios.get(
      `${process.env.HOST_API_KEY}/api/CnfgTargets/get-CnfgTarget`,
      {
        params: { language, _t: Date.now() },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      const rawData = response.data;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

      return list.map((item: any, index: number) => ({
        ...item,
        id: item.TCTRECID ?? index + 1,
      }));
    } else {
      throw new Error("Failed to fetch data");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};

export interface TargetGroupItem {
  TCTGRECID: number;
  TCTRECID: number;
  VB_LCALLOCATIONGROUP: number;
  ALLOCATIONGROUP?: string;
  LCALLOCATIONGROUP?: string;
  INCENTIVEID: number;
  INCENTIVENAME?: string;
  INCENTIVECODE?: string;
  MAKER?: string;
  MAKEDATE?: string;
  UPDATEBY?: string;
  UPDATEDATE?: string;
  RECSTATUS?: boolean;
  [key: string]: any;
}

export interface TargetGroupPayload {
  tctRecid: number;
  vb_LcAllocationGroup: number;
  incentiveId: number;
  updateBy: string;
  updateDate: string;
  recStatus: boolean;
}

export interface IncentiveItem {
  TCMIRECID: number;
  INCENTIVECODE: string;
  INCENTIVENAME1?: string;
  [key: string]: any;
}

/**
 * 1. Fetch Target Groups
 * Endpoint: GET /api/CnfgTargetsGroup/get-CnfgTargetGroup
 */
export const getTargetGroups = async (params: {
  TctRecid?: number | null;
  TctgRecid?: number | null;
}): Promise<TargetGroupItem[]> => {
  try {
    const hostUrl = process.env.HOST_API_KEY;
    const queryParams: any = {};
    if (
      params.TctRecid !== null &&
      params.TctRecid !== undefined &&
      !isNaN(Number(params.TctRecid)) &&
      Number(params.TctRecid) > 0
    ) {
      queryParams.TctRecid = Number(params.TctRecid);
    }
    if (
      params.TctgRecid !== null &&
      params.TctgRecid !== undefined &&
      !isNaN(Number(params.TctgRecid)) &&
      Number(params.TctgRecid) > 0
    ) {
      queryParams.TctgRecid = Number(params.TctgRecid);
    }

    const response = await axios.get(
      `${hostUrl}/api/CnfgTargetsGroup/get-CnfgTargetGroup`,
      {
        params: {
          ...queryParams,
          _t: Date.now(),
        },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
    const rawData = response.data;
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

    return list.map((item: any, index: number) => ({
      ...item,
      id: item.TCTGRECID ?? index + 1,
    }));
  } catch (error) {
    console.error("Error fetching target groups:", error);
    return [];
  }
};

/**
 * 2. Fetch Master Incentives
 * Endpoint: GET /api/CnfgMstIncentive on BS server
 */
export const getIncentiveList = async (
  language: number | string = 1
): Promise<IncentiveItem[]> => {
  try {
    const bsUrl = process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
    const response = await axios.get(`${bsUrl}/api/CnfgMstIncentive`, {
      params: { Language: language },
    });
    const rawData = response.data;
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

    return list;
  } catch (error) {
    console.error("Error fetching incentives list:", error);
    return [];
  }
};

/**
 * 3. Add Target Group
 * Endpoint: POST /api/CnfgTargetsGroup/add-CnfgTargetsGroup
 */
export const addTargetGroup = async (payload: TargetGroupPayload) => {
  const hostUrl = process.env.HOST_API_KEY;
  const response = await axios.post(
    `${hostUrl}/api/CnfgTargetsGroup/add-CnfgTargetsGroup`,
    payload
  );
  return response.data;
};

/**
 * 4. Update Target Group
 * Endpoint: PUT /api/CnfgTargetsGroup/{TctgRecid}
 */
export const updateTargetGroup = async (
  tctgRecid: number | string,
  payload: TargetGroupPayload
) => {
  const hostUrl = process.env.HOST_API_KEY;
  const response = await axios.put(
    `${hostUrl}/api/CnfgTargetsGroup/${tctgRecid}`,
    payload
  );
  return response.data;
};

/**
 * 5. Delete Target Group
 * Endpoint: DELETE /api/CnfgTargetsGroup?TctgRecid=...&TctRecid=...&UpdateBy=...
 */
export const deleteTargetGroup = async (params: {
  TctgRecid: number | string;
  TctRecid: number | string;
  UpdateBy: string;
}) => {
  const hostUrl = process.env.HOST_API_KEY;
  const response = await axios.delete(
    `${hostUrl}/api/CnfgTargetsGroup`,
    {
      params: {
        TctgRecid: params.TctgRecid,
        TctRecid: params.TctRecid,
        UpdateBy: params.UpdateBy,
      },
    }
  );
  return response.data;
};
