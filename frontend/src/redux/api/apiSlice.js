import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithAuth from "@/redux/baseQueryWithAuth";

export const apiSlice = createApi({
  tagTypes: ["Roommates", "Profile", "MyProfile"],
  baseQuery: baseQueryWithAuth,
  endpoints: () => ({}),
});
