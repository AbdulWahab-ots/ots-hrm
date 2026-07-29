// // src/features/admin/shift/shiftSlice.ts
// import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { Shift } from "@/utils/types";

// interface ShiftState {
//   shiftData: Shift[];
//   shiftDetails: Shift | null;
//   isLoading: boolean;
//   error: string | null;
// }

// const initialState: ShiftState = {
//   shiftData: [],
//   shiftDetails: null,
//   isLoading: false,
//   error: null,
// };

// const shiftSlice = createSlice({
//   name: "shift",
//   initialState,
//   reducers: {
//     setShiftData: (state, action: PayloadAction<Shift[]>) => {
//       console.log("Setting shift data in Redux:", action.payload);
//       state.shiftData = action.payload;
//       state.isLoading = false;
//       state.error = null;
//     },
//     setShiftDetails: (state, action: PayloadAction<Shift>) => {
//       console.log("Setting shift details:", action.payload);
//       state.shiftDetails = action.payload;
//     },
//     setLoading: (state, action: PayloadAction<boolean>) => {
//       console.log("Setting shift loading state:", action.payload);
//       state.isLoading = action.payload;
//     },
//     setError: (state, action: PayloadAction<string>) => {
//       console.error("Shift error:", action.payload);
//       state.error = action.payload;
//       state.isLoading = false;
//     },
//   },
// });

// export const {
//   setShiftData,
//   setShiftDetails,
//   setLoading,
//   setError,
// } = shiftSlice.actions;

// export default shiftSlice.reducer;


// src/features/admin/shift/shiftSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Shift } from "@/utils/types";

interface ShiftState {
  shiftData: Shift[];
  shiftDetails: Shift | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ShiftState = {
  shiftData: [],
  shiftDetails: null,
  isLoading: false,
  error: null,
};

const shiftSlice = createSlice({
  name: "shift",
  initialState,
  reducers: {
    setShiftData: (state, action: PayloadAction<Shift[]>) => {

      state.shiftData = action.payload;
    },
    setShiftDetails: (state, action: PayloadAction<Shift>) => {
 
      state.shiftDetails = action.payload;
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
  setShiftData,
  setShiftDetails,
  setLoading,
  setError,
} = shiftSlice.actions;

export default shiftSlice.reducer;