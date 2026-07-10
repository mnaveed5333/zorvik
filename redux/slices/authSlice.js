import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  vendor: null,
  admin: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setVendor: (state, action) => {
      state.vendor = action.payload;
      state.isAuthenticated = true;
    },
    mergeVendor: (state, action) => {
      // Partial update — merges new fields onto existing vendor
      // instead of replacing the whole object. Use this after
      // request-change/cancel-request/whatsapp-update calls so
      // other pages relying on vendor.id/shopId etc. don't break.
      state.vendor = { ...state.vendor, ...action.payload };
    },
    setAdmin: (state, action) => {
      state.admin = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.vendor = null;
      state.admin = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, setVendor, mergeVendor, setAdmin, logout } = authSlice.actions;
export default authSlice.reducer;