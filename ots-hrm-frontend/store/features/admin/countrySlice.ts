import { createSlice } from "@reduxjs/toolkit";
import { GetCountriesResponse } from "@/utils/types";

interface CountryState {
  countryData: GetCountriesResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CountryState = {
  countryData: null,
  isLoading: false,
  error: null,
};

const countrySlice = createSlice({
  name: "country",
  initialState,
  reducers: {
    setCountryData: (state, action) => {
      state.countryData = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setCountryLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCountryError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setCountryData, setCountryLoading, setCountryError } = countrySlice.actions;

export default countrySlice.reducer;