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

export const getCustomerContractsList = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const response = await axios.get(
      `${hostUrl}/api/Customer/get-CustomerContractsList`,
      {
        params: {
          "params[CIFID]": cifId,
          "params[language]": language,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching customer contracts list:", error);
    return { error: error?.message || "Failed to fetch contract list" };
  }
};

export const getCustomerDetails = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId || params.cifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      CIFID: cifId,
      language: language,
    };
    if (typeof params === "object") {
      Object.assign(queryParams, params);
      queryParams.CIFID = cifId;
      queryParams.language = language;
    }

    const response = await axios.get(`${hostUrl}/api/Customer/get-CustomerDetails`, {
      params: queryParams,
    });

    const resData = response.data;
    if (resData?.data && typeof resData.data === 'object' && !Array.isArray(resData.data)) {
      return resData.data;
    }
    return resData;
  } catch (error: any) {
    console.error("Error fetching customer details:", error);
    return { error: error?.message || "Failed to fetch customer details" };
  }
};

export const getCustomerAddress = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      CIFID: cifId,
      language: language,
    };
    if (typeof params === "object") {
      Object.assign(queryParams, params);
      queryParams.CIFID = cifId;
      queryParams.language = language;
    }

    const response = await axios.get(`${hostUrl}/api/Customer/get-CustomerAddress`, {
      params: queryParams,
    });
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching customer address:", error);
    return [];
  }
};

export const getCustomerIncome = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId || params.cifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      CIFID: cifId,
      language: language,
    };
    if (typeof params === "object") {
      Object.assign(queryParams, params);
      queryParams.CIFID = cifId;
      queryParams.language = language;
    }

    const response = await axios.get(`${hostUrl}/api/Customer/get-CustomerIncome`, {
      params: queryParams,
    });
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching customer income:", error);
    return [];
  }
};

export const getCustomerLiabilities = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId || params.cifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      CIFID: cifId,
      language: language,
    };
    if (typeof params === "object") {
      Object.assign(queryParams, params);
      queryParams.CIFID = cifId;
      queryParams.language = language;
    }

    const response = await axios.get(`${hostUrl}/api/Customer/get-CustomerLiabilities`, {
      params: queryParams,
    });
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching customer liabilities:", error);
    return [];
  }
};

export const getCustomerEmployment = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const response = await axios.get(
      `${hostUrl}/api/Customer/get-CustomerEmployment`,
      {
        params: {
          "params[CIFID]": cifId,
          "params[language]": language,
        },
      }
    );
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching customer employment:", error);
    return [];
  }
};

export const getCustomerBank = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const response = await axios.get(
      `${hostUrl}/api/Customer/get-CustomerBank`,
      {
        params: {
          "params[CIFID]": cifId,
          "params[language]": language,
        },
      }
    );
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching customer bank details:", error);
    return [];
  }
};

export const getCustomerAssetCommodity = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      CIFID: cifId,
      language: language,
    };
    if (typeof params === "object") {
      Object.assign(queryParams, params);
      queryParams.CIFID = cifId;
      queryParams.language = language;
    }

    const response = await axios.get(
      `${hostUrl}/api/Customer/get-CustomerAssetCommodity`,
      {
        params: queryParams,
      }
    );
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching customer asset and commodity details:", error);
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
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const loanId = typeof params === "object" ? (params.LOANID || params.LoanId || params.loanId) : params;
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId || params.cifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      "params[LOANID]": loanId,
      "params[CIFID]": cifId,
      "params[language]": language,
    };

    const response = await axios.get(`${hostUrl}/api/Customer/get-CustomerContractDetails`, {
      params: queryParams,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching customer contract details:", error);
    return { error: error?.message || "Failed to fetch contract details" };
  }
};

export const getCustomerContractRepayScheduleConsolidated = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const loanId = typeof params === "object" ? (params.LOANID || params.LoanId || params.loanId) : params;
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId || params.cifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      LOANID: loanId,
      CIFID: cifId,
      language: language,
    };
    if (typeof params === "object") {
      Object.assign(queryParams, params);
      queryParams.LOANID = loanId;
      queryParams.CIFID = cifId;
      queryParams.language = language;
    }

    const response = await axios.get(
      `${hostUrl}/api/Customer/get-CustomerContractRepayScheduleConsolidated`,
      { params: queryParams }
    );
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching consolidated repay schedule:", error);
    return [];
  }
};

export const getCustomerContractRepayScheduleAssetWise = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const loanId = typeof params === "object" ? (params.LOANID || params.LoanId || params.loanId) : params;
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId || params.cifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      LOANID: loanId,
      CIFID: cifId,
      language: language,
    };
    if (typeof params === "object") {
      Object.assign(queryParams, params);
      queryParams.LOANID = loanId;
      queryParams.CIFID = cifId;
      queryParams.language = language;
    }

    const response = await axios.get(
      `${hostUrl}/api/Customer/get-CustomerContractRepayScheduleAssetwise`,
      { params: queryParams }
    );
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching assetwise repay schedule:", error);
    return [];
  }
};

export const getRepaymentSchedule = async (params: any) => {
  try {
    const consolidated = await getCustomerContractRepayScheduleConsolidated(params);
    const assetwise = await getCustomerContractRepayScheduleAssetWise(params);
    return {
      Consolidated: consolidated,
      AssetWise: assetwise,
    };
  } catch (error: any) {
    return { error: error?.message || "Failed to fetch repayment schedule" };
  }
};

export const getCustomerContractReceipts = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const loanId = typeof params === "object" ? (params.LOANID || params.LoanId || params.loanId) : params;
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId || params.cifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      LOANID: loanId,
      CIFID: cifId,
      language: language,
    };
    if (typeof params === "object") {
      Object.assign(queryParams, params);
      queryParams.LOANID = loanId;
      queryParams.CIFID = cifId;
      queryParams.language = language;
    }

    const response = await axios.get(`${hostUrl}/api/Customer/get-CustomerContractReceipts`, {
      params: queryParams,
    });
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching customer contract receipts:", error);
    return [];
  }
};

export const getReceipts = getCustomerContractReceipts;

export const getCustomerContractReceivables = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const loanId = typeof params === "object" ? (params.LOANID || params.LoanId || params.loanId) : params;
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId || params.cifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      LOANID: loanId,
      CIFID: cifId,
      language: language,
    };
    if (typeof params === "object") {
      Object.assign(queryParams, params);
      queryParams.LOANID = loanId;
      queryParams.CIFID = cifId;
      queryParams.language = language;
    }

    const response = await axios.get(`${hostUrl}/api/Customer/get-CustomerContractReceivables`, {
      params: queryParams,
    });
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching customer contract receivables:", error);
    return [];
  }
};

export const getCustomerContractCharges = async (params: any) => {
  try {
    const hostUrl = process.env.HOST_API_KEY || "http://173.208.180.149:8098";
    const loanId = typeof params === "object" ? (params.LOANID || params.LoanId || params.loanId) : params;
    const cifId = typeof params === "object" ? (params.CIFID || params.CifId || params.cifId) : params;
    const langInput = typeof params === "object" ? (params.language || params.Language) : 1;
    const language = typeof langInput === "string" ? (langInput === "ar" ? 2 : 1) : (langInput || 1);

    const queryParams: Record<string, any> = {
      "params[LOANID]": loanId,
      "params[CIFID]": cifId,
      "params[language]": language,
    };

    const response = await axios.get(`${hostUrl}/api/Customer/get-CustomerContractCharges`, {
      params: queryParams,
    });
    return extractData(response.data);
  } catch (error: any) {
    console.error("Error fetching customer contract charges:", error);
    return [];
  }
};
