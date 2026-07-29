import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Attendance } from "@/utils/types";

interface AttendanceState {
  attendanceData: Attendance[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  attendanceData: [],
  isLoading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    setAttendanceData: (state, action: PayloadAction<Attendance[]>) => {
      state.attendanceData = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setAttendanceData, setLoading, setError } = attendanceSlice.actions;
export default attendanceSlice.reducer;