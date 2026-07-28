// import { createSlice } from "@reduxjs/toolkit";

// export const formComponentSlice = createSlice({
//   name: "formComponent",
//   initialState: {
//     viewParams: {},
//     deleteParams: {},
//     editParams: {},
//   },
//   reducers: {
//     gridActionsRedux: (state, action) => {
//       switch (action.payload.type) {
//         case "view":
//           state.viewParams = action.payload.data;
//           break;
//         case "edit":
//           state.editParams = action.payload.data;
//           break;
//         case "delete":
//           state.deleteParams = action.payload.data;
//           break;
//         default:
//           break;
//       }
//     },
//   },
// });

// // Action creators are generated for each case reducer function
// export const { gridActionsRedux } = formComponentSlice.actions;

// export default formComponentSlice.reducer;
// export const viewModalHandlerRedux = (state, action) =>
//   state.formComponent.viewParams;
// export const editDataHandlerRedux = (state, action) =>
//   state.formComponent.editParams;
// export const deleteModalHandlerRedux = (state, action) =>
//   state.formComponent.deleteParams;

import { createSlice } from "@reduxjs/toolkit";

export const formComponentSlice = createSlice({
  name: "formComponent",
  initialState: {
    viewParams: {},
    deleteParams: {},
    editParams: {},
    gridSelectedRowsParams: {},
    newSelectedRows: [],
  },
  reducers: {
    gridActionsRedux: (state, action) => {
      switch (action.payload.type) {
        case "view":
          state.viewParams = action.payload.data;
          break;
        case "edit":
          state.editParams = action.payload.data;
          break;
        case "delete":
          state.deleteParams = action.payload.data;
          break;
        case "gridSelectedRows":
          if (action.payload.resetKey) {
            const keyToReset = action.payload.resetKey;
            state.gridSelectedRowsParams = {
              ...state.gridSelectedRowsParams,
              [keyToReset]: [],
            };
          } else {
            const groupedData = action.payload.data.reduce((acc, item) => {
              const type = item.selectionInAccordance;
              if (action.payload.data.length > 0) {
                if (!acc[type]) acc[type] = [];
                acc[type].push(item);
                return acc;
              } else {
                return (acc[type] = []);
              }
            }, {});

            state.gridSelectedRowsParams = {
              ...state.gridSelectedRowsParams,
              ...groupedData,
            };
          }
          // const groupedData = action.payload.data.reduce((acc, item) => {
          //   const type = item.selectionInAccordance;
          //   if (action.payload.data.length > 0) {
          //     if (!acc[type]) acc[type] = [];
          //     acc[type].push(item);
          //     return acc;
          //   } else {
          //     return (acc[type] = []);
          //   }
          // }, {});

          // state.gridSelectedRowsParams = {
          //   ...state.gridSelectedRowsParams,
          //   ...groupedData,
          // };
          break;
        default:
          break;
      }
    },
  },
});

export const { gridActionsRedux } = formComponentSlice.actions;

export default formComponentSlice.reducer;
export const viewModalHandlerRedux = (state, action) =>
  state.formComponent.viewParams;
export const editDataHandlerRedux = (state, action) =>
  state.formComponent.editParams;
export const deleteModalHandlerRedux = (state, action) =>
  state.formComponent.deleteParams;
export const gridSelectedRowHandlerRedux = (state, action) =>
  state.formComponent.gridSelectedRowsParams;
