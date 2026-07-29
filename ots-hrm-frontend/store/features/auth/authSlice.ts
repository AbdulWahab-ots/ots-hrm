import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    token: null
};

const authSlice = createSlice({
  name: 'auth',
    initialState, 
    reducers: {
        setUser: (state, action) => {
            if (action.payload) {
                state.user = action.payload.result;
                state.token = action.payload.access_token;
            } else {
                state.user = null;
                state.token = null;
            }
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
        }
    }
});

export const { setUser, logout } = authSlice.actions;

export default authSlice.reducer;