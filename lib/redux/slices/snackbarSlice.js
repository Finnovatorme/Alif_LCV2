import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notificationModal: { message: "", variant: "", display: false },
};

const snackbarSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    responseModal: (state, action) => {
      state.notificationModal = {
        ...state.notificationModal,
        ...action.payload,
      };
    },
  },
});

export const { responseModal } = snackbarSlice.actions;
export default snackbarSlice.reducer;

export const responseModalState = (state) => state.snackbar.notificationModal;
