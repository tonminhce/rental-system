import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setUserInfo, removeUserInfo } from "@/redux/features/auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_RENTAL_SERVICE_BACKEND_ENDPOINT,

  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Create a new API with the baseQuery and the auth endpoints
const baseQueryWithReAuthentication = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // if the result is an error, and the error is a 401, try to refresh the token
  if (result?.error?.originalStatus === 401) {
    console.log("sending refresh token");
    // refresh the token
    const refreshResult = await baseQuery("/auth/refresh", api, extraOptions);
    console.log("refreshResult", refreshResult);

    if (refreshResult?.data) {
      // store the new token in the store
      api.dispatch(
        setUserInfo({ ...auth, accessToken: refreshResult.data.accessToken })
      );
      // if the refresh was successful, retry the initial request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // if the refresh failed, log the user out
      console.log("refresh failed");
      api.dispatch(removeUserInfo());
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReAuthentication,
  endpoints: (builder) => ({}),
});
