import baseQueryWithAuth from "@/redux/baseQueryWithAuth";
import { transformPropertiesResponse } from "@/redux/transform";
import { createApi } from "@reduxjs/toolkit/query/react";

export const landlordApi = createApi({
  reducerPath: "landlord",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    getMyProperties: builder.query({
      query: (queryObject) => ({
        url: "/posts/me",
        params: { ...queryObject },
      }),
      transformResponse: transformPropertiesResponse,
    }),

    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/posts/${postId}`,
        method: "DELETE",
      }),
    }),

    getPreviewMessages: builder.query({
      query: () => ({
        url: "/messages/previews",
        method: "GET",
      }),
    }),

    getP2PMessages: builder.query({
      query: ({ senderId, receiverId }) => ({
        url: `/messages/${senderId}/${receiverId}`,
        method: "GET",
      }),
    }),

    sendP2PMessage: builder.mutation({
      query: ({ receiverId, text }) => ({
        url: `/messages`,
        method: "POST",
        body: { text, receiverId },
      }),
    }),
  }),
});

export const {
  useLazyGetP2PMessagesQuery,
  useGetMyPropertiesQuery,
  useDeletePostMutation,
  useGetPreviewMessagesQuery,
  useSendP2PMessageMutation,
} = landlordApi;
