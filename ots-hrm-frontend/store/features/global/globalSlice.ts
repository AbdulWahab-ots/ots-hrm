// In src/store/features/global/globalSlice.ts
import { ProfileResponse } from "@/utils/types";
import { createSlice } from "@reduxjs/toolkit";

interface GlobalState {
  isSidebarOpen: boolean;
  isLoading: boolean;
  profileData: ProfileResponse | null;
  activeSidebarItem: {
    parent: string | null;
    child: string | null;
  };
  isSidebarCollapsed: boolean;
  refreshLeaves: boolean; // Add this to trigger leave refresh
}

const initialState: GlobalState = {
  isSidebarOpen: false,
  isLoading: false,
  profileData: null,
  activeSidebarItem: {
    parent: null,
    child: null,
  },
  isSidebarCollapsed: false,
  refreshLeaves: false, // Initialize as false
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setProfileData: (state, action) => {
      state.profileData = action.payload;
    },
    setActiveSidebarItem: (state, action) => {
      state.activeSidebarItem = action.payload;
    },
    setIsSidebarCollapsed: (state, action) => {
      state.isSidebarCollapsed = action.payload;
    },
    triggerLeaveRefresh: (state) => {
      state.refreshLeaves = !state.refreshLeaves; // Toggle to trigger re-fetch
    },
  },
});

export const {
  setIsSidebarOpen,
  setIsLoading,
  setProfileData,
  setActiveSidebarItem,
  setIsSidebarCollapsed,
  triggerLeaveRefresh, // Export new action
} = globalSlice.actions;

export default globalSlice.reducer;