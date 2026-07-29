import { createSlice } from "@reduxjs/toolkit";
import { LeaveType } from "@/utils/types";

interface LeaveTypeState {
  leaveTypeData: LeaveType[] | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LeaveTypeState = {
  leaveTypeData: null,
  isLoading: false,
  error: null,
};

const leaveTypeSlice = createSlice({
  name: "leaveType",
  initialState,
  reducers: {
    setLeaveTypeData: (state, action) => {
      console.log("Setting leave type data:", action.payload);
      state.leaveTypeData = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLeaveTypeLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setLeaveTypeError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setLeaveTypeData, setLeaveTypeLoading, setLeaveTypeError } = leaveTypeSlice.actions;

export default leaveTypeSlice.reducer;