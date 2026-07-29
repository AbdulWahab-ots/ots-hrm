import { createSlice } from "@reduxjs/toolkit";

interface AttendanceRequest {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  code: string;
  userId: string;
  attendanceId: string;
  type: "CHECK_IN" | "CHECK_OUT";
  date: string;
  time: string;
  reason: string;
  status: "APPROVED" | "PENDING" | "CANCELED";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

interface AttendanceRequestState {
  attendanceRequestData: AttendanceRequest[] | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AttendanceRequestState = {
  attendanceRequestData: null,
  isLoading: false,
  error: null,
};

const attendanceRequestSlice = createSlice({
  name: "attendanceRequest",
  initialState,
  reducers: {
    setAttendanceRequestData: (state, action) => {
      state.attendanceRequestData = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setAttendanceRequestLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setAttendanceRequestError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setAttendanceRequestData, setAttendanceRequestLoading, setAttendanceRequestError } =
  attendanceRequestSlice.actions;

export default attendanceRequestSlice.reducer;