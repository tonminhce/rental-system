"use client";
import dynamic from "next/dynamic";
import { Alert, Skeleton } from "@mui/material";
const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={320} />,
});
export default function PostMap({ coordinates }) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(Number.isFinite)) {
    return <Alert severity="info">Location not provided. Ask the source for the address.</Alert>;
  }
  return <LocationMap coordinates={coordinates} />;
}
