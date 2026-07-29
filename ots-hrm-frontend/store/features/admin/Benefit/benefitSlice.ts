// src/features/admin/benefit/benefitSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Benefit } from "@/utils/types";

interface BenefitState {
  benefitData: Benefit[];
  benefitDetails: Benefit | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BenefitState = {
  benefitData: [],
  benefitDetails: null,
  isLoading: false,
  error: null,
};

const benefitSlice = createSlice({
  name: "benefit",
  initialState,
  reducers: {
    setBenefitData: (state, action: PayloadAction<Benefit[]>) => {
   
      state.benefitData = action.payload;
    },
    setBenefitDetails: (state, action: PayloadAction<Benefit>) => {
      state.benefitDetails = action.payload;
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
  setBenefitData,
  setBenefitDetails,
  setLoading,
  setError,
} = benefitSlice.actions;

export default benefitSlice.reducer;