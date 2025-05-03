"use client";

import { useParams } from "next/navigation";
import { useGetProfileByIdQuery } from "@/redux/features/roommate/roommateApi";
import ProfileDetail from "@/components/Roommate/ProfileDetail";

export default function RoommateProfileDetailPage() {
  const { id } = useParams();
  const { data: profile, isLoading, error } = useGetProfileByIdQuery(id);

  return (
    <ProfileDetail 
      profile={profile} 
      isLoading={isLoading} 
      error={error} 
    />
  );
} 