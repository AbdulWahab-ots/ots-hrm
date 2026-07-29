// // import { createSlice } from "@reduxjs/toolkit";

// // const initialState = {
// //     designationData: null,
// //     designationDetails: null,
// // };

// // const designationSlice = createSlice({
// //     name: 'designation',
// //     initialState,
// //     reducers: {
// //         setDesignationData: (state, action) => {
// //             state.designationData = action.payload;
// //         },
// //         setDesignationDetails: (state, action) => {
// //             state.designationDetails = action.payload;
// //         }
// //     }
// // });

// // export const { setDesignationData, setDesignationDetails } = designationSlice.actions;

// // export default designationSlice.reducer;

// // src/features/admin/designation/designationSlice.ts
// import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { Designation } from "@/utils/types";

// interface DesignationState {
//   designationData: Designation[];
//   designationDetails: Designation | null;
//   isLoading: boolean;
//   error: string | null;
// }

// const initialState: DesignationState = {
//   designationData: [],
//   designationDetails: null,
//   isLoading: false,
//   error: null,
// };

// const designationSlice = createSlice({
//   name: "designation",
//   initialState,
//   reducers: {
//     setDesignationData: (state, action: PayloadAction<Designation[]>) => {
//       console.log("Setting designation data:", action.payload);
//       state.designationData = action.payload;
//     },
//     setDesignationDetails: (state, action: PayloadAction<Designation>) => {
//       state.designationDetails = action.payload;
//     },
//     setLoading: (state, action: PayloadAction<boolean>) => {
//       state.isLoading = action.payload;
//     },
//     setError: (state, action: PayloadAction<string>) => {
//       state.error = action.payload;
//     },
//   },
// });

// export const {
//   setDesignationData,
//   setDesignationDetails,
//   setLoading,
//   setError,
// } = designationSlice.actions;

// export default designationSlice.reducer;


// src/features/admin/designation/designationSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Designation } from "@/utils/types";

interface DesignationState {
  designationData: Designation[];
  designationDetails: Designation | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DesignationState = {
  designationData: [],
  designationDetails: null,
  isLoading: false,
  error: null,
};

const designationSlice = createSlice({
  name: "designation",
  initialState,
  reducers: {
    setDesignationData: (state, action: PayloadAction<Designation[]>) => {

      state.designationData = action.payload;
    },
    setDesignationDetails: (state, action: PayloadAction<Designation>) => {
     
      state.designationDetails = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
    
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
    
      state.error = action.payload;
    },
  },
});

export const {
  setDesignationData,
  setDesignationDetails,
  setLoading,
  setError,
} = designationSlice.actions;

export default designationSlice.reducer;