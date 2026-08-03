import { createSlice } from "@reduxjs/toolkit";

export const adminConfigLCSlice = createSlice({
  name: "adminConfig",
  initialState: {
    targetScreen: [],
  },
  reducers: {
    targetScreenData(state, action) {
      state.targetScreen = action.payload;
    },
    resetTabData: (state) => {
      state.targetScreen = [];
    },
  },
});

export default adminConfigLCSlice.reducer;
export const { targetScreenData, resetTabData } = adminConfigLCSlice.actions;
export const targetScreenState = (state) => state.adminConfig.targetScreen;
