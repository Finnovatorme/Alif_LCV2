import { createSlice } from "@reduxjs/toolkit";

export const ddValuesSlice = createSlice({
  name: "ddValues",
  initialState: {
    data: {},
  },
  reducers: {
    ddOptions: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
  },
});

export const { ddOptions } = ddValuesSlice.actions;
export default ddValuesSlice.reducer;
export const ddOptionsParams = (state) => state.ddValues.data;
