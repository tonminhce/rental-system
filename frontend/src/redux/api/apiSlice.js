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

  // Check if the result is an error due to token expiration (401 status with TOKEN_EXPIRED code)
  if (
    result?.error?.status === 401 && 
    result?.error?.data?.code === 'TOKEN_EXPIRED' && 
    !args.url.includes('/auth/refresh-token')
  ) {
    console.log("Access token expired, attempting to refresh token");
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.log("No refresh token available");
      api.dispatch(removeUserInfo());
      return result;
    }
    
    try {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh-token',
          method: 'POST',
          body: { refreshToken }
        }, 
        api, 
        extraOptions
      );
      
      if (refreshResult?.data?.data) {
        const { token: newToken, refreshToken: newRefreshToken, user } = refreshResult.data.data;
        
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        api.dispatch(
          setUserInfo({ 
            token: newToken,
            refreshToken: newRefreshToken,
            user: user || api.getState().auth.user
          })
        );
        
        const newHeaders = new Headers(args.headers);
        newHeaders.set('Authorization', `Bearer ${newToken}`);
        
        result = await baseQuery(
          {
            ...args,
            headers: newHeaders
          }, 
          api, 
          extraOptions
        );
      } else {
        console.log("Token refresh failed");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        api.dispatch(removeUserInfo());
      }
    } catch (error) {
      console.error("Error during token refresh:", error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      api.dispatch(removeUserInfo());
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReAuthentication,
  endpoints: (builder) => ({}),
});
