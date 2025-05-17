const { fetchBaseQuery } = require("@reduxjs/toolkit/query/react");

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_RENTAL_SERVICE_BACKEND_ENDPOINT,

  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    console.log('token in authorization', token);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export default baseQueryWithAuth;
