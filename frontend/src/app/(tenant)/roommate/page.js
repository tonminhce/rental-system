"use client";
import { Box, Typography, Button, CircularProgress, Tab, Tabs, Alert, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import { useState } from "react";
import {
  useGetAllProfilesQuery,
  useGetRoommateSuggestionsQuery,
  useGetMyProfileQuery,
} from "@/redux/features/roommate/roommateApi";
import Link from "next/link";
import RoommateList from "@/components/Roommate/RoommateList";

export default function RoommatePage() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [activeTab, setActiveTab] = useState("all");
  const all = useGetAllProfilesQuery();
  const own = useGetMyProfileQuery(null, { skip: !isAuthenticated });
  const suggestions = useGetRoommateSuggestionsQuery(null, {
    skip: !isAuthenticated || !own.data || activeTab !== "suggestions",
  });
  const current = activeTab === "all" ? all : suggestions;
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 0, md: 2 }, py: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        gap={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography component="p" className="eyebrow" sx={{ mb: 1 }}>
            Community · Co-living
          </Typography>
          <Typography component="h1" variant="h4">
            Find your kind of roommate.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Explore shared habits, schedules, and ways of living.
          </Typography>
        </Box>
        <Button component={Link} href="/roommate/profile" variant="contained">
          {own.data ? "Update my profile" : "Create my profile"}
        </Button>
      </Stack>
      {own.error && (
        <Alert severity="warning" action={<Button onClick={own.refetch}>Retry</Button>} sx={{ mb: 2 }}>
          We couldn’t load your profile. You can still browse the community.
        </Alert>
      )}
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        aria-label="Roommate profiles"
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab label="All profiles" value="all" />
        <Tab label="Suggested for you" value="suggestions" />
      </Tabs>
      {activeTab === "suggestions" && !own.data && !own.isLoading && !own.error ? (
        <Alert
          severity="info"
          action={
            <Button component={Link} href="/roommate/profile">
              Create profile
            </Button>
          }
        >
          Create your roommate profile first so we can compare your preferences.
        </Alert>
      ) : current.isFetching || (activeTab === "suggestions" && own.isLoading) ? (
        <Box role="status" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, py: 8 }}>
          <CircularProgress size={24} /> Loading profiles…
        </Box>
      ) : (
        <RoommateList
          profiles={current.data}
          isError={current.error}
          onRetry={current.refetch}
          isSuggestion={activeTab === "suggestions"}
          emptyMessage={
            activeTab === "all"
              ? "No roommate profiles yet."
              : "No suggested roommates yet. Check back as the community grows."
          }
        />
      )}
    </Box>
  );
}
