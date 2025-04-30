import { apiSlice } from "@/redux/api/apiSlice";

export const createPostApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createPost: builder.mutation({
      query: (createPostPayload) => ({
        url: "/posts",
        method: "POST",
        body: createPostPayload,
      }),
    }),
  }),
});

export const { useCreatePostMutation } = createPostApi;
