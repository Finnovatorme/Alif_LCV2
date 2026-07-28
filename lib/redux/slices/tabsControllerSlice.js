import { createSlice } from "@reduxjs/toolkit";

export const tabsControllerSlice = createSlice({
  name: "mainTabs",
  initialState: {
    data: [],
    applicationData: [],

    // **** CUSTOMER TABS ****
    customerDetailsData: [],
    customerAddressData: [],
    customerAffiliationData: [],
    customerBankData: [],
    //customer Expense
    customerExpenseMasterData: [],
    customerExpenseDetailsData: [],
    customerIdentificationData: [],
    customerLiabilitiesData: [],
    customerIncomeData: [],
    customerEmploymentData: [],

    // **** ASSET TAB ****
    assetDetailsData: [],

    // **** SCHEMES TAB ****
    selectedSchemesData: [],
    schemesOffersData: [],
    schemeChargeMasterData: [],
    schemeDueDayData: [],
    schemeProfitRateData: [],

    // **** SIGNING TAB ****
    promissoryNoteData: [],
    tawarruqTransactionData: [],
    offerContractSigningData: [],

    // **** OFFER TAB ****
    loanOfferData: [],
    repaymentScheduleData: [],

    // **** COMMENT TAB ****

    commentsData: [],
    notificationsData: [],
    auditTrailData: [],

    // **** DISBURSEMENT TAB ****
    loanBookingData: [],
    loanFundingData: [],

    // **** CREDIT TAB ****
    creditDetailsData: {
      APPLICATION_DETAILS: [],
      CREDIT_BUREAU_SUMMARY: [],
      CREDIT_ENGINE_SUMMARY: [],
      CREDIT_POLICY_DETAILS: [],
      CREDIT_POLICY_SUMMARY: [],
      REPAYMENT_SCHEDULE: [],
    },

    // **** REPORTS ****
    simahReportData: { data: "" },
    consumerContractData: { data: "" },
    consumerApplFormData: { data: "" },
  },
  reducers: {
    mainTabsData: (state, action) => {
      state.data = action.payload;
      // console.log("mainTabs data", state.data);
    },

    applicationResponse: (state, action) => {
      state.applicationData = action.payload;
    },
    // **** CUSTOMER TABS ****
    customerDetailsResponse: (state, action) => {
      state.customerDetailsData = action.payload;
    },
    customerAddressResponse: (state, action) => {
      state.customerAddressData = action.payload;
    },
    customerAffiliationResponse: (state, action) => {
      state.customerAffiliationData = action.payload;
    },
    customerBankResponse: (state, action) => {
      state.customerBankData = action.payload;
    },

    //customer expense
    customerExpenseMasterResponse: (state, action) => {
      state.customerExpenseMasterData = action.payload;
    },
    customerExpenseDetailsResponse: (state, action) => {
      state.customerExpenseDetailsData = action.payload;
    },

    customerIdentificationResponse: (state, action) => {
      state.customerIdentificationData = action.payload;
    },
    customerLiabilitiesResponse: (state, action) => {
      state.customerLiabilitiesData = action.payload;
    },
    customerIncomeResponse: (state, action) => {
      state.customerIncomeData = action.payload;
    },
    customerEmploymentResponse: (state, action) => {
      state.customerEmploymentData = action.payload;
    },
    // **** ASSET TAB ****
    assetDetailsResponse: (state, action) => {
      state.assetDetailsData = action.payload;
    },

    // **** SCHEMES TAB ****
    selectedschemesResponse: (state, action) => {
      state.selectedSchemesData = action.payload;
    },
    schemesOffersResponse: (state, action) => {
      state.schemesOffersData = action.payload;
    },
    schemeChargeMasterResponse: (state, action) => {
      state.schemeChargeMasterData = action.payload;
    },
    schemeDueDayResponse: (state, action) => {
      state.schemeDueDayData = action.payload;
    },
    schemeProfitRateResponse: (state, action) => {
      state.schemeProfitRateData = action.payload;
    },
    // **** SIGNING TAB ****
    promissoryNoteResponse: (state, action) => {
      state.promissoryNoteData = action.payload;
    },
    tawarruqTransactionResponse: (state, action) => {
      state.tawarruqTransactionData = action.payload;
    },
    offerContractSigningResponse: (state, action) => {
      state.offerContractSigningData = action.payload;
    },

    // **** OFFER TAB ****
    loanOfferResponse: (state, action) => {
      state.loanOfferData = action.payload;
    },
    repaymentScheduleResponse: (state, action) => {
      state.repaymentScheduleData = action.payload;
    },
    // **** COMMENTING TAB ****

    commentsResponse: (state, action) => {
      state.commentsData = action.payload;
    },
    notificationsResponse: (state, action) => {
      state.notificationsData = action.payload;
    },
    auditTrailResponse: (state, action) => {
      state.auditTrailData = action.payload;
    },

    // **** DISBURSEMENT TAB **** */
    loanBookingResponse: (state, action) => {
      state.loanBookingData = action.payload;
    },
    loanFundingResponse: (state, action) => {
      state.loanFundingData = action.payload;
    },

    // **** Credit Tab ****
    creditDetailsResponse: (state, action) => {
      state.creditDetailsData = action.payload;
    },

    // **** REPORTS **** */
    consumerSimahReport: (state, action) => {
      state.simahReportData = action.payload;
    },
    consumerContractReport: (state, action) => {
      state.consumerContractData = action.payload;
    },
    consumerApplicationForm: (state, action) => {
      state.consumerApplFormData = action.payload;
    },

    // **** RESET TAB DATA ****
    resetTabData: (state) => {
      state.data = [];
      state.applicationData = [];
      state.customerDetailsData = [];
      state.customerAddressData = [];
      state.customerAffiliationData = [];
      state.customerBankData = [];
      state.customerExpenseMasterData = [];
      state.customerExpenseDetailsData = [];
      state.customerIdentificationData = [];
      state.customerLiabilitiesData = [];
      state.customerIncomeData = [];
      state.customerEmploymentData = [];
      state.assetDetailsData = [];
      state.selectedSchemesData = [];
      state.schemesOffersData = [];
      state.schemeChargeMasterData = [];
      state.schemeDueDayData = [];
      state.schemeProfitRateData = [];
      state.promissoryNoteData = [];
      state.tawarruqTransactionData = [];
      state.loanOfferData = [];
      state.repaymentScheduleData = [];
      state.commentsData = [];
      state.notificationsData = [];
      state.auditTrailData = [];
      state.loanBookingData = [];
      state.loanFundingData = [];
      state.offerContractSigningData = [];
      state.creditDetailsData = {
        APPLICATION_DETAILS: [],
        CREDIT_BUREAU_SUMMARY: [],
        CREDIT_ENGINE_SUMMARY: [],
        CREDIT_POLICY_DETAILS: [],
        CREDIT_POLICY_SUMMARY: [],
        REPAYMENT_SCHEDULE: [],
      };
      state.simahReportData = { data: "" };
      state.consumerContractData = { data: "" };
      state.consumerApplFormData = { data: "" };
    },
  },
});

export const {
  mainTabsData,
  applicationResponse,
  customerDetailsResponse,
  customerAddressResponse,
  customerAffiliationResponse,
  customerBankResponse,
  customerExpenseMasterResponse,
  customerExpenseDetailsResponse,
  customerIdentificationResponse,
  customerLiabilitiesResponse,
  customerIncomeResponse,
  customerEmploymentResponse,
  assetDetailsResponse,
  selectedschemesResponse,
  schemesOffersResponse,
  schemeChargeMasterResponse,
  schemeDueDayResponse,
  schemeProfitRateResponse,
  promissoryNoteResponse,
  tawarruqTransactionResponse,
  loanOfferResponse,
  repaymentScheduleResponse,
  commentsResponse,
  notificationsResponse,
  auditTrailResponse,
  loanBookingResponse,
  loanFundingResponse,
  offerContractSigningResponse,
  consumerSimahReport,
  consumerContractReport,
  consumerApplicationForm,
  creditDetailsResponse,
  resetTabData,
} = tabsControllerSlice.actions;

export default tabsControllerSlice.reducer;
export const mainTabsParams = (state) => state.mainTabs.data;

export const applicationDataResponse = (state) =>
  state.mainTabs.applicationData;
// **** CUSTOMER TABS ****
export const customerDetailsDataResponse = (state) =>
  state.mainTabs.customerDetailsData;
export const customerAddressDataResponse = (state) =>
  state.mainTabs.customerAddressData;
export const customerAffiliationDataResponse = (state) =>
  state.mainTabs.customerAffiliationData;
export const customerBankDataResponse = (state) =>
  state.mainTabs.customerBankData;
export const customerExpenseMasterDataResponse = (state) =>
  state.mainTabs.customerExpenseMasterData;
export const customerExpenseDetailsDataResponse = (state) =>
  state.mainTabs.customerExpenseDetailsData;
export const customerIdentificationDataResponse = (state) =>
  state.mainTabs.customerIdentificationData;
export const customerLiabilitiesDataResponse = (state) =>
  state.mainTabs.customerLiabilitiesData;
export const customerIncomeDataResponse = (state) =>
  state.mainTabs.customerIncomeData;
export const customerEmploymentDataResponse = (state) =>
  state.mainTabs.customerEmploymentData;
// **** ASSET TAB ****
export const assetDetailsDataResponse = (state) =>
  state.mainTabs.assetDetailsData;

// **** SCHEMES TAB ****
export const selectedSchemesDataResponse = (state) =>
  state.mainTabs.selectedSchemesData;
export const schemesOffersDataResponse = (state) =>
  state.mainTabs.schemesOffersData;
export const schemeChargeMasterDataResponse = (state) =>
  state.mainTabs.schemeChargeMasterData;
export const schemeDueDayDataResponse = (state) =>
  state.mainTabs.schemeDueDayData;
export const schemeProfitRateDataResponse = (state) =>
  state.mainTabs.schemeProfitRateData;

// **** SIGNING TAB ****
export const promissoryNoteDataResponse = (state) =>
  state.mainTabs.promissoryNoteData;
export const tawarruqTransactionDataResponse = (state) =>
  state.mainTabs.tawarruqTransactionData;
export const offerContractSigningDataResponse = (state) =>
  state.mainTabs.offerContractSigningData;

// **** OFFER TAB ****
export const loanOfferDataResponse = (state) => state.mainTabs.loanOfferData;

export const repaymentScheduleDataResponse = (state) =>
  state.mainTabs.repaymentScheduleData;

//**** COMMENT TAB  ****/

export const commentsDataResponse = (state) => state.mainTabs.commentsData;
export const notificationsDataResponse = (state) =>
  state.mainTabs.notificationsData;
export const auditTrailDataResponse = (state) => state.mainTabs.auditTrailData;

// ***** DISBURSEMENT TAB ****
export const loanBookingDataResponse = (state) =>
  state.mainTabs.loanBookingData;
export const loanFundingDataResponse = (state) =>
  state.mainTabs.loanFundingData;

// ***** CREDIT TAB ****
export const userCreditDetailsDataResponse = (state) =>
  state.mainTabs.creditDetailsData;

// ***** REPORTS ****
export const consumerSimahReportDataResponse = (state) =>
  state.mainTabs.simahReportData;
export const consumerContractDataResponse = (state) =>
  state.mainTabs.consumerContractData;
export const consumerApplicationFormDataResponse = (state) =>
  state.mainTabs.consumerApplFormData;
