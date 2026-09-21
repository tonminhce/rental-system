"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";
const RentalMap = dynamic(() => import("@/components/GetPropertiesPage/components/Map"), { ssr: false });
export default function PostMap({ coordinates }) {
  const lng = Number(coordinates?.[0]) || 106.701;
  const lat = Number(coordinates?.[1]) || 10.786;
  const center = useMemo(() => [lng, lat], [lng, lat]);
  return (
    <div style={{ width: "100%", height: 320, borderRadius: 12, overflow: "hidden" }}>
      <RentalMap center={center} />
    </div>
  );
}
