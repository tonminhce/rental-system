import { apiSlice } from "@/redux/api/apiSlice";

export const roommateApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllProfiles: builder.query({
      query: () => ({
        url: "/roommate",
        method: "GET",
      }),
      transformResponse: (response) => {
        return response.data.profiles;
      },
      providesTags: ["Roommates"],
    }),

    getRoommateSuggestions: builder.query({
      query: () => {
        return {
          url: `/roommate/suggestions`,
          method: "GET",
        };
      },
      transformResponse: (response) => {
        return response.data.suggestions;
      },
      providesTags: (result) => result ? ["Roommates"] : [],
      transformErrorResponse: (response) => {
        return response;
      },
      extraOptions: { maxRetries: 1 },
    }),

    getProfileById: builder.query({
      query: (profileId) => ({
        url: `/roommate/${profileId}`,
        method: "GET",
      }),
      transformResponse: (response) => {
        return response.data.profile;
      },
      providesTags: (result, error, id) => [{ type: "Profile", id }],
    }),

    getMyProfile: builder.query({
      query: () => ({
        url: "/roommate/profile/me",
        method: "GET",
      }),
      transformResponse: (response) => {
        return response.data.profile;
      },
      transformErrorResponse: (response) => {
        return response;
      },
      providesTags: ["MyProfile"],
      extraOptions: { 
        maxRetries: 1 
      },
    }),

    createOrUpdateProfile: builder.mutation({
      query: (profileData) => ({
        url: "/roommate",
        method: "POST",
        body: profileData,
      }),
      transformResponse: (response) => {
        return response.data.profile;
      },
      invalidatesTags: ["Roommates", "Profile", "MyProfile"],
    }),
  }),
});

export const {
  useGetAllProfilesQuery,
  useGetRoommateSuggestionsQuery,
  useGetProfileByIdQuery,
  useGetMyProfileQuery,
  useCreateOrUpdateProfileMutation,
} = roommateApi; 