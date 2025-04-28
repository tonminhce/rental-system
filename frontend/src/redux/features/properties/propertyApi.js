import baseQueryWithAuth from "@/redux/baseQueryWithAuth";
import { transformPropertiesResponse } from "@/redux/transform";
import { createApi } from "@reduxjs/toolkit/query/react";

export const propertyApi = createApi({
  reducerPath: "properties",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    getProperties: builder.query({
      query: (queryObject) => ({
        url: "/posts",
        params: { ...queryObject },
      }),
      transformResponse: transformPropertiesResponse,
    }),

    getPropertyById: builder.query({
      query: (id) => ({
        url: `/posts/${id}`,
      }),
      transformResponse: (res) => res.data,
    }),

    addToFavourite: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/favourites`,
        method: "POST",
      }),
    }),

    removeFromFavourite: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/favourites`,
        method: "DELETE",
      }),
    }),

    getFavourites: builder.query({
      query: () => ({
        url: "/posts/favourites",
      }),
      transformResponse: transformPropertiesResponse,
    }),
  }),
});

export const {
  useGetPropertiesQuery,
  useGetPropertyByIdQuery,
  useGetFavouritesQuery,
  useAddToFavouriteMutation,
  useRemoveFromFavouriteMutation,
} = propertyApi;
