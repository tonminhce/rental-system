"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyProfileQuery } from "@/redux/features/roommate/roommateApi";
import ProfileForm from "@/components/Roommate/ProfileForm";
import { Box, Typography, CircularProgress, Alert } from '@mui/material';

export default function RoommateProfilePage() {
  const { data: myProfile, isLoading, error } = useGetMyProfileQuery();
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && error.status !== 404) { // 404 just means profile doesn't exist yet
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Error Loading Profile
        </Typography>
        <Typography color="text.secondary">
          {error.data?.message || "There was an error loading your profile. Please try again later."}
        </Typography>
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