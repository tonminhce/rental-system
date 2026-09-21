"use client";

import { useGetMyProfileQuery } from "@/redux/features/roommate/roommateApi";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import ProfileForm from "@/components/Roommate/ProfileForm";
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';

export default function RoommateProfilePage() {
  const { isAuthenticated, isLoading: isGuardLoading } = useProtectedRoute();
  const { data: myProfile, isLoading, error, refetch } = useGetMyProfileQuery(null, { skip: !isAuthenticated });

  // Hold rendering until the guard resolves, otherwise the create-profile form
  // flashes for logged-out visitors before they are bounced to /login.
  if (isGuardLoading || !isAuthenticated || isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 404 just means the user hasn’t created a profile yet — show the create form.
  if (error && error.status !== 404) {
    return (
      <Box className="empty-state" sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
        <Typography variant="h6" sx={{ color: 'var(--rt-danger)' }}>
          We couldn’t load your profile.
        </Typography>
        <Typography sx={{ color: 'var(--rt-muted)' }}>
          {error.data?.message || "Please try again in a moment."}
        </Typography>
        <Button variant="outlined" color="inherit" onClick={refetch}>Try again</Button>
      </Box>
    );
  }

  // Check if we have complete profile data
  if (myProfile && (!myProfile.gender || !myProfile.lifestyle)) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your profile data may be incomplete or incorrectly formatted
        </Alert>
        <ProfileForm initialData={myProfile} isEdit={true} />
      </Box>
    );
  }

  return <ProfileForm initialData={myProfile} isEdit={!!myProfile} />;
} 