import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    roleDetails: null
};

const rolesSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {
        setRoleDetails: (state, action) => {
            state.roleDetails = action.payload;
        }
    }
});

export const { setRoleDetails } = rolesSlice.actions;

export default rolesSlice.reducer;
