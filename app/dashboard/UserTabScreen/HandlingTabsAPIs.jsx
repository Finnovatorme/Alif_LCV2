import axios from "@/utils/axios";

export const applicationGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(`${baseUrl}/api/APPL_APPLICATION`, {
      params,
    });
    const applicationData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return applicationData;
  } catch (error) {
    return { error: error.message };
  }
};

//************* CUSTOMER TABS ***************

export const customerDetailsGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(`${baseUrl}/api/ApplCifCustDetails`, {
      params,
    });
    const customerDetailsData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return customerDetailsData;
  } catch (error) {
    return { error: error.message };
  }
};

export const customerAddressGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplCifAddress`,
      { params },
    );
    const customerAddressData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return customerAddressData;
  } catch (error) {
    return { error: error.message };
  }
};

export const customerAffiliationGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplCifAffiliation`,
      { params },
    );
    const customerAffiliationData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return customerAffiliationData;
  } catch (error) {
    return { error: error.message };
  }
};

export const customerBankGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplCifBank`,
      { params },
    );
    const customerBankData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return customerBankData;
  } catch (error) {
    return { error: error.message };
  }
};
export const customerExpenseMasterGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplCifExpMastr`,
      { params },
    );
    const customerExpenseMasterData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return customerExpenseMasterData;
  } catch (error) {
    return { error: error.message };
  }
};
export const customerExpenseDetailsGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplCifExpenseDetails`,
      { params },
    );
    const customerExpenseDetailsData = await response.data.map(
      (item, index) => {
        return { ...item, id: index + 1 };
      },
    );
    return customerExpenseDetailsData;
  } catch (error) {
    return { error: error.message };
  }
};

export const customerIdentificationGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplCifIdentification`,
      { params },
    );
    const customerIdentificationData = await response.data.map(
      (item, index) => {
        return { ...item, id: index + 1 };
      },
    );
    return customerIdentificationData;
  } catch (error) {
    return { error: error.message };
  }
};

export const customerIncomeGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(`${baseUrl}/api/ApplCifIncome`, { params });
    const customerIncomeData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return customerIncomeData;
  } catch (error) {
    return { error: error.message };
  }
};

export const customerLiabilitiesGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplCifLiabilities`,
      { params },
    );
    const customerLiabilitiesData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return customerLiabilitiesData;
  } catch (error) {
    return { error: error.message };
  }
};

export const customerEmploymentGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplCifEmployment`,
      { params },
    );
    const customerEmploymentData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return customerEmploymentData;
  } catch (error) {
    return { error: error.message };
  }
};

// *************** ASSET TAB ***************
export const assetDetailsGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/AssetDetail`,
      { params },
    );
    const assetDetailsData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return assetDetailsData;
  } catch (error) {
    return { error: error.message };
  }
};

// *************** SCHEME TAB ***************
export const selectedSchemes = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplScheme`,
      { params },
    );
    const selectedSchemesData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return selectedSchemesData;
  } catch (error) {
    return { error: error.message };
  }
};
export const schemesOffersGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplSchemeOffer`,
      { params },
    );
    const schemesOffersData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return schemesOffersData;
  } catch (error) {
    return { error: error.message };
  }
};
export const schemeChargeMasterGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplSchemeChargeMaster`,
      { params },
    );
    const schemeChargeMasterData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return schemeChargeMasterData;
  } catch (error) {
    return { error: error.message };
  }
};
export const schemeDueDayGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplSchemeDueday`,
      { params },
    );
    const schemeDueDayData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return schemeDueDayData;
  } catch (error) {
    return { error: error.message };
  }
};
export const schemeProfitRateGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplSchemeProfitRate`,
      { params },
    );
    const schemeProfitRateData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return schemeProfitRateData;
  } catch (error) {
    return { error: error.message };
  }
};

// *************** SIGNING TAB ***************
export const promissoryNoteGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/GetApplPromissorynotes`,
      { params },
    );
    const promissoryNoteData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return promissoryNoteData;
  } catch (error) {
    return { error: error.message };
  }
};

export const tawarruqTransactionGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/OfferTawarruq_Transaction`,
      { params },
    );
    const tawarruqTransactionData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return tawarruqTransactionData;
  } catch (error) {
    return { error: error.message };
  }
};

export const offerContractSigningGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/OfferContractSigning`,
      { params },
    );
    const offerContractSigningData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return offerContractSigningData;
  } catch (error) {
    return { error: error.message };
  }
};
// ********************* OFFER TAB ***************************
export const loanOfferGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplLoanOffer`,
      { params },
    );
    const loanOfferData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return loanOfferData;
  } catch (error) {
    return { error: error.message };
  }
};
export const repaymentScheduleGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplRepaySch`,
      { params },
    );
    const repaymentScheduleData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return repaymentScheduleData;
  } catch (error) {
    return { error: error.message };
  }
};

// ********************* COMMENTS TAB ***************************
export const commentsGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplComment`,
      { params },
    );
    const commentsData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return commentsData;
  } catch (error) {
    return { error: error.message };
  }
};

export const notificationsGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplNotification`,
      { params },
    );
    const notificationsData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return notificationsData;
  } catch (error) {
    return { error: error.message };
  }
};
export const auditTrailGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/ApplicationAuditTrail`,
      { params },
    );
    const auditTrailData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return auditTrailData;
  } catch (error) {
    return { error: error.message };
  }
};

// **** DISBURSEMENT TAB ****
export const loanBookingGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/DisbursmentLoanBooking`,
      { params },
    );
    const loanBookingData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return loanBookingData;
  } catch (error) {
    return { error: error.message };
  }
};
export const loanFundingGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(
      `${baseUrl}/api/DisbursmentFunding`,
      { params },
    );
    const loanFundingData = await response.data.map((item, index) => {
      return { ...item, id: index + 1 };
    });
    return loanFundingData;
  } catch (error) {
    return { error: error.message };
  }
};

// Credit Tab
export const userCreditDetailsGet = async (params) => {
  try {
    const baseUrl = process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
    const response = await axios.get(`${baseUrl}/api/ApplCreditDetails`, {
      params,
    });
    return response.data;
  } catch (error) {
    return { error: error.message };
  }
};

// **** REPORTS ****

export const consumerCreditReport = async (params) => {
  try {
    const response = await axios.post(
      `${process.env.LO_API_KEY}/api/reports/export`,
      {
        ReportName: "ConsumerCreditReport",
        Format: "pdf",
        Parameters: {
          "@REPORTID": "null",
          "@APPID": params.APPID,
          "@CIFID": params.CIFID,
        },
      },
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    if (response.data) {
      const base64String = response.data.ReportFileBase64;
      const byteCharacters = atob(base64String);
      const byteNumbers = Array.from(byteCharacters, (char) =>
        char.charCodeAt(0),
      );
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      return { data: url };
    } else {
      throw new Error("PDF data is missing in the API response");
    }
  } catch (error) {
    console.error("Error fetching contract document:", error);
  }
};

export const getConsumerContractReport = async (params) => {
  try {
    const response = await axios.post(
      `${process.env.LO_API_KEY}/api/reports/export`,
      {
        ReportName: "Contract",
        Format: "pdf",
        Parameters: {
          "@APPID": params.APPID,
        },
      },
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    if (response.data) {
      const base64String = response.data.ReportFileBase64;
      const byteCharacters = atob(base64String);
      const byteNumbers = Array.from(byteCharacters, (char) =>
        char.charCodeAt(0),
      );
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      return { data: url };
    } else {
      throw new Error("PDF data is missing in the API response");
    }
  } catch (error) {
    console.error("Error fetching contract document:", error);
  }
};

export const getConsumerApplicationForm = async (params) => {
  try {
    const response = await axios.post(
      `${process.env.LO_API_KEY}/api/reports/export`,
      {
        ReportName: "ApplicationForm",
        Format: "pdf",
        Parameters: {
          "@APPID": params.APPID,
        },
      },
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    if (response.data) {
      const base64String = response.data.ReportFileBase64;
      const byteCharacters = atob(base64String);
      const byteNumbers = Array.from(byteCharacters, (char) =>
        char.charCodeAt(0),
      );
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      return { data: url };
    } else {
      throw new Error("PDF data is missing in the API response");
    }
  } catch (error) {
    console.error("Error fetching contract document:", error);
  }
};
