import { configureStore } from "@reduxjs/toolkit";
import snackbarReducer from "./slices/snackbarSlice";
import userTabReducer from "./slices/userTabSlice";
import mainTabsReducer from "./slices/tabsControllerSlice";
import dashboardApplReducer from "./slices/dashboardApplSlice";
import ddValuesReducer from "./slices/ddValuesSlice";
import formComponentReducer from "./slices/formComponentSlice";
import applicationReducer from "./slices/applicationSlice";

export const store = configureStore({
  reducer: {
    snackbar: snackbarReducer,
    formComponent: formComponentReducer,
    userTab: userTabReducer,
    mainTabs: mainTabsReducer,
    dashboardAppl: dashboardApplReducer,
    ddValues: ddValuesReducer,
    mainTabs: mainTabsReducer,
    application: applicationReducer,
  },
});
