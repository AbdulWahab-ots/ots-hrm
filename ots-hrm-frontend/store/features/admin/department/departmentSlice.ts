// features/admin/department/departmentSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Department } from "@/utils/types";

interface DepartmentState {
  departmentData: Department[];
  departmentDetails: Department | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DepartmentState = {
  departmentData: [],
  departmentDetails: null,
  isLoading: false,
  error: null,
};

const departmentSlice = createSlice({
  name: 'department',
  initialState,
  reducers: {
    setDepartmentData: (state, action: PayloadAction<Department[]>) => {
      // console.log("Setting department data:", action.payload);
      state.departmentData = action.payload;
    },
    setDepartmentDetails: (state, action: PayloadAction<Department>) => {
      state.departmentDetails = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    }
  }
});

export const { 
  setDepartmentData, 
  setDepartmentDetails,
  setLoading,
  setError
} = departmentSlice.actions;

export default departmentSlice.reducer;