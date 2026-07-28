import { createSlice } from "@reduxjs/toolkit";

export const dashboardApplSlice = createSlice({
  name: "dashboardAppl",
  initialState: {
    data: {},
    language: 1,
  },
  reducers: {
    // HAS DASHBOARD PARAMETERS
    hasDashabordParams(state, action) {
      state.data = action.payload;
    },

    hasLanguageParams(state, action) {
      state.language = action.payload;
    },
  },
});

// Reducer
export default dashboardApplSlice.reducer;

export const { hasDashabordParams, hasLanguageParams } =
  dashboardApplSlice.actions;
export const dashboardParams = (state) => state.dashboardAppl.data;
export const languageParams = (state) => state.dashboardAppl.language;
