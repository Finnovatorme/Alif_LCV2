import { createSlice, PayloadAction } from "@reduxjs/toolkit";
const initialState = {
  selectedUserId: null,
};

const userTabSlice = createSlice({
  name: "userTab",
  initialState,
  reducers: {
    setSelectedUserId: (state, action) => {
      state.selectedUserId = action.payload;
    },
    clearSelectedUserId: (state) => {
      state.selectedUserId = null;
    },
  },
});

export const { setSelectedUserId, clearSelectedUserId } = userTabSlice.actions;
export default userTabSlice.reducer;
