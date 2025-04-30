import { createSlice, current } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.accessToken = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },

    setUserInfo: (state, action) => {
      state.accessToken = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user || state.user;
      state.isAuthenticated = true;
    },

    removeUserInfo: (state, action) => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    },
  },
});

export const { setUserInfo, removeUserInfo, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
