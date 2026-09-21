import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setUserInfo, removeUserInfo } from "./features/auth/authSlice";
import { withReauthentication } from "./reauthQuery.mjs";

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_RENTAL_SERVICE_BACKEND_ENDPOINT,

  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export default withReauthentication(baseQueryWithAuth, { setUserInfo, removeUserInfo });
