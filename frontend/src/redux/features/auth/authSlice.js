import { createSlice, current } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    accessToken: null,
    user: null,
    isAuthenticated: false,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.accessToken = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },

    setUserInfo: (state, action) => {
      state.accessToken = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },

    removeUserInfo: (state, action) => {
      localStorage.removeItem("accessToken"); // Remove user from localStorage
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { setUserInfo, removeUserInfo, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
