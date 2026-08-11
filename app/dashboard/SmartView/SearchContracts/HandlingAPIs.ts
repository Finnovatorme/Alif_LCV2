import axios from "@/utils/axios";

export const searchContracts = async (params: any) => {
  try {
    const response = await axios.post("/api/host/SearchContracts", params);

    // Check for nested data structure (response.data.data)
    let rawData = [];
    if (response.data && Array.isArray(response.data.data)) {
      rawData = response.data.data;
    } else if (Array.isArray(response.data)) {
      rawData = response.data;
    } else if (response.data && typeof response.data === 'object') {
      const firstKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]));
      if (firstKey) rawData = response.data[firstKey];
    }

    const formattedData = rawData.map((item: any, index: number) => ({
      ...item,
      id: index + 1,
    }));
    return formattedData;
  } catch (error: any) {
    console.error("Error searching contracts:", error);
    return { error: error.message };
  }
};

const extractData = (response: any) => {
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (Array.isArray(response)) return response;
  if (response?.data && typeof response.data === 'object') {
    const firstArrayKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]));
    if (firstArrayKey) return response.data[firstArrayKey];
  }
  return [];
};

export const getCustomerDetails = async (params: any) => {
  try {
    const response = await axios.get("/api/host/CustomerDetails", { params });
    // If response.data.data exists and is an object, return it. Otherwise return response.data
    if (response.data?.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getCustomerAddress = async (params: any) => {
  try {
    const response = await axios.get("/api/host/CustomerAddress", { params });
    return extractData(response.data);
  } catch (error: any) {
    return [];
  }
};

export const getCustomerEmployment = async (params: any) => {
  try {
    const response = await axios.get("/api/host/CustomerEmployment", { params });
    return extractData(response.data);
  } catch (error: any) {
    return [];
  }
};

export const getCustomerBank = async (params: any) => {
  try {
    const response = await axios.get("/api/host/CustomerBank", { params });
    return extractData(response.data);
  } catch (error: any) {
    return [];
  }
};

export const getCustomerAssetCommodity = async (params: any) => {
  try {
    const response = await axios.get("/api/host/CustomerAssetCommodity", { params });
    return extractData(response.data);
  } catch (error: any) {
    return [];
  }
};

export const getTransactionAuditTrail = async (params: any) => {
  try {
    const response = await axios.get("/api/host/LM_INTEGRATION/GetTransactionAuditTrail", { params });
    return extractData(response.data);
  } catch (error: any) {
    return [];
  }
};

export const getCustomerContractDetails = async (params: any) => {
  try {
    const response = await axios.get("/api/host/CustomerContractDetails", { params });
    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getRepaymentSchedule = async (params: any) => {
  try {
    const response = await axios.get("/api/host/RepaymentSchedule", { params });
    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getReceipts = async (params: any) => {
  try {
    const response = await axios.get("/api/host/Receipts", { params });
    return extractData(response.data);
  } catch (error: any) {
    return [];
  }
};

export const getCustomerContractReceivables = async (params: any) => {
  try {
    const response = await axios.get("/api/host/CustomerContractReceivables", { params });
    return extractData(response.data);
  } catch (error: any) {
    return [];
  }
};

export const getCustomerContractCharges = async (params: any) => {
  try {
    const response = await axios.get("/api/host/CustomerContractCharges", { params });
    return extractData(response.data);
  } catch (error: any) {
    return [];
  }
};
